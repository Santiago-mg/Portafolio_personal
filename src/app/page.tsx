import CodePortrait from '@/components/CodePortrait';

const STAGES = [
  ['typecheck', '0 errors'],
  ['unit', '415 passing'],
  ['e2e', '32 scenarios'],
  ['security', '37 defects fixed'],
  ['quality gate', 'passed'],
  ['deploy', 'shipped'],
];

const Check = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
);

export default function Home() {
  return (
    <div className="sg" data-theme="light" id="top">
      <main id="content">
        <section className="hero" aria-labelledby="hero-h">
          <div className="wrap">
            <div className="hero-top">
              <p className="label">Full-stack developer · QA automation · Medellín, CO</p>
            </div>

            <div className="pl" aria-hidden="true">
              <div className="pl-track"><div className="pl-fill" /></div>
              <ol className="pl-stages">
                {STAGES.map(([name, res]) => (
                  <li className="pl-st" key={name}>
                    <span className="pl-dot"><span className="pl-pend" /><span className="pl-ok"><Check /></span></span>
                    <span className="pl-txt"><span className="pl-name">{name}</span><span className="pl-res">{res}</span></span>
                  </li>
                ))}
              </ol>
            </div>
            <p className="sr">Quality summary: 415 unit tests, 32 end-to-end scenarios, 37 defects fixed, Quality Gate passed.</p>

            <div className="hero-grid with-photo">
              <div className="hero-main">
                <h1 id="hero-h" className="disp t-hero hero-h">I build<br />software<br />that passes.</h1>
                <p className="t-lead">
                  Full-stack developer — TypeScript · React · Node.js — who designs with Clean Architecture and proves every
                  feature with automated tests, from unit to E2E, security and accessibility. Systems Engineering student at
                  Universidad de Medellín.
                </p>
                <div className="hero-cta">
                  <a className="b b-1" href="#work">See my work <span className="go">→</span></a>
                  <a className="b b-t" href="https://github.com/Santiago-mg"><span className="ul">GitHub</span> <span className="go go-ne" aria-hidden="true">↗</span></a>
                </div>
                <p className="avail"><span className="dot" />Open to junior full-stack &amp; QA roles and internships</p>
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
                <CodePortrait
                  src="/santiago.webp"
                  alt="Santiago González, portrait"
                  hint="move the cursor to compile"
                  toggleOn="Show code version"
                  toggleOff="Show photo"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
