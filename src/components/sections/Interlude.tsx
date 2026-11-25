'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSite } from '@/components/site/SiteProvider';
import FlyingPosters from '@/components/gallery/FlyingPosters';
import { POSTER_RADIUS, projectPosters } from '@/components/gallery/posterImages';
import { useReducedMotion } from '@/components/gallery/hooks';
import { PROJECTS } from '@/content/projects';

/* ---- tunables ---- */
const PHRASE = 'BUILD — TEST — SHIP — ';
const ROWS = [
  { dir: -1, base: 0.3, outline: false },
  { dir: 1, base: 0.62, outline: true }, // floats in front of the posters
  { dir: -1, base: 0.86, outline: false },
];
const TRAVEL = 0.55; // each row slides this fraction of the viewport width while the band crosses the screen
const SMOOTH = 0.09; // s — time constant that softens the scroll link (0 = rigid)
const POSTER_SCROLL = 0.55; // poster columns move this many px per px of page scroll (alternating directions)

const years = PROJECTS.flatMap((p) => p.year.match(/\d{4}/g) ?? []).map(Number);
const FROM = Math.min(...years);
const TO = Math.max(...years);
const N = PROJECTS.length;

const T = {
  en: {
    sr: `Build, test, ship: ${N} projects from ${FROM} to ${TO}.`,
    cap: `${N} projects · ${FROM} → ${TO}`,
  },
  es: {
    sr: `Construir, probar, desplegar: ${N} proyectos de ${FROM} a ${TO}.`,
    cap: `${N} proyectos · ${FROM} → ${TO}`,
  },
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Full-bleed dark band between Work and Quality: three rows of huge type that slide with
 * page scroll (opposite directions) and the project posters floating through in 3D depth.
 * Decorative; screen readers get one sentence.
 */
export default function Interlude() {
  const { lang, booted } = useSite();
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [near, setNear] = useState(false);
  const [posters, setPosters] = useState<string[] | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const t = T[lang];

  // WebGL is created only when the band is within one viewport of the screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          setNear(true);
        }
      },
      { rootMargin: '100% 0px 100% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Posters are drawn when the browser is idle after boot (or as soon as the band is near).
  useEffect(() => {
    if (!booted && !near) return;
    let alive = true;
    const start = () => {
      projectPosters('portrait').then(
        (urls) => {
          if (alive) setPosters(urls);
        },
        () => {},
      );
    };
    let idle = 0;
    let timer = 0;
    if (near) start();
    else if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(start, { timeout: 3000 });
    else timer = window.setTimeout(start, 1200);
    return () => {
      alive = false;
      if (idle) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, [booted, near]);

  // Band size → poster layout.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      setSize((prev) => (prev && Math.abs(prev.w - box.width) < 1 && Math.abs(prev.h - box.height) < 1 ? prev : { w: box.width, h: box.height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Scroll-linked marquee: rAF only while visible and moving, transforms only.
  useEffect(() => {
    const root = rootRef.current;
    const rows = rowRefs.current.filter((r): r is HTMLDivElement => !!r);
    if (!root || rows.length !== ROWS.length) return;
    let unit = 0;
    let vw = 0;
    let visible = false;
    let raf = 0;
    let last = 0;
    const cur = ROWS.map(() => 0);
    const dst = ROWS.map(() => 0);

    const measure = () => {
      unit = (rows[0].firstElementChild as HTMLElement | null)?.getBoundingClientRect().width || 0;
      vw = window.innerWidth;
    };
    const targets = () => {
      const r = root.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = reduce ? 0.5 : clamp((vh - r.top) / (vh + r.height), 0, 1);
      ROWS.forEach((row, i) => {
        dst[i] = -row.base * unit + row.dir * (p - 0.5) * TRAVEL * vw;
      });
    };
    const write = () => {
      rows.forEach((el, i) => {
        el.style.transform = `translate3d(${cur[i].toFixed(2)}px,0,0)`;
      });
    };
    const snap = () => {
      measure();
      targets();
      dst.forEach((v, i) => {
        cur[i] = v;
      });
      write();
    };
    const tick = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      targets();
      const k = SMOOTH > 0 ? 1 - Math.exp(-dt / SMOOTH) : 1;
      let moving = false;
      cur.forEach((c, i) => {
        const d = dst[i] - c;
        if (Math.abs(d) > 0.05) {
          cur[i] = c + d * k;
          moving = true;
        } else cur[i] = dst[i];
      });
      write();
      if (moving && visible && !document.hidden) raf = requestAnimationFrame(tick);
      else last = 0;
    };
    const wake = () => {
      if (!raf && visible && !reduce) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => {
        const was = visible;
        visible = entries.some((e) => e.isIntersecting);
        if (visible && !was) snap(); // re-enter where the scroll position says, no catch-up slide
      },
      { rootMargin: '15% 0px 15% 0px' },
    );
    const ro = new ResizeObserver(() => snap()); // font swap / viewport changes alter the phrase width
    const onScroll = () => wake();
    const onResize = () => snap();

    snap();
    io.observe(root);
    ro.observe(rows[0]);
    if (!reduce) window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [reduce]);

  const fp = useMemo(() => {
    if (!size || !size.w || !size.h) return null;
    const wide = size.w >= 900;
    const cols = wide ? 3 : 2;
    const planeW = Math.round(clamp(size.w * (wide ? 0.16 : 0.3), 120, 290));
    const planeH = Math.round(planeW * 1.25);
    const pitch = size.w * (wide ? 0.31 : 0.46); // distance between column centres
    return { cols, planeW, planeH, columnGap: Math.max(16, Math.round(pitch - planeW)), gap: Math.round(size.h * 0.14) };
  }, [size]);

  return (
    <section ref={rootRef} className="fx-il" aria-labelledby="il-h">
      <h2 id="il-h" className="sr">
        {t.sr}
      </h2>
      <div className="fx-il-stage" aria-hidden="true">
        <div className="fx-il-rows">
          {ROWS.map((row, i) => (
            <div
              key={i}
              ref={(el) => {
                rowRefs.current[i] = el;
              }}
              className={`fx-il-row${row.outline ? ' is-outline' : ''}`}
            >
              {[0, 1, 2].map((k) => (
                <span key={k}>{PHRASE}</span>
              ))}
            </div>
          ))}
        </div>
        {near && posters && fp ? (
          <FlyingPosters
            className="fx-il-posters"
            items={posters}
            planeWidth={fp.planeW}
            planeHeight={fp.planeH}
            columns={fp.cols}
            columnGap={fp.columnGap}
            gap={fp.gap}
            alternate
            radius={fp.planeW * POSTER_RADIUS}
            rotation={64}
            rotationCenter={0.5}
            axis="diagonal"
            distortion={2}
            lean={0.6}
            shading={0.35}
            fade={0.22}
            scrollEase={0.08}
            speed={0}
            wheel={false}
            drag={false}
            pageScroll={reduce ? 0 : POSTER_SCROLL}
          />
        ) : null}
        <div className="fx-il-cap">
          <div className="wrap fx-il-cap-in">
            <span>{t.cap}</span>
            <span>FIG. 01 — {String(N).padStart(2, '0')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
