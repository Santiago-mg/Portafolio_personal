'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import { useSite } from '@/components/site/SiteProvider';
import { isBootCovering } from '@/components/fx/Preloader';

export type RevealTextProps = {
  /** element to render, default 'span' */
  as?: ElementType;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
  /** ms after entering the viewport */
  delay?: number;
  children: ReactNode;
};

/* ---- tunables ---- */
const SWEEP = 320; // bar in, and bar out (ms each)
const HOLD = 60; // full cover before the bar leaves
const STAGGER = 70; // between lines (capped so long paragraphs stay short)
const BOOT_GAP = 380; // extra wait for headings that were already on screen under the preloader
const FADE = 200; // reduced motion: opacity only
const EASE_IO = 'cubic-bezier(0.77, 0, 0.175, 1)';
const RM = '(prefers-reduced-motion: reduce)';

/** Fired on the host when its text becomes visible (DrawStroke waits for it). */
export const REVEAL_EVENT = 'fx:reveal';

/* ---- one shared IntersectionObserver for every "once on scroll-in" effect ---- */
type Watch = (entry: IntersectionObserverEntry) => void;
const watchers = new Map<Element, Watch>();
let observer: IntersectionObserver | null = null;

/** Calls `cb` with every intersection change of `el` (first call = initial state). Returns a stop function. */
export function watchInView(el: Element, cb: Watch): () => void {
  if (typeof IntersectionObserver === 'undefined') {
    const t = window.setTimeout(() => cb({ isIntersecting: true, boundingClientRect: el.getBoundingClientRect() } as IntersectionObserverEntry), 0);
    return () => window.clearTimeout(t);
  }
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) watchers.get(e.target)?.(e);
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0 },
  );
  watchers.set(el, cb);
  observer.observe(el);
  return () => {
    if (watchers.get(el) !== cb) return;
    watchers.delete(el);
    observer?.unobserve(el);
  };
}

type Line = { x: number; y: number; w: number; h: number };

/** Line boxes of the text, relative to the (0×0, top-left) bars layer. Text nodes only. */
function measureLines(inner: HTMLElement, layer: HTMLElement): Line[] {
  const origin = layer.getBoundingClientRect();
  const range = document.createRange();
  const walker = document.createTreeWalker(inner, NodeFilter.SHOW_TEXT);
  const rows: { l: number; t: number; r: number; b: number }[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent || !n.textContent.trim()) continue;
    range.selectNodeContents(n);
    for (const r of Array.from(range.getClientRects())) {
      if (r.width < 0.5 || r.height < 0.5) continue;
      const mid = (r.top + r.bottom) / 2;
      const row = rows.find((q) => mid >= q.t && mid <= q.b);
      if (row) {
        row.l = Math.min(row.l, r.left);
        row.r = Math.max(row.r, r.right);
        row.t = Math.min(row.t, r.top);
        row.b = Math.max(row.b, r.bottom);
      } else rows.push({ l: r.left, t: r.top, r: r.right, b: r.bottom });
    }
  }
  range.detach?.();
  rows.sort((a, b) => a.t - b.t);
  const centers = rows.map((q) => (q.t + q.b) / 2);
  // A single line has no neighbour to measure the pitch from: use the line height, so a bar
  // over tight uppercase display type (line-height .906) covers the line, not the font's
  // whole ascender-to-descender box.
  const lh = parseFloat(getComputedStyle(inner).lineHeight);
  const solo = Number.isFinite(lh) && lh > 0 ? lh : Infinity;
  return rows.map((q, i) => {
    // Bars follow the line pitch so tight display leading never makes them overlap.
    const pitch = Math.min(
      i > 0 ? centers[i] - centers[i - 1] : Infinity,
      i < rows.length - 1 ? centers[i + 1] - centers[i] : Infinity,
      rows.length === 1 ? solo : Infinity,
    );
    const h = Number.isFinite(pitch) ? Math.min(q.b - q.t, pitch - Math.max(2, pitch * 0.05)) : q.b - q.t;
    const padX = Math.max(2, h * 0.04);
    return { x: q.l - origin.left - padX, y: centers[i] - h / 2 - origin.top, w: q.r - q.l + padX * 2, h };
  });
}

