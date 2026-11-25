'use client';

import { useEffect, useRef } from 'react';
import RevealText from '@/components/fx/RevealText';

type Item = { ver: string; cls?: string; meta: string; title: string; text?: string };
const ITEMS: Item[] = [
  { ver: 'next', cls: 'ver-next', meta: 'unreleased', title: 'Looking for my first professional role' },
  { ver: 'v1.0', cls: 'ver-cur', meta: 'Nov 2026', title: 'OpenCart QA', text: '534 tests, 37 real defects fixed, OWASP and a passed Quality Gate.' },
  { ver: 'v0.9', meta: 'Oct 2026', title: 'CelularPro · Movies', text: 'Production-grade quality with 6+ test frameworks, AI applied to testing, Jenkins, SonarQube and Vercel. Plus an offline-first Flutter app.' },
  { ver: 'v0.8', meta: 'Aug–Oct 2026', title: 'LandingForge', text: 'Next.js, generative AI with Gemini, an admin panel and accessibility.' },
  { ver: 'v0.6', meta: 'Jun 2026', title: 'EstadiaPro', text: 'A three-layer monorepo with Docker and Kubernetes.' },
  { ver: 'v0.5', meta: 'Mar–May 2026', title: 'Architecture and DevOps', text: 'Docker, GitHub Actions, Jenkins and Kubernetes; Real Estate API with Clean Architecture; Mi Boleta in React + TypeScript.' },
  { ver: 'v0.3', meta: 'Sep 2025', title: 'First full-stack web app', text: 'A bookings platform with FastAPI and Supabase.' },
  { ver: 'v0.2', meta: 'Mar–May 2024', title: 'Python, seriously', text: 'Battleship (Kivy, MVC, tests) and a payroll system (MVC, three interfaces, cloud PostgreSQL, tests).' },
  { ver: 'v0.1', meta: '2023', title: 'Hello, Systems Engineering', text: 'Starts at Universidad de Medellín. First classroom project in Python.' },
];

export default function Changelog() {
  const ref = useRef<HTMLOListElement>(null);

  // The hidden state is armed only after mount, so the list is fully visible without JS.
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof IntersectionObserver === 'undefined') return;
    el.classList.add('is-armed');
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add('is-in');
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      el.classList.remove('is-armed', 'is-in');
    };
  }, []);

  return (
    <section className="sec" id="log" aria-labelledby="log-h">
      <div className="wrap">
        <div className="g12 sec-head">
          <p className="label s12">04 — Log</p>
          <RevealText as="h2" id="log-h" className="disp-s t-h2 s7 t12">Changelog</RevealText>
          <p className="t-small s5 t12">From a first Python project in 2023 to a passed Quality Gate in November 2026. Newest first.</p>
        </div>
        <ol className="tl" ref={ref}>
          {ITEMS.map((it, i) => (
            <li
              className="tl-item"
              key={it.ver}
              style={{
                ['--i' as string]: i,
                ...(i === ITEMS.length - 1 ? { borderBottom: 'var(--bw) solid var(--rule)' } : null),
              }}
            >
              <span className={`ver${it.cls ? ` ${it.cls}` : ''}`}>{it.ver}</span>
              <span className="meta">{it.meta}</span>
              <div className="tl-body">
                <p className="t-h4" style={{ fontWeight: 600 }}>{it.title}</p>
                {it.text ? <p className="t-small" style={{ marginTop: 4 }}>{it.text}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
