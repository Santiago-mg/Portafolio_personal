/**
 * Exploded isometric drawing of the stack (Process chapter).
 *
 * Coordinates are SVG user units in a VB_W × VB_H viewBox. Every group is drawn around its
 * own origin (the centre of its top face) and placed with translate(); all groups slide along
 * one diagonal AXIS, so the dashed assembly lines through their corners stay true in any state.
 * Arithmetic only (see ./draw): server and browser output are byte-identical.
 */

import { contours, r1, pt, type Pt } from './draw';

export type State = 0 | 1 | 2; // BUILD · TEST · SHIP

/* ---------------- tunables ---------------- */
export const VB_W = 600;
export const VB_H = 640;
/** Unit vector of the explode axis, lower-left → upper-right (~53°). */
export const AXIS: Pt = [0.6, -0.8];
/** Screen position of the Data slab origin at axis position 0. */
export const ORIGIN: Pt = [196, 468];
/** Half size of the four equal slabs (iso units). */
const S = 80;

export type GroupId = 'data' | 'api' | 'ui' | 'qa' | 'ship' | 'arrow';
export const GROUPS: readonly GroupId[] = ['data', 'api', 'ui', 'qa', 'ship', 'arrow'];

/** Axis position of each group per state. BUILD opens the app layers, TEST brings the
 *  quality plate down over them, SHIP closes the stack and launches the container. */
export const KEYS: Record<GroupId, readonly [number, number, number]> = {
  data: [0, 8, 18],
  api: [114, 108, 102],
  ui: [230, 204, 186],
  qa: [328, 290, 266],
  ship: [410, 394, 374],
  arrow: [460, 444, 466],
};

/** The state in which each group turns green ("passed"); -1 = never. */
export const HIGHLIGHT: Record<GroupId, -1 | State> = { data: -1, api: 0, ui: 0, qa: 1, ship: 2, arrow: 2 };

/* ---------------- placement ---------------- */
const clamp2 = (s: number) => (s <= 0 ? 0 : s >= 2 ? 2 : s);
/** σ ∈ [0, 2] → axis position of a group (linear between its state keys). */
function axisPos(g: GroupId, sigma: number): number {
  const k = KEYS[g];
  const s = clamp2(sigma);
  return s <= 1 ? k[0] + (k[1] - k[0]) * s : k[1] + (k[2] - k[1]) * (s - 1);
}
export function groupAt(g: GroupId, sigma: number): [number, number] {
  const a = axisPos(g, sigma);
  return [r1(ORIGIN[0] + AXIS[0] * a), r1(ORIGIN[1] + AXIS[1] * a)];
}

/* ---------------- primitives ---------------- */
const C = 0.8660254037844386; // cos 30°, as a literal
/** Isometric (u, v) on a horizontal plane → screen offset. u runs right-down, v left-down. */
const iso = (u: number, v: number): [number, number] => [(u - v) * C, (u + v) * 0.5];
const add = (a: Pt, b: Pt): [number, number] => [a[0] + b[0], a[1] + b[1]];
const down = (p: Pt, t: number): [number, number] => [p[0], p[1] + t];
const poly = (...ps: Pt[]) => `M${ps.map(pt).join('L')}Z`;
const line = (a: Pt, b: Pt) => `M${pt(a)}L${pt(b)}`;

/** f = occluding faces (paper fill + outline) · e = outline · d = detail · h = faint hatch · x = dashed */
export type Kind = 'f' | 'e' | 'd' | 'h' | 'x';
type Shape = { d: string; k: Kind };
type Box = { a: number; b: number; t: number };

function corners({ a, b }: Box) {
  return { back: iso(-a, -b), right: iso(a, -b), front: iso(a, b), left: iso(-a, b) };
}
/** The three visible faces of a box whose top face is centred on the origin. */
function solid(bx: Box): Shape[] {
  const { back, right, front, left } = corners(bx);
  const t = bx.t;
  return [
    { k: 'f', d: poly(left, front, down(front, t), down(left, t)) },
    { k: 'f', d: poly(front, right, down(right, t), down(front, t)) },
    { k: 'f', d: poly(back, right, front, left) },
  ];
}
/** Lamination: the two front top edges repeated down the side faces. */
function laminate(bx: Box, step: number): Shape[] {
  const { right, front, left } = corners(bx);
  const out: Shape[] = [];
  for (let y = step; y < bx.t - 0.5; y += step) {
    out.push({ k: 'd', d: line(down(left, y), down(front, y)) + line(down(front, y), down(right, y)) });
  }
  return out;
}
/** Square ring on the top face, half size r. */
const ring = (r: number) => poly(iso(-r, -r), iso(r, -r), iso(r, r), iso(-r, r));
const uLine = (v: number, u0: number, u1: number) => line(iso(u0, v), iso(u1, v));
const vLine = (u: number, v0: number, v1: number) => line(iso(u, v0), iso(u, v1));

