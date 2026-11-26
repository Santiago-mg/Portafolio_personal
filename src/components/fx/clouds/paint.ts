/**
 * Cloud painter. Each layer is a heap of near-spherical "lobes" (big masses with smaller lobes
 * budding on their upper side, like cauliflower cumulus), pushed around by domain-warped fBm.
 * Coverage (the silhouette) and height (the relief) are separate fields: the relief is lit
 * from the upper left with wrap diffuse, a short shadow march and cavity occlusion, then
 * mapped through a painter's ramp (cool blue-grey undersides, putty mid-tones, ivory lights
 * with a little peach) and roughened with dabs, brush streaks and grain.
 *
 * Work is a generator that yields every few rows, so the caller can slice it into idle time.
 * Two palettes come out of one relief pass: the gallery daylight and the dusk of the last room.
 */

import { clamp01, fbm, hash2, rng, simplex, smooth } from './noise';

export type LayerKey = 'haze' | 'bank' | 'left' | 'right';
export const LAYER_KEYS: readonly LayerKey[] = ['haze', 'bank', 'left', 'right'];

/** Texture size at quality 1 (px). The layer boxes (choreo.ts) keep these aspect ratios. */
export const LAYER_SIZE: Record<LayerKey, readonly [number, number]> = {
  haze: [1024, 320],
  bank: [1280, 400],
  left: [1024, 640],
  right: [1024, 640],
};

/** A lobe: centre, radius, depth offset, vertical squash, relief scale; buds swell the surface of their parent. */
type Puff = { x: number; y: number; r: number; z: number; sy: number; hz: number; bud?: boolean };

type Spec = {
  seed: number;
  puffs: (r: () => number, aspect: number) => Puff[];
  /** flat cloud base: alpha fades from `base` to `base + baseSoft` (fractions of the height) */
  base: number;
  baseSoft: number;
  /** soft, slightly wavering flat base (cumulus are flat underneath) instead of a plain fade */
  flatBase?: boolean;
  /** 0..1: patches of lower opacity inside the mass (wispy layers) */
  thin?: number;
  /** [top, bottom, soft]: a band that is always fully opaque (the bank hides the room cut) */
  core?: readonly [number, number, number];
  /** silhouette breakup and relief bumps (height units) */
  edgeAmp: number;
  bumpAmp: number;
  /** detail noise frequency, per texture height */
  freq: number;
  warp: number;
  warpFreq: number;
  /** edge softness on the lit top and on the shaded underside */
  soft: readonly [number, number];
  ambient: number;
  alpha: number;
  /** 0..1: aerial perspective (flatter, cooler, paler) */
  aerial: number;
  /** horizontal alpha ramps [inFrom, inTo, outFrom, outTo] as fractions of the width */
  fadeX?: readonly [number, number, number, number];
};

/* ---------- lobe builders ---------- */

/** Piecewise-linear envelope through [x, y] points. */
function envelope(pts: readonly (readonly [number, number])[]): (x: number) => number {
  return (x) => {
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (x <= pts[i][0]) {
        const [x0, y0] = pts[i - 1];
        const [x1, y1] = pts[i];
        return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
      }
    }
    return pts[pts.length - 1][1];
  };
}

/** Bud smaller lobes on the upper side of each lobe, `depth` generations, under the `crest`. */
function bud(r: () => number, roots: Puff[], crest: (x: number) => number, depth: number, per: [number, number]): Puff[] {
  const out = roots.slice();
  let level = roots;
  for (let d = 0; d < depth; d++) {
    const next: Puff[] = [];
    for (const p of level) {
      const k = per[0] + Math.floor(r() * (per[1] - per[0] + 1));
      for (let i = 0; i < k; i++) {
        const a = -Math.PI * (0.1 + 0.8 * r()); // upper hemisphere (y grows downwards)
        const cr = p.r * (0.38 + 0.22 * r());
        const dist = p.r * (0.58 + 0.3 * r());
        const cx = p.x + Math.cos(a) * dist;
        const cy = p.y + Math.sin(a) * dist * p.sy;
        if (cy - cr < crest(cx)) continue;
        const dx = cx - p.x;
        const dy = (cy - p.y) / p.sy;
        const q = Math.min(1, (dx * dx + dy * dy) / (p.r * p.r));
        const surf = p.z + p.r * p.hz * (1 - q) * (1 + 0.6 * q);
        next.push({ x: cx, y: cy, r: cr, z: surf - cr * (0.62 + 0.18 * r()), sy: 1, hz: 0.7 + 0.3 * r(), bud: true });
      }
    }
    out.push(...next);
    level = next;
  }
  return out;
}

