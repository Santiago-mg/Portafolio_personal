'use client';

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { useSite } from '@/components/site/SiteProvider';
import { REVEAL_EVENT, watchInView } from '@/components/fx/RevealText';

export type DrawStrokeProps = {
  /** hand-drawn shapes; the host element must have position:relative (use class "stroke-host") */
  variant: 'underline' | 'circle' | 'arrow' | 'scribble';
  color?: 'pass' | 'ink';
  /** ms delay after entering the viewport */
  delay?: number;
  className?: string;
};

type Box = { x: number; y: number; w: number; h: number; base: number; fs: number };
type Geo = { d: string[]; sw: number };

/* ---- tiny seeded PRNG so each stroke keeps its own "hand" across resizes ---- */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function prng(seed: number) {
  let a = seed || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const f = (n: number) => Math.round(n * 10) / 10;

/** Catmull-Rom through the points → smooth cubic Bézier path. */
function smooth(p: [number, number][]): string {
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/** Hand-drawn geometry in the SVG's own pixel space (1 user unit = 1 CSS px, no scaling). */
function build(variant: DrawStrokeProps['variant'], b: Box, seed: number): Geo {
  const rnd = prng(seed);
  const j = (amount: number) => (rnd() * 2 - 1) * amount;
  const sw = f(clamp(b.fs * 0.032, 2.5, 4));

  if (variant === 'circle') {
    // A loose ellipse that starts upper-left, goes round clockwise and overshoots its start.
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const rx = b.w / 2 + Math.max(8, b.fs * 0.2);
    const ry = b.h / 2 + Math.max(5, b.fs * 0.12);
    const tilt = -0.05 + j(0.03);
    const start = Math.PI * (1.12 + j(0.04));
    const sweep = Math.PI * 2 + 0.55 + j(0.1);
    const phase = rnd() * Math.PI * 2;
    const pts: [number, number][] = [];
    const N = 64;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const a = start + sweep * t;
      const r = 1 + 0.03 * Math.sin(t * Math.PI * 2.6 + phase) + 0.07 * t; // spirals out a little
      const ex = Math.cos(a) * rx * r;
      const ey = Math.sin(a) * ry * r;
      pts.push([cx + ex * Math.cos(tilt) - ey * Math.sin(tilt), cy + ex * Math.sin(tilt) + ey * Math.cos(tilt)]);
    }
    return { d: [smooth(pts)], sw };
  }

  if (variant === 'scribble') {
    // Cursive loops along the baseline ("ℓℓℓℓ"), tapering towards the end.
    const loops = Math.max(3, Math.round(b.w / (b.fs * 0.5)));
    const R = clamp(b.fs * 0.11, 4, 18);
    const y0 = b.base + b.fs * 0.2;
    const x0 = b.x - b.w * 0.02;
    const L = b.w * 1.04;
    const N = loops * 18;
    const pts: [number, number][] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const a = t * loops * Math.PI * 2;
      const r = R * (1 - 0.3 * t);
      pts.push([x0 + t * L - r * 1.25 * Math.sin(a), y0 - r * 0.9 * Math.cos(a) + j(0.6)]);
    }
    return { d: [smooth(pts)], sw };
  }

  if (variant === 'arrow') {
    // Curves in from below-right and points at the host's right edge.
    const off = clamp(b.fs * 1.2, 36, 120);
    const sx = b.x + b.w + off;
    const sy = b.y + b.h + off * 0.45;
    const ex = b.x + b.w + Math.max(6, b.fs * 0.18);
    const ey = b.y + b.h * 0.55;
    const c1x = sx + off * 0.12 + j(off * 0.05);
    const c1y = sy - off * 0.55;
    const c2x = ex + off * 0.65;
    const c2y = ey + off * 0.3 + j(off * 0.05);
    const shaft = `M${f(sx)} ${f(sy)}C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(ex)} ${f(ey)}`;
    const ang = Math.atan2(ey - c2y, ex - c2x); // direction of travel at the tip
    const hl = clamp(b.fs * 0.3, 9, 22);
    const wing = (s: number) => {
      const a = ang + Math.PI + s * (0.5 + j(0.06));
      return `M${f(ex)} ${f(ey)}L${f(ex + Math.cos(a) * hl)} ${f(ey + Math.sin(a) * hl)}`;
    };
    return { d: [shaft, wing(1), wing(-1)], sw };
  }

  // underline: one confident marker swoosh just below the baseline, lifting at the end.
  // Close to the baseline: display type is uppercase (no descenders) and set at .906, so a
  // lower swoosh would touch the caps of the next line.
  const a = clamp(b.fs * 0.05, 1.5, 6);
  const y = b.base + b.fs * 0.1;
  const x0 = b.x - b.w * 0.02 + j(b.w * 0.01);
  const x1 = b.x + b.w * 1.02 + j(b.w * 0.01);
  const L = x1 - x0;
  return {
    d: [
      `M${f(x0)} ${f(y + a * 0.3 + j(a * 0.2))}C${f(x0 + L * 0.3)} ${f(y + a * 0.75 + j(a * 0.3))} ${f(x0 + L * 0.64)} ${f(y - a * 0.1 + j(a * 0.3))} ${f(x1)} ${f(y - a * 0.65 + j(a * 0.2))}`,
    ],
    sw,
  };
}

