/**
 * Scroll engine shared by every cloud passage: one IntersectionObserver decides which passages
 * are near the viewport, one rAF loop (only while something moves) reads their boxes, then
 * writes transforms and opacity. Reads happen before writes, so there is no layout thrash.
 * Progress is eased towards the scroll position, which turns main-thread lag into a soft drift
 * instead of jitter. No wheel or touch handlers: the page scrolls natively.
 */

import { cardAt, poseAt, type Variant } from './choreo';
import { LAYER_KEYS } from './paint';

/* ---- tunables ---- */
const TAU = 0.11; // s, easing of progress towards the scroll position
const NEAR = '25% 0px 25% 0px'; // active a quarter screen before entering / after leaving
const EPS = 2e-4;

type Entry = {
  el: HTMLElement;
  variant: Variant;
  layers: HTMLElement[];
  ground: HTMLElement | null;
  card: HTMLElement | null;
  near: boolean;
  fresh: boolean;
  p: number;
  target: number;
  h: number;
  lastT: string[];
  lastO: string[];
};

const entries = new Map<Element, Entry>();
let io: IntersectionObserver | null = null;
let raf = 0;
let prevT = 0;
let listening = false;

/** `data-near`: layers may be promoted and drift; `data-live`: near and the tab is visible (drift runs). */
function setLive(e: Entry): void {
  const flag = (name: string, on: boolean) => (on ? e.el.setAttribute(name, '') : e.el.removeAttribute(name));
  flag('data-near', e.near);
  flag('data-live', e.near && !document.hidden);
}

function kick(): void {
  if (raf || document.hidden) return;
  for (const e of entries.values()) {
    if (e.near) {
      raf = requestAnimationFrame(frame);
      return;
    }
  }
}

function onVisibility(): void {
  entries.forEach(setLive);
  if (document.hidden) {
    cancelAnimationFrame(raf);
    raf = 0;
    prevT = 0;
  } else kick();
}

function frame(t: number): void {
  raf = 0;
  const dt = prevT ? Math.min(0.064, (t - prevT) / 1000) : 1 / 60;
  prevT = t;
  const vh = window.innerHeight;

  // read
  for (const e of entries.values()) {
    if (!e.near) continue;
    const r = e.el.getBoundingClientRect();
    e.h = r.height;
    const p = (vh - r.top) / (r.height + vh);
    e.target = p < 0 ? 0 : p > 1 ? 1 : p;
  }

  // write
  const k = 1 - Math.exp(-dt / TAU);
  let moving = false;
  for (const e of entries.values()) {
    if (!e.near) continue;
    if (e.fresh) {
      e.p = e.target;
      e.fresh = false;
    } else if (Math.abs(e.target - e.p) < EPS) e.p = e.target;
    else {
      e.p += (e.target - e.p) * k;
      moving = true;
    }
    write(e, vh);
  }
  if (moving) raf = requestAnimationFrame(frame);
  else prevT = 0;
}

function write(e: Entry, vh: number): void {
  for (let i = 0; i < LAYER_KEYS.length; i++) {
    const el = e.layers[i];
    if (!el) continue;
    const pose = poseAt(e.variant, LAYER_KEYS[i], e.p, e.h, vh);
    const tf = `translate3d(${pose.x.toFixed(3)}vw,${pose.y.toFixed(1)}px,0)`;
    if (tf !== e.lastT[i]) {
      el.style.transform = tf;
      e.lastT[i] = tf;
      // the room seam rides with the bank, always behind its opaque core
      if (LAYER_KEYS[i] === 'bank' && e.ground) e.ground.style.transform = `translate3d(0,${pose.y.toFixed(1)}px,0)`;
    }
    const op = pose.o.toFixed(3);
    if (op !== e.lastO[i]) {
      el.style.opacity = op;
      e.lastO[i] = op;
    }
  }
  if (e.card) e.card.style.transform = `translate3d(0,${cardAt(e.variant, e.p, e.h).toFixed(1)}px,0)`;
}

function clear(e: Entry): void {
  for (const el of e.layers) {
    if (!el) continue;
    el.style.removeProperty('transform');
    el.style.removeProperty('opacity');
  }
  e.ground?.style.removeProperty('transform');
  e.card?.style.removeProperty('transform');
  e.el.removeAttribute('data-near');
  e.el.removeAttribute('data-live');
}

function onIntersect(list: IntersectionObserverEntry[]): void {
  for (const it of list) {
    const e = entries.get(it.target);
    if (!e) continue;
    if (it.isIntersecting && !e.near) e.fresh = true;
    e.near = it.isIntersecting;
    setLive(e);
  }
  kick();
}

/**
 * Starts scroll choreography for a passage element (which contains `[data-layer]` layers,
 * an optional `[data-ground]` and `[data-card]`). Returns a cleanup that restores the rest pose.
 */
export function attachPassage(el: HTMLElement, variant: Variant): () => void {
  const e: Entry = {
    el,
    variant,
    layers: LAYER_KEYS.map((k) => el.querySelector<HTMLElement>(`[data-layer="${k}"]`) as HTMLElement),
    ground: el.querySelector<HTMLElement>('[data-ground]'),
    card: el.querySelector<HTMLElement>('[data-card]'),
    near: false,
    fresh: true,
    p: 0,
    target: 0,
    h: 1,
    lastT: [],
    lastO: [],
  };
  entries.set(el, e);
  io ??= new IntersectionObserver(onIntersect, { rootMargin: NEAR });
  io.observe(el);
  if (!listening) {
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    listening = true;
  }
  return () => {
    io?.unobserve(el);
    entries.delete(el);
    clear(e);
    if (entries.size === 0) {
      cancelAnimationFrame(raf);
      raf = 0;
      prevT = 0;
      io?.disconnect();
      io = null;
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', kick);
      document.removeEventListener('visibilitychange', onVisibility);
      listening = false;
    }
  };
}