/** A row of root lobes along a base line, radius from `rad(x)`. */
function roots(r: () => number, x0: number, x1: number, base: number, rad: (x: number) => number, lift = 0.38): Puff[] {
  const out: Puff[] = [];
  let x = x0;
  while (x < x1) {
    const rr = rad(x) * (0.86 + 0.28 * r());
    out.push({ x: x + (r() - 0.5) * rr * 0.3, y: base - rr * lift + (r() - 0.5) * rr * 0.2, r: rr, z: r() * 0.015, sy: 1, hz: 0.75 + 0.25 * r() });
    x += rr * (0.62 + 0.3 * r());
  }
  return out;
}

const SPECS: Record<LayerKey, Spec> = {
  // Far cumulus: a low, distant line of small lobes, pale and soft (aerial perspective).
  haze: {
    seed: 11,
    puffs: (r, w) => {
      const crest = envelope([[0, 0.3], [0.6, 0.14], [1.2, 0.32], [1.9, 0.12], [2.5, 0.26], [3.3, 0.2]]);
      const line = roots(r, -0.1, w + 0.1, 0.8, (x) => 0.13 + 0.1 * (0.5 + 0.5 * Math.sin(x * 2.3 + 2)), 0.3);
      for (const p of line) {
        p.sy = 0.72;
        p.hz = 0.6;
      }
      return bud(r, line, crest, 2, [1, 3]);
    },
    base: 0.8,
    baseSoft: 0.14,
    flatBase: true,
    thin: 0.25,
    edgeAmp: 0.03,
    bumpAmp: 0.008,
    freq: 5,
    warp: 0.06,
    warpFreq: 1.8,
    soft: [0.018, 0.06],
    ambient: 0.5,
    alpha: 0.72,
    aerial: 0.55,
    fadeX: [0, 0.12, 0.88, 1],
  },
  // The bank that sits on the room seam: a full-width opaque band with billows on top.
  bank: {
    seed: 23,
    puffs: (r, w) => {
      const crest = envelope([[0, 0.2], [0.5, 0.08], [1, 0.22], [1.5, 0.12], [2.1, 0.26], [2.6, 0.1], [3.3, 0.18]]);
      const lower = roots(r, -0.3, w + 0.3, 0.86, () => 0.3, 0.62);
      const upper = roots(r, -0.2, w + 0.2, 0.62, (x) => 0.12 + 0.12 * (0.5 + 0.5 * Math.sin(x * 2.3 + 1)), 0.2);
      for (const p of upper) p.z = 0.02 + r() * 0.04;
      return bud(r, lower.concat(upper), crest, 2, [1, 3]);
    },
    base: 0.87,
    baseSoft: 0.1,
    flatBase: true,
    core: [0.52, 0.82, 0.06],
    edgeAmp: 0.03,
    bumpAmp: 0.008,
    freq: 6,
    warp: 0.05,
    warpFreq: 2.2,
    soft: [0.008, 0.04],
    ambient: 0.26,
    alpha: 1,
    aerial: 0.18,
  },
  // Near billows, towering on the left; their right flank is the leading edge.
  left: {
    seed: 37,
    puffs: (r) => {
      const crest = envelope([[-0.2, 0.22], [0.2, 0.1], [0.46, 0.04], [0.75, 0.16], [1.05, 0.34], [1.35, 0.5], [1.7, 0.78]]);
      const rad = envelope([[-0.2, 0.3], [0.2, 0.32], [0.5, 0.3], [0.9, 0.24], [1.3, 0.15], [1.5, 0.1]]);
      const base = roots(r, -0.25, 1.42, 0.86, rad, 0.45);
      const tower = roots(r, 0.05, 0.85, 0.5, envelope([[0, 0.17], [0.45, 0.22], [0.85, 0.12]]), 0.3);
      for (const p of tower) p.z = 0.03 + r() * 0.04;
      return bud(r, base.concat(tower), crest, 2, [1, 3]);
    },
    base: 0.85,
    baseSoft: 0.1,
    flatBase: true,
    edgeAmp: 0.028,
    bumpAmp: 0.008,
    freq: 5.2,
    warp: 0.05,
    warpFreq: 2,
    soft: [0.007, 0.04],
    ambient: 0.2,
    alpha: 1,
    aerial: 0,
    fadeX: [-1, 0, 0.87, 0.985],
  },
  // Mirror composition on the right, lit from the same side (never a flipped copy).
  right: {
    seed: 53,
    puffs: (r, w) => {
      const crest = envelope([[-0.1, 0.8], [0.25, 0.52], [0.55, 0.32], [0.85, 0.14], [1.12, 0.06], [1.4, 0.12], [1.8, 0.2]]);
      const rad = envelope([[0.1, 0.1], [0.35, 0.15], [0.75, 0.24], [1.1, 0.3], [1.5, 0.32], [1.8, 0.3]]);
      const base = roots(r, 0.16, w + 0.25, 0.86, rad, 0.45);
      const tower = roots(r, 0.72, 1.55, 0.5, envelope([[0.7, 0.12], [1.1, 0.22], [1.55, 0.17]]), 0.3);
      for (const p of tower) p.z = 0.03 + r() * 0.04;
      return bud(r, base.concat(tower), crest, 2, [1, 3]);
    },
    base: 0.85,
    baseSoft: 0.1,
    flatBase: true,
    edgeAmp: 0.028,
    bumpAmp: 0.008,
    freq: 5.2,
    warp: 0.05,
    warpFreq: 2,
    soft: [0.007, 0.04],
    ambient: 0.2,
    alpha: 1,
    aerial: 0,
    fadeX: [0.015, 0.13, 2, 3],
  },
};

