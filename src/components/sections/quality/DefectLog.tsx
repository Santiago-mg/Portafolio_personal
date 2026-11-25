'use client';

import { useState } from 'react';
import { DEFECTS } from './data';

export default function DefectLog() {
  const [open, setOpen] = useState<string | null>('d1');

  return (
    <div className="dlog">
      <div className="dlog-head">
        <span className="meta" style={{ color: 'var(--ink)' }}>
          opencart 4.1.0.3 · 6 of 37 shown
        </span>
        <a
          className="tag"
          href="https://github.com/Santiago-mg/opencart/blob/master/tests/DEFECTOS_CORREGIDOS.md"
          target="_blank"
          rel="noopener"
        >
          <span className="ul">All 37 on GitHub ↗</span>
        </a>
      </div>
      <div className="dlog-cols label" aria-hidden="true">
        <span>ID</span>
        <span>What happened</span>
        <span>Fix</span>
        <span>Status</span>
        <span></span>
      </div>
      <ul className="plain">
        {DEFECTS.map((d) => {
          const isOpen = open === d.key;
          return (
            <li key={d.key} className="def">
              <button
                type="button"
                className="def-btn"
                aria-expanded={isOpen}
                aria-controls={isOpen ? `def-more-${d.key}` : undefined}
                onClick={() => setOpen(isOpen ? null : d.key)}
              >
                <span className="def-id">{d.id}</span>
                <span className="def-sym">{d.sym}</span>
                <span className="def-fix">{d.fix}</span>
                <span className="def-st chk">fixed</span>
                <svg className="def-caret" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </button>
              {isOpen && (
                <div className="def-more reveal" id={`def-more-${d.key}`}>
                  <ol className="plain q-def-steps">
                    <li className="q-def-first">
                      <span className="xfade">
                        <span className="chk chk-fail xfade-a">FAIL</span>
                        <span className="chk xfade-b">FIXED</span>
                      </span>
                      {d.first}
                    </li>
                    <li aria-hidden="true">→</li>
                    <li>{d.mid}</li>
                    <li aria-hidden="true">→</li>
                    <li style={{ color: 'var(--pass-ink)' }}>{d.last}</li>
                  </ol>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
