'use client';

import { useSyncExternalStore } from 'react';

const RM = '(prefers-reduced-motion: reduce)';
const noop = () => () => {};

function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia(RM);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

/** Live `prefers-reduced-motion` (false on the server and during hydration). */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeMotion, () => window.matchMedia(RM).matches, () => false);
}

let webgl2: 'yes' | 'no' | null = null;
function detectWebGL2(): 'yes' | 'no' {
  if (webgl2) return webgl2;
  try {
    const ctx = document.createElement('canvas').getContext('webgl2');
    webgl2 = ctx ? 'yes' : 'no';
    ctx?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webgl2 = 'no';
  }
  return webgl2;
}

/** 'unknown' on the server and during hydration, then whether WebGL2 is available. */
export function useWebGL2(): 'unknown' | 'yes' | 'no' {
  return useSyncExternalStore(noop, detectWebGL2, () => 'unknown' as const);
}

/* Theme-resolved values (canvas/WebGL can't read CSS variables by themselves). */
let themeKey: string | null = null;
let themeValue = '';
function subscribeTheme(cb: () => void) {
  const sg = document.querySelector('.sg');
  if (!sg) return () => {};
  const mo = new MutationObserver(cb);
  mo.observe(sg, { attributes: true, attributeFilter: ['data-theme'] });
  return () => mo.disconnect();
}
function readTheme(): string {
  const sg = document.querySelector('.sg');
  if (!sg) return '';
  const key = sg.getAttribute('data-theme') ?? '';
  if (key === themeKey) return themeValue;
  const cs = getComputedStyle(sg);
  themeKey = key;
  themeValue = ['--ink', '--muted', '--focus', '--f-disp']
    .map((name) => cs.getPropertyValue(name).trim())
    .join('|');
  return themeValue;
}

export type ThemeTokens = { ink: string; muted: string; focus: string; disp: string } | null;

/** Resolved --ink, --muted, --focus and --f-disp of the current theme (null on the server). */
export function useThemeTokens(): ThemeTokens {
  const raw = useSyncExternalStore(subscribeTheme, readTheme, () => '');
  if (!raw) return null;
  const [ink, muted, focus, disp] = raw.split('|');
  return { ink, muted, focus, disp };
}