/* ---------- palettes ---------- */

type Stop = readonly [number, number, number, number];
const hex = (t: number, h: string): Stop => [t, parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

type Palette = { ramp: Stop[]; cool: Stop; warm: Stop; warmAmt: number; air: Stop };
const DAY: Palette = {
  ramp: [
    hex(0, '#56626a'), hex(0.18, '#6f7b80'), hex(0.34, '#8e979a'), hex(0.5, '#a9aba5'),
    hex(0.64, '#c4c0b4'), hex(0.77, '#d4cec0'), hex(0.89, '#ebe3d2'), hex(1, '#f7f1e3'),
  ],
  cool: hex(0, '#76838a'),
  warm: hex(0, '#e8c9b3'),
  warmAmt: 0.5,
  air: hex(0, '#b9bab3'),
};
const DUSK: Palette = {
  ramp: [
    hex(0, '#1f2b2b'), hex(0.2, '#2b3a38'), hex(0.38, '#3d4e4a'), hex(0.52, '#58655e'),
    hex(0.66, '#6f746b'), hex(0.78, '#8a8074'), hex(0.9, '#aa9182'), hex(1, '#caa58f'),
  ],
  cool: hex(0, '#3a4d4b'),
  warm: hex(0, '#d9a58a'),
  warmAmt: 0.3,
  air: hex(0, '#4a5c57'),
};

function rampAt(ramp: Stop[], t: number, out: Float32Array): void {
  if (t <= 0) t = 0;
  else if (t >= 1) t = 1;
  let i = 1;
  while (i < ramp.length - 1 && t > ramp[i][0]) i++;
  const a = ramp[i - 1];
  const b = ramp[i];
  const f = (t - a[0]) / (b[0] - a[0]);
  out[0] = a[1] + (b[1] - a[1]) * f;
  out[1] = a[2] + (b[2] - a[2]) * f;
  out[2] = a[3] + (b[3] - a[3]) * f;
}

/* ---------- the painter ---------- */

export type PaintedLayer = { w: number; h: number; day: ImageData; dusk: ImageData };

const TILE = 16;
// light from the upper left, in front: image y grows downwards
const LX = -0.46;
const LY = -0.66;
const LZ = 0.6;
const LN = Math.hypot(LX, LY, LZ);
const L0 = LX / LN;
const L1 = LY / LN;
const L2 = LZ / LN;
const MARCH = [2, 4, 7, 11, 16, 23, 32, 44];

function smin(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
function smax(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + h * h * k * 0.25;
}

/** Separable box blur, run twice (≈ triangle). Yields between rows. */
function* blur(src: Float32Array, w: number, h: number, rad: number): Generator<void, Float32Array> {
  const a = new Float32Array(src.length);
  const b = new Float32Array(src.length);
  const inv = 1 / (rad * 2 + 1);
  let s = src;
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < h; y++) {
      const o = y * w;
      let acc = 0;
      for (let k = -rad; k <= rad; k++) acc += s[o + Math.min(w - 1, Math.max(0, k))];
      for (let x = 0; x < w; x++) {
        a[o + x] = acc * inv;
        acc += s[o + Math.min(w - 1, x + rad + 1)] - s[o + Math.max(0, x - rad)];
      }
      if ((y & 31) === 31) yield;
    }
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let k = -rad; k <= rad; k++) acc += a[Math.min(h - 1, Math.max(0, k)) * w + x];
      for (let y = 0; y < h; y++) {
        b[y * w + x] = acc * inv;
        acc += a[Math.min(h - 1, y + rad + 1) * w + x] - a[Math.max(0, y - rad) * w + x];
      }
      if ((x & 63) === 63) yield;
    }
    s = b.slice();
  }
  return s;
}

