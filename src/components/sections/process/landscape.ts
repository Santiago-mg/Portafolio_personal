/**
 * "Technical landscape" for the closing call: a low horizon, layered ridge silhouettes and
 * contour lines that follow each ridge. ViewBox LW × LH, anchored to the bottom (xMidYMax slice).
 * Arithmetic only (see ./draw): the server and every browser emit identical paths.
 */

import { noise1, smoothOpen, type Pt } from './draw';

export const LW = 1440;
export const LH = 900;
/** Horizon height (viewBox units from the top). */
export const HORIZON = 700;

type RidgeSpec = { base: number; amp: number; period: number; seed: number; contours: number; valley: number };
/** Back to front. `period` is the width of one noise cell (bigger = broader mountains);
 *  `valley` is how much the ridge sinks towards the centre, under the statement. */
const RIDGES: readonly RidgeSpec[] = [
  { base: 722, amp: 178, period: 300, seed: 3, contours: 6, valley: 0.62 },
  { base: 772, amp: 128, period: 240, seed: 5, contours: 5, valley: 0.55 },
  { base: 826, amp: 84, period: 200, seed: 9, contours: 4, valley: 0.4 },
  { base: 878, amp: 52, period: 160, seed: 14, contours: 3, valley: 0.2 },
];
const CX = LW / 2;

const X0 = -40;
const X1 = LW + 40;
const STEP = 16;

/** Ridged value noise under a broad envelope: massifs with sharp crests, rounded valleys. */
function height(x: number, r: RidgeSpec): number {
  const env = noise1(x / (r.period * 2.6), r.seed + 5);
  const n = noise1(x / r.period, r.seed);
  const ridged = 1 - Math.abs(2 * n - 1);
  const n2 = noise1(x / (r.period * 0.38), r.seed + 1);
  const ridged2 = 1 - Math.abs(2 * n2 - 1);
  const fine = noise1(x / (r.period * 0.12), r.seed + 2);
  const d = Math.abs(x - CX) / 560;
  const side = d >= 1 ? 1 : d * d * (3 - 2 * d); // 0 in the middle → 1 towards the edges
  const shape = 1 - r.valley + r.valley * side;
  return shape * (0.45 + 0.55 * env) * (0.68 * ridged * ridged * ridged + 0.24 * ridged2 * ridged2 + 0.08 * fine);
}
function crest(r: RidgeSpec): Pt[] {
  const out: Pt[] = [];
  for (let x = X0; x <= X1; x += STEP) out.push([x, r.base - r.amp * height(x, r)]);
  return out;
}

export type Ridge = { fill: string; contour: string; top: number };
export const RIDGE_PATHS: Ridge[] = RIDGES.map((r) => {
  const c = crest(r);
  const fill = `${smoothOpen(c)}L${X1} ${LH}L${X0} ${LH}Z`;
  // Contours: the crest repeated downhill, spacing widening with depth and wavering a little.
  let contour = '';
  let acc = 0;
  for (let k = 1; k <= r.contours; k++) {
    acc += 8 + k * 4;
    const off = acc;
    contour += smoothOpen(c.map(([x, y], i) => [x, y + off * (1 + 0.5 * (noise1(i / 7 + k * 3.1, r.seed + 20 + k) - 0.5))] as Pt));
  }
  return { fill, contour, top: Math.min(...c.map((p) => p[1])) };
});

/** Long, gentle strata in the sky — the same contour language, barely there. */
export const SKY_LINES = [118, 196, 284, 372, 452]
  .map((y, k) => {
    const pts: Pt[] = [];
    for (let x = X0; x <= X1; x += 48) pts.push([x, y + 16 * (noise1(x / 320 + k * 2.3, 40 + k) - 0.5) + 6 * (noise1(x / 90, 50 + k) - 0.5)]);
    return smoothOpen(pts);
  })
  .join('');

/** Survey marks on the highest point of the far ridge within two windows. */
export const SURVEY: Pt[] = [
  [260, 620],
  [860, 1180],
].map(([a, b]) => {
  const r = RIDGES[0];
  let best: Pt = [a, LH];
  for (let x = a; x <= b; x += 4) {
    const y = r.base - r.amp * height(x, r);
    if (y < best[1]) best = [x, y];
  }
  return best;
});