/* ---------------- parts ---------------- */
function dataSlab(): Shape[] {
  const bx = { a: S, b: S, t: 30 };
  const out = [...solid(bx), ...laminate(bx, 6)];
  // A table on the top face: rows along u and one key column.
  for (let v = -S + 18; v <= S - 14; v += 16) out.push({ k: 'h', d: uLine(v, -S + 12, S - 12) });
  out.push({ k: 'd', d: vLine(-S + 34, -S + 12, S - 12) });
  return out;
}
function apiSlab(): Shape[] {
  const bx = { a: S, b: S, t: 18 };
  // Clean Architecture on the top face: interface → infrastructure → application → domain.
  const out = [...solid(bx), ...laminate(bx, 6)];
  out.push({ k: 'd', d: ring(64) }, { k: 'd', d: ring(46) }, { k: 'd', d: ring(28) }, { k: 'e', d: ring(11) });
  for (let u = -6.6; u <= 6.6; u += 4.4) out.push({ k: 'h', d: vLine(u, -11, 11) });
  return out;
}
function uiSlab(): Shape[] {
  const bx = { a: S, b: S, t: 8 };
  const m = 66;
  const out = [...solid(bx), ...laminate(bx, 4)];
  out.push({ k: 'd', d: ring(m) });
  out.push({ k: 'd', d: uLine(-m + 14, -m, m) }); // header bar
  out.push({ k: 'd', d: vLine(-m + 30, -m + 14, m) }); // sidebar
  const blocks: [number, number, number, number][] = [
    [-28, -44, -4, -12],
    [4, -44, 28, -12],
    [36, -44, 60, -12],
    [-28, -2, 60, 52],
  ];
  for (const [u0, v0, u1, v1] of blocks) out.push({ k: 'h', d: poly(iso(u0, v0), iso(u1, v0), iso(u1, v1), iso(u0, v1)) });
  return out;
}
function qaPlate(): Shape[] {
  const out = solid({ a: S, b: S, t: 4 });
  // Inspection grid over the whole plate.
  for (let g = -S + 16; g < S; g += 16) out.push({ k: 'h', d: uLine(g, -S + 6, S - 6) + vLine(g, -S + 6, S - 6) });
  // Registration ticks at the four corners, just outside the plate.
  const o = S + 8;
  const L = 14;
  out.push(
    { k: 'd', d: line(iso(-o, -o + L), iso(-o, -o)) + line(iso(-o, -o), iso(-o + L, -o)) },
    { k: 'd', d: line(iso(o - L, -o), iso(o, -o)) + line(iso(o, -o), iso(o, -o + L)) },
    { k: 'd', d: line(iso(o, o - L), iso(o, o)) + line(iso(o, o), iso(o - L, o)) },
    { k: 'd', d: line(iso(-o + L, o), iso(-o, o)) + line(iso(-o, o), iso(-o, o - L)) },
  );
  return out;
}
function container(): Shape[] {
  const bx = { a: 44, b: 24, t: 34 };
  const { right, front, left } = corners(bx);
  const out = solid(bx);
  // Corrugation along the long face, a door seam on the short one.
  for (let u = -37; u < 42; u += 7) {
    const p = iso(u, 24);
    out.push({ k: 'd', d: line(down(p, 3), down(p, bx.t - 3)) });
  }
  const mid: Pt = [(front[0] + right[0]) / 2, (front[1] + right[1]) / 2];
  out.push({ k: 'd', d: line(down(mid, 3), down(mid, bx.t - 3)) });
  out.push({ k: 'd', d: line(down(left, 4), down(front, 4)) + line(down(front, 4), down(right, 4)) });
  return out;
}
function deployArrow(): Shape[] {
  // The deploy target (a dashed pad) with the arrow arriving along the axis.
  const tail: Pt = [-AXIS[0] * 46, -AXIS[1] * 46];
  const nx = -AXIS[1];
  const ny = AXIS[0];
  const back: Pt = [-AXIS[0] * 9, -AXIS[1] * 9];
  return [
    { k: 'x', d: ring(22) },
    { k: 'e', d: line(tail, [0, 0]) },
    { k: 'e', d: line([back[0] + nx * 5, back[1] + ny * 5], [0, 0]) + line([back[0] - nx * 5, back[1] - ny * 5], [0, 0]) },
  ];
}