/** Runs the reveal. Returns a cleanup that jumps to the final state. */
function play(host: HTMLElement, inner: HTMLElement, layer: HTMLElement, wait: number): () => void {
  const anims: Animation[] = [];
  let revealed = false;
  let finished = false;
  let timer = 0;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    host.dispatchEvent(new CustomEvent(REVEAL_EVENT));
  };
  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(timer);
    host.setAttribute('data-rv', 'done'); // CSS stops hiding the text before the fill is removed
    anims.forEach((a) => a.cancel());
    layer.replaceChildren();
    reveal();
  };

  if (typeof inner.animate !== 'function') {
    finish();
    return finish;
  }

  if (window.matchMedia(RM).matches) {
    const fade = inner.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE, delay: wait, easing: 'ease', fill: 'both' });
    anims.push(fade);
    timer = window.setTimeout(reveal, wait);
    fade.finished.then(finish, () => {});
    return finish;
  }

  const lines = measureLines(inner, layer);
  if (!lines.length) {
    finish();
    return finish;
  }
  const n = lines.length;
  const stagger = n > 1 ? Math.min(STAGGER, 280 / (n - 1)) : 0;
  const full = wait + (n - 1) * stagger + SWEEP + HOLD; // every line covered → text appears

  const frag = document.createDocumentFragment();
  const bars = lines.map((l) => {
    const bar = document.createElement('span');
    bar.className = 'fx-rv-bar';
    bar.style.cssText = `left:${l.x.toFixed(1)}px;top:${l.y.toFixed(1)}px;width:${l.w.toFixed(1)}px;height:${l.h.toFixed(1)}px`;
    frag.appendChild(bar);
    return bar;
  });
  layer.replaceChildren(frag);

  bars.forEach((bar, i) => {
    const start = wait + i * stagger;
    const leave = full + i * stagger; // lines leave in the same order they arrived
    const total = leave + SWEEP - start;
    anims.push(
      bar.animate(
        [
          { transform: 'scaleX(0)', transformOrigin: '0% 50%', offset: 0, easing: EASE_IO },
          { transform: 'scaleX(1)', transformOrigin: '0% 50%', offset: SWEEP / total, easing: 'linear' },
          { transform: 'scaleX(1)', transformOrigin: '100% 50%', offset: (leave - start) / total, easing: EASE_IO },
          { transform: 'scaleX(0)', transformOrigin: '100% 50%', offset: 1 },
        ],
        { duration: total, delay: start, fill: 'both' },
      ),
    );
  });
  const show = inner.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1, delay: full, fill: 'both' });
  anims.push(show);
  show.finished.then(reveal, () => {});
  Promise.all(anims.map((a) => a.finished)).then(finish, () => {});
  return finish;
}

/**
 * A solid ink bar sweeps over each line from the left, the text appears under full cover,
 * and the bar leaves to the right. Plays once on scroll-in (after the preloader).
 * The text is real DOM text and is fully visible without JS; headings already on screen
 * when the page becomes visible are left alone (no flash).
 */
export default function RevealText({ as: Tag = 'span', className, id, style, delay = 0, children }: RevealTextProps) {
  const hostRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const layerRef = useRef<HTMLSpanElement>(null);
  const { booted } = useSite();
  const [entered, setEntered] = useState<null | 'early' | 'scroll'>(null);

  // Arm (hide) only after mount, and only if the reveal can actually be seen.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.setAttribute('data-rv', 'pending');
    let armed = false;
    const stop = watchInView(host, (entry) => {
      if (!armed) {
        const r = entry.boundingClientRect;
        const onScreen = r.bottom > 0 && r.top < window.innerHeight;
        const covered = isBootCovering();
        if (onScreen && !covered) {
          stop();
          host.setAttribute('data-rv', 'done');
          host.dispatchEvent(new CustomEvent(REVEAL_EVENT));
          return;
        }
        armed = true;
        host.setAttribute('data-rv', 'armed');
        if (onScreen) {
          stop();
          setEntered('early'); // under the preloader: play as the page is uncovered
          return;
        }
      }
      if (entry.isIntersecting) {
        stop();
        setEntered('scroll');
      }
    });
    return () => {
      stop();
      host.removeAttribute('data-rv');
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const inner = innerRef.current;
    const layer = layerRef.current;
    if (!entered || !booted || !host || !inner || !layer) return;
    if (host.getAttribute('data-rv') !== 'armed') return;
    host.setAttribute('data-rv', 'play');
    return play(host, inner, layer, Math.max(0, delay) + (entered === 'early' ? BOOT_GAP : 0));
  }, [entered, booted, delay]);

  const cls = className ? `fx-rv ${className}` : 'fx-rv';
  return (
    <Tag ref={hostRef} className={cls} id={id} style={style}>
      <span ref={innerRef} className="fx-rv-in">
        {children}
      </span>
      <span ref={layerRef} className="fx-rv-bars" aria-hidden="true" />
    </Tag>
  );
}
