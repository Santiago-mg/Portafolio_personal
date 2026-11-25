'use client';

import { useState } from 'react';
import RevealText from '@/components/fx/RevealText';

const PROJECTS: [string, string][] = [
  ['cp', 'CelularPro'], ['oc', 'OpenCart QA'], ['lf', 'LandingForge'], ['ep', 'EstadiaPro'],
  ['mb', 'Mi Boleta'], ['mv', 'Movies (Flutter)'], ['re', 'Real Estate API'], ['dv', 'Dream Vacation'],
  ['pc', 'Spring PetClinic'], ['kn', 'Knote'], ['py', 'Payroll system'], ['bn', 'Battleship'], ['bk', 'Bookings platform'],
];
const ALL = PROJECTS.map((p) => p[0]);
const WEB = ['cp', 'oc', 'lf', 'ep', 'mb', 're', 'dv', 'bk'];

type Tech = [name: string, ids: string[], note?: string];
const GROUPS: [string, Tech[]][] = [
  ['Languages', [['TypeScript', ['cp', 'lf', 'mb', 'oc']], ['JavaScript', ['ep', 're', 'dv']], ['Dart', ['mv']], ['PHP', ['oc']], ['Python', ['py', 'bn', 'bk']], ['SQL', ['cp', 'oc', 'lf', 'ep', 're', 'dv', 'py']]]],
  ['Frontend', [['React 18', ['cp', 'mb', 'dv']], ['Next.js', ['lf']], ['Vite', ['cp', 'mb', 'dv']], ['Tailwind CSS', ['lf', 'ep']], ['React Router', ['cp', 'mb']], ['RHF + Zod', ['cp', 'mb']], ['Radix UI', ['lf']], ['Motion · Lenis', ['lf', 'cp']], ['Pug SSR', ['ep']], ['Accessibility', ['cp', 'lf', 'oc']]]],
  ['Backend', [['Node.js + Express', ['cp', 'ep', 're', 'dv']], ['Clean Architecture', ['cp', 're']], ['Prisma', ['cp']], ['Sequelize', ['ep', 're']], ['JWT · bcrypt · Helmet', ['cp', 'ep', 're', 'lf']], ['Zod · Joi', ['cp', 'lf', 're']], ['FastAPI', ['bk']], ['REST APIs', WEB]]],
  ['Databases', [['PostgreSQL', ['cp', 're', 'lf', 'py']], ['MySQL', ['ep', 'dv', 'oc']], ['SQLite · Drift', ['lf', 'mv']], ['Firestore', ['mv']], ['Supabase', ['re', 'bk']]]],
  ['Testing & QA', [['Vitest', ['cp', 'oc']], ['Jest', ['ep']], ['PHPUnit · Hamcrest · PCOV', ['oc']], ['Testing Library', ['cp']], ['Cypress', ['cp', 'oc']], ['Playwright', ['cp', 'oc', 'lf']], ['Serenity/JS · Cucumber', ['cp', 'oc']], ['Katalon Studio', ['cp']], ['Test Agents · Stagehand', ['cp']], ['Argos', ['cp']], ['axe-core', ['cp']], ['Load testing', ['cp', 'oc']], ['unittest', ['py', 'bn']], ['Autify · Momentic · ReportPortal', ['cp'], 'Used by teammates — exposure, not mastery']]],
  ['Security', [['SonarQube', ['cp', 'oc']], ['Semgrep · OWASP ZAP', ['oc']], ['OWASP Top 10', ['oc']], ['npm / composer audit', ['oc']], ['Secrets management', ['oc', 'lf']]]],
  ['DevOps & cloud', [['Docker · Compose', ['cp', 'ep', 'dv', 'oc']], ['Jenkins', ['cp', 'oc', 'pc']], ['GitHub Actions', ['dv']], ['Kubernetes', ['ep', 'kn']], ['Vercel', ['cp']], ['Render', ['mb']], ['nginx', ['cp']], ['Git · GitHub', ALL]]],
  ['Mobile', [['Flutter', ['mv']]]],
  ['AI', [['Gemini API', ['lf']], ['AI in testing', ['cp']]]],
  ['Practices', [['Clean Arch · Repository · MVC', ['cp', 're', 'mv', 'lf', 'py', 'bn']], ['TDD · BDD · Screenplay', ['oc', 'cp']], ['Offline-first sync', ['mv']], ['CI/CD · Quality Gates', ['cp', 'oc']]]],
];

const BY_NAME = new Map<string, Tech>(GROUPS.flatMap((g) => g[1]).map((t) => [t[0], t]));

export default function Skills() {
  const [selName, setSelName] = useState('TypeScript');
  const sel = BY_NAME.get(selName) ?? BY_NAME.get('TypeScript')!;
  const [name, ids, note] = sel;

  return (
    <section className="sec" id="skills" aria-labelledby="sk-h">
      <div className="wrap">
        <div className="g12 sec-head">
          <p className="label s12">Evidence matrix</p>
          <RevealText as="h2" id="sk-h" className="disp-s t-h2 s7 t12">Skills, with receipts</RevealText>
          <p className="t-small s5 t12">No percentage bars. Pick a technology and the projects that prove it light up.</p>
        </div>
        <div className="skills">
          <div>
            {GROUPS.map(([gName, techs]) => (
              <div className="sk-group" key={gName}>
                <p className="label" style={{ paddingTop: 10 }}>{gName}</p>
                <ul className="row-list" style={{ gap: 8 }}>
                  {techs.map((t) => (
                    <li key={t[0]}>
                      <button type="button" className="sk-btn" aria-pressed={t[0] === name} onClick={() => setSelName(t[0])}>{t[0]}</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <aside className="sk-panel" aria-live="polite" aria-label="Projects that demonstrate the selected skill">
            <p className="label">Demonstrated in</p>
            <p className="disp-s" style={{ fontSize: 28, marginTop: 10 }}>{name}</p>
            <p className="meta" style={{ marginTop: 4 }}>{ids.length} of 13 projects</p>
            {note ? <p className="meta sk-note">{note}</p> : null}
            <ul className="sk-proj">
              {PROJECTS.map(([id, label]) => {
                const on = ids.includes(id);
                return (
                  <li key={id} className={on ? 'on' : undefined}>
                    <span>{label}</span>
                    {on ? (
                      <span className="ok">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="uses it"><path d="M3.5 8.5l3 3 6-7" /></svg>
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