/**
 * A hand-drawn stroke that draws itself once its host scrolls in (after the preloader, and
 * after any RevealText around it has shown its text). Purely decorative.
 */
export default function DrawStroke({ variant, color = 'pass', delay = 0, className }: DrawStrokeProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const uid = useId();
  const { booted } = useSite();
  const [geo, setGeo] = useState<Geo | null>(null);
  const [entered, setEntered] = useState(false);

  // Geometry: measured in the browser (the baseline comes from the zero-size anchor).
  useEffect(() => {
    const anchor = anchorRef.current;
    const svg = svgRef.current;
    const host = (anchor?.parentElement?.closest('.stroke-host') as HTMLElement | null) ?? anchor?.parentElement;
    if (!anchor || !svg || !host) return;
    const seed = hash(`${uid}:${variant}`);
    let raf = 0;
    const measure = () => {
      raf = 0;
      const s = svg.getBoundingClientRect();
      const h = host.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      if (!h.width || !h.height) return;
      const k = svg.clientWidth > 0 ? s.width / svg.clientWidth || 1 : 1; // undo ancestor scale transforms
      const fs = parseFloat(getComputedStyle(host).fontSize) || 16;
      setGeo(
        build(variant, { x: (h.left - s.left) / k, y: (h.top - s.top) / k, w: h.width / k, h: h.height / k, base: (a.top - s.top) / k, fs }, seed),
      );
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    const ro = new ResizeObserver(schedule);
    ro.observe(host);
    schedule();
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [uid, variant]);

  // Trigger once in view; if a RevealText wraps us, wait until its text is visible.
  useEffect(() => {
    const anchor = anchorRef.current;
    const host = (anchor?.parentElement?.closest('.stroke-host') as HTMLElement | null) ?? anchor?.parentElement;
    if (!anchor || !host) return;
    let off = () => {};
    const stop = watchInView(host, (entry) => {
      if (!entry.isIntersecting) return;
      stop();
      const rv = anchor.closest('.fx-rv');
      const state = rv?.getAttribute('data-rv');
      if (rv && state && state !== 'done') {
        const go = () => setEntered(true);
        rv.addEventListener(REVEAL_EVENT, go, { once: true });
        off = () => rv.removeEventListener(REVEAL_EVENT, go);
      } else setEntered(true);
    });
    return () => {
      stop();
      off();
    };
  }, []);

  const on = entered && booted;
  return (
    <span ref={anchorRef} className="fx-stroke-a" aria-hidden="true">
      <svg
        ref={svgRef}
        className={`fx-stroke fx-stroke-${variant}${className ? ` ${className}` : ''}`}
        data-color={color}
        data-on={on ? '' : undefined}
        style={{ '--fx-sd': `${Math.max(0, delay)}ms` } as CSSProperties}
      >
        {geo?.d.map((d, i) => <path key={i} d={d} pathLength={1} strokeWidth={geo.sw} />)}
      </svg>
    </span>
  );
}
