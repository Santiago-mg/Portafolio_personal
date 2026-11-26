/**
 * Session cache of the painted cloud textures. Painting starts once (the first passage asks),
 * runs in idle slices so no task is long, and ends as blob URLs that every passage shares.
 * Browser only; the server snapshot is always `null`, so hydration never sees textures.
 */

import { LAYER_KEYS, paintLayer, type LayerKey } from './paint';

export type Palette = 'day' | 'dusk';
export type CloudTextures = Record<LayerKey, Record<Palette, string>>;

/* ---- tunables ---- */
const SLICE_MS = 12; // max work per idle slice (well under a frame)
const MIN_SLICE_MS = 6; // when the idle callback timed out, still make some progress
const IDLE_TIMEOUT = 400; // ms before an idle callback is forced (busy page)
const ENCODE = 'image/webp'; // falls back to PNG where WebP encoding is missing
const ENCODE_Q = 0.9;

let state: 'idle' | 'running' | 'ready' | 'failed' = 'idle';
let textures: CloudTextures | null = null;
const listeners = new Set<() => void>();

export function subscribeClouds(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
export const getClouds = (): CloudTextures | null => textures;
export const getServerClouds = (): CloudTextures | null => null;

/** Texture resolution: clouds are soft, so small screens get smaller textures (DPR does not matter). */
function quality(): number {
  const w = window.innerWidth;
  return w < 768 ? 0.6 : w < 1500 ? 0.8 : 1;
}

type IdleDeadline = { didTimeout: boolean; timeRemaining: () => number };
type IdleWindow = Window & { requestIdleCallback?: (cb: (d: IdleDeadline) => void, o?: { timeout: number }) => number };

function idle(cb: (budget: number) => void): void {
  const w = window as IdleWindow;
  if (w.requestIdleCallback) {
    w.requestIdleCallback((d) => cb(d.didTimeout ? MIN_SLICE_MS : Math.min(SLICE_MS, Math.max(MIN_SLICE_MS, d.timeRemaining()))), { timeout: IDLE_TIMEOUT });
  } else {
    window.setTimeout(() => cb(SLICE_MS), 16);
  }
}

/** Runs a yielding generator in idle slices. */
function drive<T>(gen: Generator<void, T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const tick = (budget: number) => {
      const end = performance.now() + budget;
      try {
        for (;;) {
          const r = gen.next();
          if (r.done) return resolve(r.value);
          if (performance.now() >= end) break;
        }
      } catch (e) {
        return reject(e);
      }
      idle(tick);
    };
    idle(tick);
  });
}

async function encode(img: ImageData): Promise<string> {
  let blob: Blob | null;
  if (typeof OffscreenCanvas !== 'undefined') {
    const c = new OffscreenCanvas(img.width, img.height);
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('2d context');
    ctx.putImageData(img, 0, 0);
    blob = await c.convertToBlob({ type: ENCODE, quality: ENCODE_Q });
  } else {
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('2d context');
    ctx.putImageData(img, 0, 0);
    blob = await new Promise<Blob | null>((res) => c.toBlob(res, ENCODE, ENCODE_Q));
  }
  if (!blob) throw new Error('encode');
  const url = URL.createObjectURL(blob);
  // Decode now, so the crossfade never shows a half-loaded layer.
  const im = new Image();
  im.src = url;
  try {
    await im.decode();
  } catch {}
  return url;
}

async function run(): Promise<void> {
  const q = quality();
  const out = {} as CloudTextures;
  for (const k of LAYER_KEYS) {
    const painted = await drive(paintLayer(k, q));
    const [day, dusk] = await Promise.all([encode(painted.day), encode(painted.dusk)]);
    out[k] = { day, dusk };
  }
  textures = out;
  state = 'ready';
  listeners.forEach((l) => l());
}

/** Starts painting (once per session). Safe to call from every passage. */
export function requestClouds(): void {
  if (state !== 'idle' || typeof window === 'undefined') return;
  state = 'running';
  run().catch(() => {
    // No canvas or no encoder: passages keep their CSS composition.
    state = 'failed';
  });
}
