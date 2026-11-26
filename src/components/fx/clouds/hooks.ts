'use client';

import { useEffect, useSyncExternalStore, type RefObject } from 'react';
import { getClouds, getServerClouds, requestClouds, subscribeClouds, type CloudTextures } from './store';
import { attachPassage } from './engine';
import type { Variant } from './choreo';

/* ---- tunables ---- */
const BOOT_FALLBACK_MS = 4000; // paint anyway if the opening presentation never reports done

/**
 * The shared cloud textures (blob URLs), or `null` until they are painted. Painting starts
 * once `enabled` is true; the server and the hydration pass always see `null`.
 */
export function useCloudTextures(enabled: boolean, booted: boolean): CloudTextures | null {
  const tex = useSyncExternalStore(subscribeClouds, getClouds, getServerClouds);
  useEffect(() => {
    if (!enabled || tex) return;
    if (booted) {
      requestClouds();
      return;
    }
    const t = window.setTimeout(requestClouds, BOOT_FALLBACK_MS);
    return () => window.clearTimeout(t);
  }, [enabled, booted, tex]);
  return tex;
}

const RM = '(prefers-reduced-motion: reduce)';
function subscribeRM(cb: () => void): () => void {
  const m = window.matchMedia(RM);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
}
const getRM = () => window.matchMedia(RM).matches;
const getServerRM = () => false;

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeRM, getRM, getServerRM);
}

/** Scroll choreography for a passage while `enabled` (not in high contrast, not with reduced motion). */
export function usePassageMotion(ref: RefObject<HTMLElement | null>, variant: Variant, enabled: boolean): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    return attachPassage(el, variant);
  }, [ref, variant, enabled]);
}
