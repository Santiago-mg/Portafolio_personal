/**
 * Drawing helpers shared by the Atlas scenes (process drawing, closing landscape).
 *
 * Deterministic arithmetic only (+ − × ÷, integer hashing, Math.round/floor): no trig or pow,
 * whose last bits differ between JS engines. The server and every browser therefore produce
 * byte-identical SVG path strings and hydration never sees a mismatch.
 */

export type Pt = readonly [number, number];

export const r1 = (n: number) => Math.round(n * 10) / 10;
export const pt = (p: Pt) => `${r1(p[0])} ${r1(p[1])}`;

/** Hash (i, seed) → [0, 1) with integer ops only. */
export function h01(i: number, seed: number): number {
  let x = (Math.imul(i | 0, 374761393) + Math.imul(seed | 0, 668265263)) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

/** Smooth value noise in [0, 1) with a quintic fade; periodic with period `n` when n > 0. */
export function noise1(t: number, seed: number, n = 0): number {
  const i = Math.floor(t);
  const f = t - i;
  const wrap = (k: number) => (n > 0 ? ((k % n) + n) % n : k);
  const a = h01(wrap(i), seed);
  const b = h01(wrap(i + 1), seed);
  const u = f * f * f * (f * (f * 6 - 15) + 10);
  return a + (b - a) * u;
}

/** Catmull-Rom through the points → cubic Bézier path (open). */
export function smoothOpen(p: Pt[]): string {
  let d = `M${pt(p[0])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    d += `C${pt([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${pt([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${pt(p2)}`;
  }
  return d;
}

/** Catmull-Rom through the points → cubic Bézier path (closed). */
export function smoothClosed(p: Pt[]): string {
  const n = p.length;
  let d = `M${pt(p[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n];
    const p1 = p[i];
    const p2 = p[(i + 1) % n];
    const p3 = p[(i + 2) % n];
    d += `C${pt([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${pt([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${pt(p2)}`;
  }
  return `${d}Z`;
}

/** Unit circle without trig: rational parametrisation t = tan(θ/2), four quadrants. */
const CIRCLE: Pt[] = (() => {
  const out: Pt[] = [];
  const N = 12; // points per quadrant
  for (let q = 0; q < 4; q++) {
    for (let i = 0; i < N; i++) {
      const t = i / N;
      const x = (1 - t * t) / (1 + t * t);
      const y = (2 * t) / (1 + t * t);
      out.push(q === 0 ? [x, y] : q === 1 ? [-y, x] : q === 2 ? [-x, -y] : [y, -x]);
    }
  }
  return out;
})();

/**
 * Faint "topographic" contour loops around (cx, cy): `count` rings from radius r0, `gap` apart,
 * stretched horizontally by `sx`, each wobbling a little so they read as terrain, not targets.
 */
export function contours(cx: number, cy: number, count: number, r0: number, gap: number, sx: number, seed: number): string {
  const n = CIRCLE.length;
  let out = '';
  for (let c = 0; c < count; c++) {
    const r = r0 + c * gap;
    const ps: Pt[] = CIRCLE.map((p, i) => {
      const w = 1 + 0.24 * (noise1((i / n) * 6, seed, 6) - 0.5) + 0.1 * (noise1((i / n) * 12 + c * 0.35, seed + 7, 12) - 0.5);
      return [cx + p[0] * r * w * sx, cy + p[1] * r * w];
    });
    out += smoothClosed(ps);
  }
  return out;
}
