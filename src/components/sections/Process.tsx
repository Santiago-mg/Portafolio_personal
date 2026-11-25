'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useSite, type Lang } from '@/components/site/SiteProvider';
import Figure, { bindFigure } from './process/Figure';
import { STAGE_TOPO, sigmaAt, stateOf, type State } from './process/geometry';

/* ---- tunables ---- */
/** Scroll-linked chapter only when motion is welcome and the viewport is tall enough to pin. */
const LIVE_QUERY = '(prefers-reduced-motion: no-preference) and (min-height: 540px)';
/** Time constant (s) that softens the scroll link — 0 would be rigid. */
const SMOOTH = 0.12;
/** The drawing rises this many px across the chapter (a slow parallax under the states). */
const DRIFT = 16;

type Step = { verb: string; title: string; body: string };
const COPY: Record<Lang, { title: string; fig: string; alt: string; step: (i: number) => string; steps: [Step, Step, Step] }> = {
  en: {
    title: 'Process — commit to production',
    fig: 'Fig. 1 — The stack, exploded view',
    alt: 'Diagram: the stack in exploded view — data (PostgreSQL, Prisma), API (Express, Clean Architecture), interface (React, TypeScript), a quality plate of tests and the Quality Gate, and the deploy pipeline (Jenkins, Docker).',
    step: (i) => `Step ${i + 1} of 3, ${['build', 'test', 'ship'][i]}: `,
    steps: [
      {
        verb: 'Build',
        title: 'Each layer, one job',
        body: 'Clean Architecture end to end: typed React interfaces over an Express API with domain, application and infrastructure layers.',
      },
      {
        verb: 'Test',
        title: 'Proven at every layer',
        body: 'Every layer has its own test: unit, API, E2E with Serenity/JS and Playwright, visual regression and security checks.',
      },
      {
        verb: 'Ship',
        title: 'Gated, then deployed',
        body: 'A Jenkins pipeline runs it all: typecheck, tests, SonarQube Quality Gate, Docker images, then deploy.',
      },
    ],
  },
  es: {
    title: 'Proceso — del commit a producción',
    fig: 'Fig. 1 — El stack, vista explosionada',
    alt: 'Diagrama: el stack en vista explosionada — datos (PostgreSQL, Prisma), API (Express, Clean Architecture), interfaz (React, TypeScript), una placa de calidad con pruebas y el Quality Gate, y el pipeline de despliegue (Jenkins, Docker).',
    step: (i) => `Paso ${i + 1} de 3, ${['crear', 'probar', 'lanzar'][i]}: `,
    steps: [
      {
        verb: 'Crear',
        title: 'Cada capa, una tarea',
        body: 'Clean Architecture de punta a punta: interfaces React tipadas sobre una API Express con capas de dominio, aplicación e infraestructura.',
      },
      {
        verb: 'Probar',
        title: 'Probado en cada capa',
        body: 'Cada capa tiene su propia prueba: unitarias, de API, E2E con Serenity/JS y Playwright, regresión visual y controles de seguridad.',
      },
      {
        verb: 'Lanzar',
        title: 'Aprobado, luego desplegado',
        body: 'Un pipeline de Jenkins lo ejecuta todo: chequeo de tipos, pruebas, Quality Gate de SonarQube, imágenes Docker y, al final, el despliegue.',
      },
    ],
  },
};

const STATES: readonly State[] = [0, 1, 2];

function subscribeLive(cb: () => void) {
  const mq = window.matchMedia(LIVE_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
const liveNow = () => typeof IntersectionObserver !== 'undefined' && window.matchMedia(LIVE_QUERY).matches;
const liveOnServer = () => false;

/**
 * Technical process chapter: BUILD → TEST → SHIP.
 * Live: a 300vh track pins a 100vh stage; scroll progress (read in rAF, only while the track is
 * on screen) opens and closes the exploded drawing, turns one group green and swaps the states.
 * Server, no-JS, reduced motion and short viewports: the same markup as three static scenes.
 */
export default function Process() {
  const { lang } = useSite();
  const t = COPY[lang];
  const live = useSyncExternalStore(subscribeLive, liveNow, liveOnServer);
  const [active, setActive] = useState<State>(0);
  const activeRef = useRef<State>(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const figRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const fig = figRef.current;
    if (!live || !track || !fig) return;
    const apply = bindFigure(fig);

    let raf = 0;
    let last = 0;
    let visible = false;
    let p = 0; // smoothed progress
    let target = 0;

    const progress = () => {
      const r = track.getBoundingClientRect();
      const range = r.height - window.innerHeight;
      return range > 0 ? Math.min(1, Math.max(0, -r.top / range)) : 0;
    };
    const write = () => {
      const sigma = sigmaAt(p);
      apply(sigma);
      fig.style.transform = `translate3d(0, ${((0.5 - p) * 2 * DRIFT).toFixed(2)}px, 0)`;
      const s = stateOf(sigma);
      if (s !== activeRef.current) {
        activeRef.current = s;
        setActive(s);
      }
    };
    const tick = (now: number) => {
      raf = 0;
      target = progress();
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
      last = now;
      p += (target - p) * (1 - Math.exp(-dt / SMOOTH));
      if (Math.abs(target - p) < 0.0004) p = target;
      write();
      if (p !== target && visible) raf = requestAnimationFrame(tick);
      else last = 0;
    };
    const kick = () => {
      if (!raf && visible) raf = requestAnimationFrame(tick);
    };
    // Entering (or re-entering) the chapter: start where the scroll position says, no catch-up slide.
    const snap = () => {
      p = target = progress();
      write();
    };

    const io = new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (visible && !was) snap();
      if (!visible) {
        cancelAnimationFrame(raf);
        raf = 0;
        last = 0;
      }
    });
    io.observe(track);
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', kick);
      // Back to the server-rendered BUILD pose (static scenes reuse this figure).
      apply(0);
      fig.style.transform = '';
    };
  }, [live]);

  return (
    <section className="prc" id="process" aria-labelledby="prc-h" data-live={live ? '' : undefined} lang={lang}>
      <div className="prc-track" ref={trackRef}>
        <div className="prc-stage">
          <svg className="prc-topo" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
            <path d={STAGE_TOPO} />
          </svg>
          <div className="prc-head">
            <h2 id="prc-h" className="prc-h">
              {t.title}
            </h2>
            <p className="prc-cap" aria-hidden="true">
              {t.fig}
            </p>
          </div>
          <p className="sr">{t.alt}</p>
          {STATES.map((i) => {
            const s = t.steps[i];
            const pos = !live ? undefined : i < active ? 'before' : i > active ? 'after' : 'on';
            return (
              <div key={i} className="prc-scene" data-pos={pos}>
                <div className="prc-meta" aria-hidden="true">
                  <span className="prc-num">
                    <span className="prc-roll">
                      <span>{`0${i + 1}`}</span>
                    </span>
                    <span className="prc-of">/03</span>
                  </span>
                  <span className="prc-dots">
                    {STATES.map((d) => (
                      <i key={d} data-on={d === i ? '' : undefined} />
                    ))}
                  </span>
                </div>
                <Figure ref={i === 0 ? figRef : undefined} state={i} hl={live && i === 0 ? active : i} lang={lang} />
                <div className="prc-copy">
                  <h3 className="prc-t">
                    <span className="sr">{t.step(i)}</span>
                    {s.title}
                  </h3>
                  <p className="prc-p">{s.body}</p>
                </div>
                <p className="prc-verb" aria-hidden="true">
                  <span>{s.verb}</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