/**
 * Paints one layer at `quality` (1 = LAYER_SIZE). Yields roughly every 2–6 ms of work;
 * returns both palettes as ImageData.
 */
export function* paintLayer(key: LayerKey, quality: number): Generator<void, PaintedLayer> {
  const spec = SPECS[key];
  const w = Math.round(LAYER_SIZE[key][0] * quality);
  const h = Math.round(LAYER_SIZE[key][1] * quality);
  const aspect = w / h;
  const r = rng(spec.seed);
  const puffs = spec.puffs(r, aspect);
  const n = puffs.length;
  const PX = new Float32Array(n);
  const PY = new Float32Array(n);
  const PR = new Float32Array(n);
  const PZ = new Float32Array(n);
  const PS = new Float32Array(n); // 1 / sy
  const PH = new Float32Array(n);
  const PB = new Uint8Array(n);
  puffs.forEach((p, i) => {
    PX[i] = p.x; PY[i] = p.y; PR[i] = p.r; PZ[i] = p.z; PS[i] = 1 / p.sy; PH[i] = p.hz; PB[i] = p.bud ? 1 : 0;
  });

  const nWarpA = simplex(spec.seed * 7 + 1);
  const nWarpB = simplex(spec.seed * 7 + 2);
  const nDetail = simplex(spec.seed * 7 + 3);
  const nPaint = simplex(spec.seed * 7 + 4);
  const nStroke = simplex(spec.seed * 7 + 5);
  const nBump = simplex(spec.seed * 7 + 6);

  const KS = 0.045; // smooth union of silhouettes
  const KH = 0.08; // smooth max of reliefs
  const margin = KS + spec.edgeAmp + spec.soft[1] + spec.warp * 1.2;
  const cov = new Float32Array(w * h); // signed distance-ish to the silhouette (negative inside)
  const hgt = new Float32Array(w * h); // relief
  cov.fill(1);

  /* warp field on a coarse grid (it is low frequency), bilinear per pixel */
  const G = 4;
  const gw = Math.ceil(w / G) + 2;
  const gh = Math.ceil(h / G) + 2;
  const WU = new Float32Array(gw * gh);
  const WV = new Float32Array(gw * gh);
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      const u = (gx * G) / h;
      const v = (gy * G) / h;
      WU[gy * gw + gx] = fbm(nWarpA, u * spec.warpFreq, v * spec.warpFreq, 3);
      WV[gy * gw + gx] = fbm(nWarpB, u * spec.warpFreq + 5.2, v * spec.warpFreq + 1.3, 3);
    }
    if ((gy & 7) === 7) yield;
  }

  /* pass 1: silhouette and relief, tile by tile, with per-tile lobe culling */
  const edgeBand = spec.edgeAmp + spec.soft[1] * 1.5;
  const list = new Int32Array(n);
  const tilesX = Math.ceil(w / TILE);
  const tilesY = Math.ceil(h / TILE);
  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const u0 = (tx * TILE) / h - margin;
      const u1 = ((tx + 1) * TILE) / h + margin;
      const v0 = (ty * TILE) / h - margin;
      const v1 = ((ty + 1) * TILE) / h + margin;
      let m = 0;
      for (let j = 0; j < n; j++) {
        const ry = PR[j] / PS[j];
        if (PX[j] + PR[j] < u0 || PX[j] - PR[j] > u1 || PY[j] + ry < v0 || PY[j] - ry > v1) continue;
        list[m++] = j;
      }
      if (m === 0) continue;
      const yEnd = Math.min(h, (ty + 1) * TILE);
      const xEnd = Math.min(w, (tx + 1) * TILE);
      for (let y = ty * TILE; y < yEnd; y++) {
        const v = y / h;
        const gyf = y / G;
        const gy0 = gyf | 0;
        const fy = gyf - gy0;
        for (let x = tx * TILE; x < xEnd; x++) {
          const u = x / h;
          const gxf = x / G;
          const gx0 = gxf | 0;
          const fxx = gxf - gx0;
          const g00 = gy0 * gw + gx0;
          const wu = (WU[g00] * (1 - fxx) + WU[g00 + 1] * fxx) * (1 - fy) + (WU[g00 + gw] * (1 - fxx) + WU[g00 + gw + 1] * fxx) * fy;
          const wv = (WV[g00] * (1 - fxx) + WV[g00 + 1] * fxx) * (1 - fy) + (WV[g00 + gw] * (1 - fxx) + WV[g00 + gw + 1] * fxx) * fy;
          const pu = u + wu * spec.warp;
          const pv = v + wv * spec.warp * 0.8;
          let s = 1;
          let hh = -1;
          let swell = 0;
          for (let k = 0; k < m; k++) {
            const j = list[k];
            const dx = pu - PX[j];
            const dy = (pv - PY[j]) * PS[j];
            const d2 = dx * dx + dy * dy;
            const rr = PR[j];
            const lim = rr + KS * 2;
            if (d2 > lim * lim) continue;
            s = smin(s, Math.sqrt(d2) - rr, KS);
            const q = d2 / (rr * rr);
            if (PB[j]) {
              // buds swell smoothly out of the surface (zero slope at the rim: no crease ring)
              if (q < 1) {
                const b = (1 - q) * (1 - q) * rr * PH[j] * 0.55;
                swell += b * b * b; // cubic norm: overlapping buds merge without creases
              }
            } else {
              // near-spherical dome, continued below zero past the rim so the blend never steps
              hh = smax(hh, PZ[j] + rr * PH[j] * (1 - q) * (1 + 0.6 * Math.min(q, 1)), KH);
            }
          }
          if (s > margin) continue;
          const i = y * w + x;
          // fractal breakup only where it can move the silhouette
          cov[i] = s > -edgeBand ? s + fbm(nDetail, pu * spec.freq + wu, pv * spec.freq + wv, 4, 0.47) * spec.edgeAmp * smooth(-edgeBand, -edgeBand * 0.4, s) : s;
          hgt[i] = Math.max(hh, 0) + Math.cbrt(swell) + fbm(nBump, pu * spec.freq * 0.5, pv * spec.freq * 0.5, 2) * spec.bumpAmp;
        }
      }
      yield;
    }
  }

  /* pass 2: relief smoothed for normals, and broadly blurred for cavity occlusion */
  const hs = yield* blur(hgt, w, h, Math.max(2, Math.round(4 * quality)));
  const hb = yield* blur(hgt, w, h, Math.max(2, Math.round(h * 0.03)));

  /* pass 3: light and paint, both palettes at once */
  const day = new ImageData(w, h);
  const dusk = new ImageData(w, h);
  const cA = new Float32Array(3);
  const cB = new Float32Array(3);
  const step = Math.max(1, Math.round(3 * quality)); // finite-difference half-width (px)
  const slope = (0.5 * L2) / Math.hypot(L0, L1) / h; // ray height gained per px towards the light (low sun: longer shading)
  const dirX = L0 / Math.hypot(L0, L1);
  const dirY = L1 / Math.hypot(L0, L1);
  const [sLit, sShade] = spec.soft;
  const fx = spec.fadeX;
  const core = spec.core;
  const rowsPerYield = Math.max(1, Math.round(1600 / w));

  for (let y = 0; y < h; y++) {
    const v = y / h;
    const edgeFade = (1 - smooth(0.93, 1, v)) * smooth(0, 0.05, v);
    const coreA = core ? smooth(core[0] - core[2], core[0], v) * (1 - smooth(core[1], core[1] + core[2], v)) : 0;
    const under = smooth(spec.base - 0.4, spec.base + 0.02, v);
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const o = i * 4;
      const sd = cov[i];
      const u = x / h;
      // softer edges on the shaded underside, crisper on the lit crowns
      const soft = sLit + (sShade - sLit) * under;
      let a = 1 - smooth(-soft, soft * 0.6, sd);
      // the base: a soft, slightly wavering horizontal edge (cumulus are flat underneath)
      const wob = spec.flatBase ? fbm(nBump, u * 3 + 7.7, v * 3, 2) * 0.03 : 0;
      a *= edgeFade * (1 - smooth(spec.base - spec.baseSoft * 0.35, spec.base + spec.baseSoft, v + wob));
      if (fx) a *= smooth(fx[0], fx[1], x / w) * (1 - smooth(fx[2], fx[3], x / w));
      if (coreA > a) a = coreA;
      if (a < 0.004) continue;

      const xl = x - step < 0 ? 0 : x - step;
      const xr = x + step >= w ? w - 1 : x + step;
      const yu = y - step < 0 ? 0 : y - step;
      const yd = y + step >= h ? h - 1 : y + step;

      // relief normal (smoothed relief)
      const H0 = hs[i];
      const gx = ((hs[y * w + xr] - hs[y * w + xl]) * h * 0.8) / (xr - xl || 1);
      const gy = ((hs[yd * w + x] - hs[yu * w + x]) * h * 0.8) / (yd - yu || 1);
      const nl = 1 / Math.sqrt(gx * gx + gy * gy + 1);
      const nx = -gx * nl;
      const ny = -gy * nl;
      const ndl = nx * L0 + ny * L1 + nl * L2;
      const diff = clamp01((ndl + 0.26) / 1.26);

      // short march towards the light over the relief: lobes shade the ones below them
      let occ = 0;
      for (let k = 0; k < MARCH.length; k++) {
        const t = MARCH[k] * quality;
        const sx = Math.round(x + dirX * t);
        const sy = Math.round(y + dirY * t);
        if (sx < 0 || sy < 0 || sx >= w || sy >= h) break;
        const dh = hs[sy * w + sx] - (H0 + t * slope);
        if (dh > occ) occ = dh;
      }
      const shadow = 1 - 0.72 * smooth(0, 0.06, occ);
      const ao = 1 - Math.min(0.4, Math.max(0, hb[i] - H0) * 4);
      let lum = (spec.ambient + (1 - spec.ambient) * diff * shadow) * ao;

      // the silhouette is lit as a thin, translucent rim: bright towards the light, never a dark halo
      const ew = smooth(-soft * 5, soft, sd);
      if (ew > 0) {
        const cgx = cov[y * w + xr] - cov[y * w + xl];
        const cgy = cov[yd * w + x] - cov[yu * w + x];
        const cl = Math.hypot(cgx, cgy) || 1;
        const facing = (cgx * dirX + cgy * dirY) / cl;
        const edgeLum = 0.58 + 0.38 * clamp01(facing * 0.8 + 0.35) - under * 0.1;
        lum += (edgeLum - lum) * ew * 0.85;
      }
      lum -= under * 0.12 * (1 - ew) * (1 - spec.aerial);

      // painter's dabs: broad mottling of the value, then a faint quantise to suggest strokes
      const dab = fbm(nPaint, u * 7, v * 7, 2);
      lum += dab * 0.04;
      lum = lum * (1 - spec.aerial * 0.5) + 0.64 * spec.aerial * 0.5;
      const q = Math.round(lum * 16) / 16;
      lum = lum * 0.88 + q * 0.12;

      // streaks along a slowly turning direction
      const ang = 0.3 + dab * 1.1;
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);
      const stroke = nStroke((u * ca + v * sa) * 7, (-u * sa + v * ca) * 110);
      const grain = hash2(x, y, spec.seed);
      const tex = 1 + stroke * 0.028 + grain * 0.014;

      const warmF = smooth(0.55, 0.84, lum) * (1 - smooth(0.92, 1.03, lum)) * clamp01(0.3 + dab * 1.6 + 0.4 * (1 - under));
      const coolF = (under * 0.5 * (1 - diff * 0.6) + (ny > 0 ? ny * 0.2 : 0)) * (1 - spec.aerial * 0.6);

      paintPixel(DAY, lum, warmF, coolF, spec.aerial, tex, cA, cB);
      day.data[o] = cA[0];
      day.data[o + 1] = cA[1];
      day.data[o + 2] = cA[2];
      paintPixel(DUSK, lum, warmF, coolF, spec.aerial, tex, cA, cB);
      dusk.data[o] = cA[0];
      dusk.data[o + 1] = cA[1];
      dusk.data[o + 2] = cA[2];

      // dry-brush breakup on the soft edge of the crowns (not on the flat base)
      if (a < 1 && a > coreA) a *= 1 - 0.4 * (1 - a) * (1 - under) * clamp01(stroke + 0.3);
      if (spec.thin) a *= 1 - spec.thin * smooth(-0.1, 0.5, fbm(nBump, u * 1.3 + 3.1, v * 7, 3));
      const A = Math.round(a * spec.alpha * 255);
      day.data[o + 3] = A;
      dusk.data[o + 3] = A;
    }
    if (y % rowsPerYield === rowsPerYield - 1) yield;
  }
  return { w, h, day, dusk };
}

function paintPixel(pal: Palette, lum: number, warmF: number, coolF: number, aerial: number, tex: number, out: Float32Array, tmp: Float32Array): void {
  rampAt(pal.ramp, lum, out);
  const c = Math.min(0.6, coolF);
  out[0] += (pal.cool[1] - out[0]) * c;
  out[1] += (pal.cool[2] - out[1]) * c;
  out[2] += (pal.cool[3] - out[2]) * c;
  const wf = warmF * pal.warmAmt;
  out[0] += (pal.warm[1] - out[0]) * wf;
  out[1] += (pal.warm[2] - out[1]) * wf;
  out[2] += (pal.warm[3] - out[2]) * wf;
  const af = aerial * 0.35;
  out[0] += (pal.air[1] - out[0]) * af;
  out[1] += (pal.air[2] - out[1]) * af;
  out[2] += (pal.air[3] - out[2]) * af;
  tmp[0] = out[0] * tex;
  tmp[1] = out[1] * tex;
  tmp[2] = out[2] * tex;
  out[0] = tmp[0] > 255 ? 255 : tmp[0];
  out[1] = tmp[1] > 255 ? 255 : tmp[1];
  out[2] = tmp[2] > 255 ? 255 : tmp[2];
}
