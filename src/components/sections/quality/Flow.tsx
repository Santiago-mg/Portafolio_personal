'use client';

import { useRef } from 'react';
import useStagger from './useStagger';

type Step = { label: string; sub: string[]; meta?: string; pass?: boolean };

const STEPS: Step[] = [
  { label: '01 · Backend job', sub: ['typecheck', 'tests + coverage', 'SonarQube Quality Gate', 'Docker image'] },
  { label: '02 · Frontend job', sub: ['tests', 'SonarQube', 'Docker image'] },
  { label: '03 · Docker', sub: ['database', 'API', 'front'], meta: 'up together' },
  { label: '04 · Cypress', sub: ['API suite', 'E2E suite'], meta: 'against the app in Docker' },
  { label: '05 · Deploy', sub: ['Vercel', 'Cypress vs. published'], meta: 'smoke after release', pass: true },
];

const DELAYS = [0, 60, 110, 170, 220, 280, 330, 390, 440];

export default function Flow() {
  const ref = useRef<HTMLOListElement>(null);
  useStagger(ref);
  let n = 0;
  return (
    <ol className="flow plain stg" aria-label="CelularPro pipeline" ref={ref}>
      {STEPS.flatMap((s, i) => {
        const items = [
          <li
            key={s.label}
            className="flow-step stg-i"
            style={{ '--d': `${DELAYS[n++]}ms`, ...(s.pass ? { borderColor: 'var(--pass)' } : {}) } as React.CSSProperties}
          >
            <span className="label">{s.label}</span>
            <ul className="flow-sub">
              {s.sub.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            {s.meta && <span className="meta">{s.meta}</span>}
          </li>,
        ];
        if (i < STEPS.length - 1) {
          items.push(
            <li key={`a${i}`} className="flow-arrow stg-i" aria-hidden="true" style={{ '--d': `${DELAYS[n++]}ms` } as React.CSSProperties}>
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </li>,
          );
        }
        return items;
      })}
    </ol>
  );
}
