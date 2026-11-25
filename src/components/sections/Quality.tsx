import RevealText from '@/components/fx/RevealText';
import DrawStroke from '@/components/fx/DrawStroke';
import Pyramid from './quality/Pyramid';
import DefectLog from './quality/DefectLog';
import { TECHNIQUES } from './quality/data';

const AI_ROWS: [string, string][] = [
  ['Playwright Test Agents', 'Three agents — Planner, Generator and Healer — that plan, write and repair E2E tests.'],
  [
    'Stagehand',
    '12 E2E tests where AI locates and operates the controls with OpenAI, Gemini or local Ollama — and a plain assertion decides pass or fail.',
  ],
  ['Katalon StudioAssist', 'The AI assistant built into Katalon Studio.'],
  ['Argos', 'Visual regression that compares snapshots between versions.'],
];

export default function Quality() {
  return (
    <section className="sec" id="quality" aria-labelledby="q-h">
      <div className="wrap">
        <div className="g12 sec-head">
          <p className="label s12">02 — Test</p>
          <RevealText as="h2" id="q-h" className="disp-s t-h2 s7 t12">
            How I prove it works
          </RevealText>
          <p className="t-small s5 t12">
            Every layer gets its own kind of test, and the pipeline runs all of them. Pick a level to see the tools, the real numbers and a representative snippet.
          </p>
        </div>

        <Pyramid />

        <div className="g12 q-tech">
          <p className="label s3 t12" style={{ paddingTop: 6 }}>
            Techniques, not just tools
          </p>
          <ul className="row-list s9 t12" style={{ gap: 8 }}>
            {TECHNIQUES.map((t) => (
              <li key={t} className="chip">
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="panel g12 q-ai">
          <div className="s5 t12 q-ai-lead">
            <p className="label">AI applied to testing</p>
            <p className="disp-s q-ai-quote">
              The AI finds the controls. A deterministic assertion decides the result —{' '}
              <span className="stroke-host">
                never the model.
                <DrawStroke variant="underline" color="ink" delay={300} />
              </span>
            </p>
            <p className="t-small">Practised on my own CelularPro features.</p>
          </div>
          <ul className="plain s7 t12 q-ai-list">
            {AI_ROWS.map(([name, text]) => (
              <li key={name} className="kv q-ai-row">
                <span style={{ fontWeight: 600 }}>{name}</span>
                <span className="t-small">{text}</span>
              </li>
            ))}
            <li className="kv q-ai-row q-ai-row-last">
              <span className="label" style={{ paddingTop: 3 }}>
                Used by the team
              </span>
              <span className="t-small">
                Autify Nexus (18 scenarios) · Momentic (9 tests) · ReportPortal, which gathers 6 suites and triages failures with machine learning.
              </span>
            </li>
          </ul>
        </div>

        <div style={{ marginTop: 72 }}>
          <div className="g12" style={{ marginBottom: 24, alignItems: 'end' }}>
            <div className="s7 t12" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p className="label">Defect log</p>
              <RevealText as="h3" className="disp-s t-h3">
                Real bugs, found by tests, fixed in OpenCart&apos;s code
              </RevealText>
            </div>
            <p className="t-small s5 t12">Each one was written first as a failing test, then fixed. Open a row to watch it go from red to green.</p>
          </div>
          <DefectLog />
          <p className="t-small" style={{ marginTop: 20, maxWidth: '80ch' }}>
            37 defects documented first as failing tests (TDD) and fixed in OpenCart&apos;s code. Vitest now passes{' '}
            <span className="mono" style={{ color: 'var(--pass-ink)' }}>347/347</span>, PHPUnit{' '}
            <span className="mono" style={{ color: 'var(--pass-ink)' }}>110/110</span> and{' '}
            <span className="mono" style={{ color: 'var(--pass-ink)' }}>77/77</span>.
          </p>
        </div>
      </div>
    </section>
  );
}
