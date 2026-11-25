'use client';

import { useState } from 'react';
import { LEVELS } from './data';
import hl from './hl';

export default function Pyramid() {
  const [lvl, setLvl] = useState('unit');
  const cur = LEVELS.find((l) => l.key === lvl) ?? LEVELS[0];

  return (
    <div className="pyr">
      <div>
        <p className="label" style={{ marginBottom: 16 }}>
          Test pyramid · bottom to top
        </p>
        <ol className="pyr-levels" aria-label="Test levels">
          {LEVELS.map((l) => (
            <li key={l.key} className="q-lvl-li">
              <button
                type="button"
                className="lvl"
                style={{ width: `${l.width}%` }}
                aria-expanded={lvl === l.key}
                aria-controls="pyr-panel"
                onClick={() => setLvl(l.key)}
              >
                <span>{l.button}</span>
                <span className="meta">{l.meta}</span>
              </button>
            </li>
          ))}
        </ol>
        <p className="meta" style={{ marginTop: 16 }}>
          Counts are from team projects; the case studies say who wrote what.
        </p>
      </div>

      <div id="pyr-panel" aria-live="polite" className="q-panel-wrap">
        <div key={cur.key} className="panel reveal q-panel">
          <div className="q-panel-head">
            <h3 className="disp-s t-h4" style={{ fontSize: 24 }}>
              {cur.title}
            </h3>
            <span className="chk">{cur.chk}</span>
          </div>
          <ul className="row-list" aria-label="Tools">
            {cur.tools.map((t) => (
              <li key={t} className="chip">
                {t}
              </li>
            ))}
          </ul>
          <ul className="t-small q-bullets">
            {cur.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <div>
            <div className="code-cap">
              <span className="label">{cur.cap}</span>
            </div>
            <pre className="code" tabIndex={0} aria-label={`Code snippet: ${cur.cap}`}>
              {hl(cur.code)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