/* ---------------- annotations ---------------- */
export type Note = { g: Exclude<GroupId, 'arrow'>; side: 'l' | 'r'; from: Pt; len: number };
/** Leader lines start on the part (group-local point) and run horizontally `len` units. */
export const NOTES: readonly Note[] = [
  { g: 'data', side: 'r', from: add(iso(S, -S + 40), [0, 15]), len: 44 },
  { g: 'api', side: 'r', from: add(iso(S, -S + 26), [0, 9]), len: 40 },
  { g: 'ui', side: 'l', from: iso(-S + 22, S), len: 54 },
  { g: 'qa', side: 'l', from: iso(-S + 6, S - 2), len: 44 },
  { g: 'ship', side: 'l', from: add(iso(-44, 24), [0, 12]), len: 64 },
];
const leader = (n: Note) => line(n.from, [n.from[0] + (n.side === 'r' ? n.len : -n.len), n.from[1]]);
/** Where a note's label is anchored (viewBox units) at σ: the outer end of its leader. */
export function noteAt(n: Note, sigma: number): [number, number] {
  const o = groupAt(n.g, sigma);
  return [r1(o[0] + n.from[0] + (n.side === 'r' ? n.len : -n.len)), r1(o[1] + n.from[1])];
}

/* ---------------- merged paths: one <path> per group and kind ---------------- */
const RAW: Record<GroupId, Shape[]> = {
  data: dataSlab(),
  api: apiSlab(),
  ui: uiSlab(),
  qa: qaPlate(),
  ship: container(),
  arrow: deployArrow(),
};
export const DETAIL_KINDS: readonly Exclude<Kind, 'f'>[] = ['h', 'd', 'e', 'x'];
export type GroupPaths = { faces: string; detail: Partial<Record<Exclude<Kind, 'f'>, string>>; leader: string };
export const PATHS: Record<GroupId, GroupPaths> = (() => {
  const out = {} as Record<GroupId, GroupPaths>;
  for (const g of GROUPS) {
    const shapes = RAW[g];
    const detail: GroupPaths['detail'] = {};
    for (const k of DETAIL_KINDS) {
      const d = shapes.filter((s) => s.k === k).map((s) => s.d).join('');
      if (d) detail[k] = d;
    }
    out[g] = {
      faces: shapes.filter((s) => s.k === 'f').map((s) => s.d).join(''),
      detail,
      leader: NOTES.filter((n) => n.g === g).map(leader).join(''),
    };
  }
  return out;
})();

/* ---------------- assembly and centre lines ---------------- */
const SLABS: readonly GroupId[] = ['data', 'api', 'ui', 'qa'];
const LEFT = iso(-S, S);
const RIGHT = iso(S, -S);
export type Seg = { x1: number; y1: number; x2: number; y2: number };
/** Dashed connectors between consecutive slabs, through their left and right corners. */
export function connectors(sigma: number): Seg[] {
  const out: Seg[] = [];
  for (let i = 0; i < SLABS.length - 1; i++) {
    const a = groupAt(SLABS[i], sigma);
    const b = groupAt(SLABS[i + 1], sigma);
    for (const c of [LEFT, RIGHT]) out.push({ x1: r1(a[0] + c[0]), y1: r1(a[1] + c[1]), x2: r1(b[0] + c[0]), y2: r1(b[1] + c[1]) });
  }
  return out;
}
const onAxis = (t: number): Pt => [ORIGIN[0] + AXIS[0] * t, ORIGIN[1] + AXIS[1] * t];
/** Dash-dot centre line along the axis, from below the stack into the container (static). */
export const CENTER_LINE = line(onAxis(-96), onAxis(360));
/** A short scale of ticks across the tail of the centre line. */
export const AXIS_TICKS = [0, 1, 2, 3]
  .map((i) => {
    const c = onAxis(-96 + i * 12);
    const h = i === 0 ? 6 : 3.5;
    return line([c[0] + AXIS[1] * h, c[1] - AXIS[0] * h], [c[0] - AXIS[1] * h, c[1] + AXIS[0] * h]);
  })
  .join('');

/** Faint terrain contours behind the stage (viewBox 1440 × 900). */
export const STAGE_TOPO = contours(1010, 470, 11, 70, 46, 1.45, 11) + contours(170, 860, 5, 90, 52, 1.3, 23);

/* ---------------- scroll mapping ---------------- */
/** Share of the scroll range each transition (BUILD→TEST, TEST→SHIP) takes. */
export const TRANSITION = 0.18;
const smoothstep = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** Scroll progress p ∈ [0, 1] → σ ∈ [0, 2], holding each state around the middle of its third. */
export function sigmaAt(p: number): number {
  const w = TRANSITION / 2;
  return smoothstep((p - (1 / 3 - w)) / TRANSITION) + smoothstep((p - (2 / 3 - w)) / TRANSITION);
}
export const stateOf = (sigma: number): State => (sigma < 0.5 ? 0 : sigma < 1.5 ? 1 : 2);
