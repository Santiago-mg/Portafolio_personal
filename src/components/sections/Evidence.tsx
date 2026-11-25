'use client';

import { useEffect, useRef } from 'react';
import { useSite, type Lang } from '@/components/site/SiteProvider';
import DrawStroke from '@/components/fx/DrawStroke';

type Cell = { to: number; suffix: string; label: string } | { check: true; label: string };

const COPY: Record<Lang, { aria: string; srcAria: string; cells: Cell[]; sources: string[] }> = {
  en: {
    aria: 'Evidence',
    srcAria: 'Sources',
    cells: [
      { to: 1000, suffix: '+', label: 'automated tests in projects I worked on' },
      { to: 37, suffix: '', label: 'real defects found & fixed' },
      { to: 20, suffix: '+', label: 'testing & quality tools used' },
      { to: 11, suffix: '', label: 'projects built since 2023' },
      { check: true, label: 'SonarQube Quality Gate passed' },
    ],
    sources: [
      'Team projects: CelularPro web 415 (Vitest) + OpenCart 534 (Vitest 347, PHPUnit 110 + 77) + LandingForge 66 E2E checks.',
      'OpenCart 4.1.0.3 — each written first as a failing test (TDD red → green), then fixed in its code.',
      'Testing, security and quality tools across projects; a few were used by teammates.',
      'From 2023 to today — see the changelog.',
      'OpenCart QA · 40.4% coverage on tested feature files, up from 0%.',
    ],
  },
  es: {
    aria: 'Evidencia',
    srcAria: 'Fuentes',
    cells: [
      { to: 1000, suffix: '+', label: 'pruebas automatizadas en proyectos en los que participé' },
      { to: 37, suffix: '', label: 'defectos reales encontrados y corregidos' },
      { to: 20, suffix: '+', label: 'herramientas de testing y calidad usadas' },
      { to: 11, suffix: '', label: 'proyectos construidos desde 2023' },
      { check: true, label: 'Quality Gate de SonarQube aprobado' },
    ],
    sources: [
      'Proyectos en equipo: CelularPro web 415 (Vitest) + OpenCart 534 (Vitest 347, PHPUnit 110 + 77) + LandingForge 66 comprobaciones E2E.',
      'OpenCart 4.1.0.3: cada uno escrito primero como prueba roja (TDD) y corregido en su código.',
      'Herramientas de testing, seguridad y calidad en varios proyectos; algunas las usó el equipo.',
      'De 2023 a hoy: ver el changelog.',
      'OpenCart QA · 40,4 % de cobertura en los archivos probados (antes 0 %).',
    ],
  },
};

function fmt(v: number, suffix: string, lang: Lang): string {
  const n = Math.round(v);
  const s = n >= 1000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'es' ? '.' : ',') : String(n);
  return s + suffix;
}

const DURATION = 700;

export default function Evidence() {
  const { lang, booted } = useSite();
  const t = COPY[lang];
  const root = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  const langRef = useRef<Lang>(lang);

  useEffect(() => { langRef.current = lang; }, [lang]);

  // Count up once when the bar scrolls into view. The final text is server-rendered; it is only
  // swapped for the running value when JS is on and motion is allowed.
  useEffect(() => {
    const el = root.current;
    if (!el || done.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const nums = Array.from(el.querySelectorAll<HTMLElement>('[data-to]'));
    const write = (n: HTMLElement, v: number) => {
      if (n.firstChild) n.firstChild.nodeValue = fmt(v, n.dataset.suffix ?? '', langRef.current);
    };
    nums.forEach((n) => write(n, 0));
    if (!booted) return;

    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / DURATION);
          const eased = 1 - Math.pow(1 - p, 3);
          nums.forEach((n) => write(n, Number(n.dataset.to) * eased));
          if (p < 1) raf = requestAnimationFrame(tick);
          else done.current = true;
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [booted]);

  return (
    <section className="evi" aria-label={t.aria}>
      <div className="wrap" ref={root}>
        <ul className="evi-grid" lang={lang}>
          {t.cells.map((c, i) => (
            <li key={i} className="evi-cell">
              <p className="disp evi-n" style={'check' in c ? { color: 'var(--pass)' } : undefined}>
                {'check' in c ? (
                  <svg width="52" height="52" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={lang === 'es' ? 'Aprobado' : 'Passed'}><path d="M2.5 8.5l3.5 3.5 7.5-8.5" /></svg>
                ) : i === 1 ? (
                  <span className="stroke-host">
                    <span className="evi-num" data-to={c.to} data-suffix={c.suffix}>{fmt(c.to, c.suffix, lang)}</span>
                    <DrawStroke variant="circle" color="pass" delay={300} />
                  </span>
                ) : (
                  <span className="evi-num" data-to={c.to} data-suffix={c.suffix}>{fmt(c.to, c.suffix, lang)}</span>
                )}
                <sup>{i + 1}</sup>
              </p>
              <p className="meta evi-meta">{c.label}</p>
            </li>
          ))}
        </ul>
        <ol className="foot" aria-label={t.srcAria} lang={lang}>
          {t.sources.map((s, i) => (
            <li key={i}><b>{i + 1}</b>{s}</li>
          ))}
        </ol>
        <div style={{ height: 32 }} />
      </div>
    </section>
  );
}
