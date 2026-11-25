'use client';

import CodePortrait from '@/components/CodePortrait';
import DrawStroke from '@/components/fx/DrawStroke';
import { useSite } from '@/components/site/SiteProvider';

const STAGES: [string, string, string][] = [
  ['typecheck', '0 errors', 'tsc · CelularPro pipelines'],
  ['unit', '415 passing', '415 Vitest tests · CelularPro web'],
  ['e2e', '32 scenarios', 'Serenity/JS + Playwright · CelularPro'],
  ['security', '37 defects fixed', 'OWASP · SonarQube · ZAP · OpenCart'],
  ['quality gate', 'passed', 'SonarQube Quality Gate · OpenCart'],
  ['deploy', 'shipped', 'Vercel · CelularPro'],
];

const Check = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
);

const T = {
  en: {
    label: 'Full-stack developer · QA automation · Medellín, CO',
    quick: '30-second version',
    lead: 'Full-stack developer — TypeScript · React · Node.js — who designs with Clean Architecture and proves every feature with automated tests, from unit to E2E, security and accessibility. Systems Engineering student at Universidad de Medellín.',
    see: 'See my work',
    avail: 'Open to junior full-stack & QA roles and internships',
    summary: 'Quality summary: 415 unit tests, 32 end-to-end scenarios, 37 defects fixed, Quality Gate passed.',
    hint: 'move the cursor to compile',
    hintTouch: 'drag across the photo to compile',
    on: 'Show code version',
    off: 'Show photo',
    alt: 'Santiago González, portrait',
  },
  es: {
    label: 'Desarrollador full-stack · QA automation · Medellín, CO',
    quick: 'Versión de 30 segundos',
    lead: 'Desarrollador full-stack (TypeScript · React · Node.js) que diseña con Clean Architecture y demuestra cada funcionalidad con pruebas automatizadas: unitarias, E2E, seguridad y accesibilidad. Estudiante de Ingeniería de Sistemas en la Universidad de Medellín.',
    see: 'Ver proyectos',
    avail: 'Disponible para roles junior full-stack, QA y prácticas',
    summary: 'Resumen de calidad: 415 pruebas unitarias, 32 escenarios E2E, 37 defectos corregidos, Quality Gate aprobado.',
    hint: 'mueve el cursor para compilar',
    hintTouch: 'desliza sobre la foto para compilar',
    on: 'Ver versión en código',
    off: 'Ver foto',
    alt: 'Santiago González, retrato',
  },
};

export default function Hero() {
  const { lang } = useSite();
  const t = T[lang];
  return (
    <section className="hero" aria-labelledby="hero-h">
      <div className="wrap">
        <div className="hero-top">
          <p className="label">{t.label}</p>
        </div>

        <div className="pl" aria-hidden="true">
          <div className="pl-track"><div className="pl-fill" /></div>
          <ol className="pl-stages">
            {STAGES.map(([name, res, tip]) => (
              <li className="pl-st" key={name}>
                <span className="pl-dot"><span className="pl-pend" /><span className="pl-ok"><Check /></span></span>
                <span className="pl-txt"><span className="pl-name">{name}</span><span className="pl-res">{res}</span></span>
                <span className="pl-tip">{tip}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="sr">{t.summary}</p>

        <div className="hero-grid with-photo">
          <div className="hero-main">
            {lang === 'en' ? (
              <h1 id="hero-h" className="disp t-hero hero-h">
                I build<br />software<br />that <span className="stroke-host">passes.<DrawStroke variant="underline" color="pass" delay={900} /></span>
              </h1>
            ) : (
              <h1 id="hero-h" className="disp hero-h" style={{ fontSize: 'clamp(40px, 5vw, 84px)' }}>
                Construyo software que pasa <span className="stroke-host">todas las pruebas.<DrawStroke variant="underline" color="pass" delay={900} /></span>
              </h1>
            )}
            <p className="t-lead">{t.lead}</p>
            <div className="hero-cta">
              <a className="b b-1" href="#work">{t.see} <span className="go">→</span></a>
              <a className="b b-t" href="https://github.com/Santiago-mg"><span className="ul">GitHub</span> <span className="go go-ne" aria-hidden="true">↗</span></a>
            </div>
            <p className="avail"><span className="dot" />{t.avail}</p>
            <div className="spec">
              <p className="label ink-top" style={{ marginBottom: 14 }}>Spec sheet</p>
              <dl>
                <dt>stack</dt><dd>TypeScript · React · Node.js</dd>
                <dt>quality</dt><dd>Vitest · Playwright · Cypress · Serenity/JS</dd>
                <dt>ship</dt><dd>Docker · Jenkins · SonarQube · Vercel</dd>
                <dt>based</dt><dd>Medellín, Colombia (UTC−5)</dd>
              </dl>
            </div>
          </div>
          <div className="hero-photo">
            <CodePortrait src="/santiago.webp" alt={t.alt} hint={t.hint} hintTouch={t.hintTouch} toggleOn={t.on} toggleOff={t.off} />
          </div>
        </div>
      </div>
    </section>
  );
}
