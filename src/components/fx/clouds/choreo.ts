/**
 * Where each cloud layer sits in a passage, and how it moves with scroll. Pure data and
 * arithmetic: the component turns LAYOUT into inline CSS (so the server paints the resting
 * composition), and the scroll engine turns CHOREO into transforms relative to that rest pose.
 *
 * Units: x in vw, y in passage heights (H). `p` is passage progress through the viewport:
 * 0 = its top touches the bottom of the screen, 1 = its bottom leaves the top of the screen.
 */

import { LAYER_KEYS, LAYER_SIZE, type LayerKey } from './paint';

export type Variant = 'part' | 'rise' | 'descend';

/** Fraction of the bank's height where the room seam hides (inside its always-opaque core). */
export const SEAM_V = 0.67;

type Box = {
  /** width: `vw` of the viewport, at least `min` px, at most `maxH` passage heights */
  vw: number;
  min: number;
  maxH: number;
  /** anchor point inside the layer (fractions of its box) placed at (cx · 100vw, cy · H) */
  ax: number;
  ay: number;
  cx: number;
  cy: number;
};

const BOX: Record<Variant, Record<LayerKey, Box>> = {
  part: {
    haze: { vw: 130, min: 1300, maxH: 3, ax: 0.5, ay: 0.8, cx: 0.5, cy: 0.66 },
    bank: { vw: 112, min: 1200, maxH: 2.7, ax: 0.5, ay: SEAM_V, cx: 0.5, cy: 0.42 },
    left: { vw: 96, min: 760, maxH: 1.75, ax: 0.9, ay: 0.88, cx: 0.58, cy: 0.96 },
    right: { vw: 96, min: 760, maxH: 1.75, ax: 0.1, ay: 0.88, cx: 0.42, cy: 0.98 },
  },
  rise: {
    haze: { vw: 150, min: 1400, maxH: 3.4, ax: 0.5, ay: 0.8, cx: 0.5, cy: 0.5 },
    bank: { vw: 132, min: 1200, maxH: 3.1, ax: 0.5, ay: SEAM_V, cx: 0.5, cy: 0.74 },
    left: { vw: 80, min: 700, maxH: 1.5, ax: 0.9, ay: 0.88, cx: 0.6, cy: 0.98 },
    right: { vw: 80, min: 700, maxH: 1.5, ax: 0.1, ay: 0.88, cx: 0.4, cy: 1.0 },
  },
  descend: {
    haze: { vw: 150, min: 1400, maxH: 3.4, ax: 0.5, ay: 0.8, cx: 0.5, cy: 0.36 },
    bank: { vw: 132, min: 1200, maxH: 3.1, ax: 0.5, ay: 0.6, cx: 0.5, cy: 0.54 },
    left: { vw: 66, min: 620, maxH: 1.3, ax: 0.9, ay: 0.88, cx: 0.5, cy: 0.62 },
    right: { vw: 66, min: 620, maxH: 1.3, ax: 0.1, ay: 0.88, cx: 0.52, cy: 0.66 },
  },
};

export const aspectOf = (k: LayerKey) => LAYER_SIZE[k][1] / LAYER_SIZE[k][0];

/** CSS length of a layer's width (needs `--clp-h` on the passage). */
export function widthCss(b: Box): string {
  return `max(${b.min}px, min(${b.vw}vw, calc(var(--clp-h) * ${b.maxH})))`;
}

/** Numeric width for a given viewport (the simulator and the engine use it). */
export function widthPx(b: Box, vw: number, h: number): number {
  return Math.max(b.min, Math.min((b.vw * vw) / 100, h * b.maxH));
}

export function boxOf(v: Variant, k: LayerKey): Box {
  return BOX[v][k];
}

/* ---------- choreography ---------- */

const S = (a: number, b: number, p: number) => {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** One layer's motion: `depth` is parallax (+ lags behind the page, feels far; − runs ahead, feels near). */
type Track = { depth: number; x?: (p: number) => number; y?: (p: number) => number; o?: (p: number) => number };

type Choreo = { ref: number; layers: Record<LayerKey, Track>; card: (p: number) => number };

export const CHOREO: Record<Variant, Choreo> = {
  // The front banks drift together as the passage arrives, then part to the sides; the far haze lifts.
  part: {
    ref: 0.5,
    layers: {
      haze: { depth: 0.1, y: (p) => -0.1 * S(0.5, 0.95, p), o: (p) => 1 - 0.55 * S(0.6, 0.95, p) },
      bank: { depth: 0.05 },
      left: { depth: -0.1, x: (p) => -5 * (1 - S(0.05, 0.5, p)) - 52 * S(0.5, 0.92, p), y: (p) => -0.05 * S(0.5, 0.92, p) },
      right: { depth: -0.1, x: (p) => 5 * (1 - S(0.05, 0.5, p)) + 52 * S(0.5, 0.92, p), y: (p) => -0.05 * S(0.5, 0.92, p) },
    },
    card: (p) => -0.12 * S(0.25, 0.85, p),
  },
  // The whole bank lifts into the next room and thins out; the near billows go first.
  rise: {
    ref: 0.45,
    layers: {
      haze: { depth: 0.12, y: (p) => -0.14 * S(0.45, 0.95, p), o: (p) => 1 - 0.7 * S(0.55, 0.9, p) },
      bank: { depth: 0, y: (p) => -0.22 * S(0.35, 0.95, p) },
      left: { depth: -0.22, x: (p) => -8 * S(0.45, 0.95, p), y: (p) => -0.16 * S(0.4, 0.95, p), o: (p) => 1 - S(0.6, 0.9, p) },
      right: { depth: -0.22, x: (p) => 8 * S(0.45, 0.95, p), y: (p) => -0.16 * S(0.4, 0.95, p), o: (p) => 1 - S(0.6, 0.9, p) },
    },
    card: (p) => -0.1 * S(0.3, 0.85, p),
  },
  // Clouds sink and dissolve into the dusk sky that the closing landscape continues.
  descend: {
    ref: 0.4,
    layers: {
      haze: { depth: 0.4, o: (p) => 1 - S(0.45, 0.85, p) },
      bank: { depth: 0.32, y: (p) => 0.06 * S(0.4, 0.95, p), o: (p) => 1 - S(0.5, 0.9, p) },
      left: { depth: 0.2, x: (p) => -10 * S(0.4, 0.95, p), y: (p) => 0.08 * S(0.4, 0.95, p), o: (p) => 1 - S(0.45, 0.85, p) },
      right: { depth: 0.2, x: (p) => 10 * S(0.4, 0.95, p), y: (p) => 0.08 * S(0.4, 0.95, p), o: (p) => 1 - S(0.45, 0.85, p) },
    },
    card: (p) => -0.1 * S(0.3, 0.85, p),
  },
};

export type Pose = { x: number; y: number; o: number };

/**
 * Offset of a layer from its rest pose at progress `p`: x in vw, y in px, plus opacity.
 * `h` is the passage height and `vh` the viewport height, both px.
 */
export function poseAt(v: Variant, k: LayerKey, p: number, h: number, vh: number): Pose {
  const c = CHOREO[v];
  const t = c.layers[k];
  const r = c.ref;
  const x = t.x ? t.x(p) - t.x(r) : 0;
  const y = (t.y ? t.y(p) - t.y(r) : 0) * h + t.depth * (p - r) * (h + vh);
  return { x, y, o: t.o ? t.o(p) : 1 };
}

export function cardAt(v: Variant, p: number, h: number): number {
  const c = CHOREO[v];
  return (c.card(p) - c.card(c.ref)) * h;
}

export { LAYER_KEYS };
