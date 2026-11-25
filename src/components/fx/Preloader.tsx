'use client';

import { useCallback, useLayoutEffect, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { useSite } from '@/components/site/SiteProvider';

/*
 * First-visit opening presentation, after the reference video: the SG mark rises and grows
 * on a charcoal screen, "all checks passed" floods it green, then the mark bursts into rays
 * while a hole opens from the centre and uncovers the stage.
 *
 * How it avoids both a flash of content and a stuck cover:
 * 1. The server renders a tiny <style id="sg-boot-gate"> that paints a plain ink cover
 *    (.sg::before) from the very first frame, plus an inline <script> that runs while the
 *    HTML is parsed. On a repeat visit (sessionStorage flag) or with reduced motion the
 *    script disables that stylesheet through the CSSOM before anything is painted — no
 *    DOM attribute changes, so hydration stays clean.
 * 2. No JS: a <noscript> style removes the cover. JS that dies before hydrating: the cover
 *    fades out by itself after FAILSAFE_MS (pure CSS).
 * 3. After hydration, useSyncExternalStore swaps the static cover for the animated one in
 *    a single commit, so there is never a frame without a cover.
 */

/* ---- tunables ---- */
const KEY = 'sg-boot'; // sessionStorage flag (value = timestamp of the first paint)
const GATE_ID = 'sg-boot-gate';
const LOG_MS = 1300; // rise + caption + green flood, nominal
const MIN_LOG_MS = 380; // if hydration ate the budget below this, skip straight to the wipe
const WIPE_MS = 900; // burst; must match --fx-burst in intro.css
const FAILSAFE_MS = 3000; // the static cover removes itself if React never arrives

// Rays of the burst: angle (deg), length (vmax), thickness, colour, delay (ms), travel.
const RAYS = Array.from({ length: 20 }, (_, i) => {
  const a = i * 18 + (i % 3) * 5 - 6;
  const palette = ['#fffde0', '#3ccb7f', '#181818', '#fffde0', '#d6f5e3'];
  return {
    a,
    l: 26 + ((i * 37) % 30),
    w: `${1.1 + ((i * 53) % 9) * 0.42}vmin`,
    c: palette[i % palette.length],
    d: (i * 29) % 110,
    far: `${38 + ((i * 41) % 26)}vmax`,
  };
});

const GATE_CSS =
  '@media (prefers-reduced-motion:no-preference){' +
  `.sg::before{content:"";position:fixed;inset:0;z-index:1000;background:#181818;animation:sg-boot-failsafe 240ms linear ${FAILSAFE_MS}ms forwards}}` +
  '@keyframes sg-boot-failsafe{to{opacity:0;visibility:hidden}}';

const GATE_JS =
  `(function(){var s=document.getElementById("${GATE_ID}");try{if(!s||!s.sheet)return;` +
  `if(window.matchMedia("(prefers-reduced-motion: reduce)").matches||sessionStorage.getItem("${KEY}")){s.sheet.disabled=true;return}` +
  `sessionStorage.setItem("${KEY}",String(Date.now()))}catch(e){try{s.sheet.disabled=true}catch(_){}}})();`;

const NOSCRIPT_CSS = '.sg::before{content:none!important;display:none!important}';

/* ---- decision (client only, computed once per page load) ---- */
type Decision = 'run' | 'skip';
let decision: Decision | null = null;
let logMs = LOG_MS;
let wiping = false;

function decide(): Decision {
  if (decision) return decision;
  decision = 'skip';
  if (typeof document === 'undefined') return decision;
  try {
    const gate = document.getElementById(GATE_ID) as HTMLStyleElement | null;
    const sheet = gate?.sheet;
    if (!sheet || sheet.disabled) return decision;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return decision;
    if (document.visibilityState === 'hidden') return decision;
    const stamp = Number(sessionStorage.getItem(KEY));
    // Inline script blocked (e.g. CSP): measure from navigation start instead.
    const since = stamp > 0 ? Math.max(0, Date.now() - stamp) : performance.now();
    if (!(stamp > 0)) sessionStorage.setItem(KEY, String(Date.now()));
    if (since > FAILSAFE_MS - 200) return decision;
    // Keep the whole sequence inside ~1.9 s from first paint: hydration time is taken
    // out of the terminal phase (the first ~150 ms of plain ink read as a fade-in).
    const left = LOG_MS - Math.max(0, since - 150);
    logMs = left < MIN_LOG_MS ? 0 : Math.min(LOG_MS, left);
    decision = 'run';
  } catch {
    /* storage blocked → no preloader */
  }
  return decision;
}

/** True while the preloader still hides the page (before the wipe starts). */
export function isBootCovering(): boolean {
  return decide() === 'run' && !wiping;
}

const subscribe = () => () => {};
const serverMode = () => 'ssr' as const;

export default function Preloader() {
  const { finishBoot } = useSite();
  const mode = useSyncExternalStore<Decision | 'ssr'>(subscribe, decide, serverMode);
  const [done, setDone] = useState(false);
  const onDone = useCallback(() => setDone(true), []);

  // Skipped (repeat visit, reduced motion, storage blocked, client navigation): boot now.
  useLayoutEffect(() => {
    if (mode === 'skip') finishBoot();
  }, [mode, finishBoot]);

  if (mode === 'ssr') {
    return (
      <>
        <style id={GATE_ID} dangerouslySetInnerHTML={{ __html: GATE_CSS }} />
        <script dangerouslySetInnerHTML={{ __html: GATE_JS }} />
        <noscript>
          <style>{NOSCRIPT_CSS}</style>
        </noscript>
      </>
    );
  }
  if (mode === 'skip' || done) return null;
  return <Cover onWipe={finishBoot} onDone={onDone} />;
}

function Cover({ onWipe, onDone }: { onWipe: () => void; onDone: () => void }) {
  const [phase, setPhase] = useState<'log' | 'wipe'>('log');

  useLayoutEffect(() => {
    // Lock page scroll while covering; reserve the scrollbar gutter so nothing reflows.
    const html = document.documentElement;
    const prev = { overflow: html.style.overflow, gutter: html.style.scrollbarGutter };
    html.style.overflow = 'hidden';
    html.style.scrollbarGutter = 'stable';
    let locked = true;
    const unlock = () => {
      if (!locked) return;
      locked = false;
      html.style.overflow = prev.overflow;
      html.style.scrollbarGutter = prev.gutter;
    };
    const wipe = window.setTimeout(() => {
      wiping = true;
      unlock();
      setPhase('wipe');
      onWipe(); // the hero pipeline plays while the page is being uncovered
    }, logMs);
    const end = window.setTimeout(onDone, logMs + WIPE_MS + 60);
    return () => {
      window.clearTimeout(wipe);
      window.clearTimeout(end);
      unlock();
    };
  }, [onWipe, onDone]);

  return (
    <div
      className="fx-boot"
      data-phase={phase === 'wipe' ? 'burst' : 'intro'}
      data-fast={logMs === 0 ? '' : undefined}
      aria-hidden="true"
      style={{ '--fx-intro': `${Math.max(logMs, 1)}ms` } as CSSProperties}
    >
      <div className="fx-boot-bg">
        <div className="fx-boot-flood" />
        <div className="fx-boot-pairs"><i /><i /></div>
      </div>
      <div className="fx-rays">
        {RAYS.map((r, i) => (
          <span
            key={i}
            className="fx-ray"
            style={{ '--a': `${r.a}deg`, '--l': r.l, '--w': r.w, '--c': r.c, '--d': `${r.d}ms`, '--far': r.far } as CSSProperties}
          />
        ))}
      </div>
      <span className="fx-boot-id">Santiago González</span>
      <span className="fx-boot-build">build 2026.11</span>
      <span className="fx-boot-mark">SG</span>
      <span className="fx-boot-cap">
        <span className="fx-boot-cap-t">All checks passed</span>
        <span className="fx-boot-cap-ok">✓</span>
      </span>
    </div>
  );
}
