'use client';

import { useSyncExternalStore } from 'react';

function subscribe(cb: () => void) {
  const id = window.setInterval(cb, 30000);
  return () => window.clearInterval(id);
}
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: false });
const clientTime = () => fmt.format(new Date());
const serverTime = () => '--:--';

export default function StatusFooter() {
  // "--:--" on the server and during hydration; real Medellín time afterwards.
  const clock = useSyncExternalStore(subscribe, clientTime, serverTime);
  return (
    <footer className="status" aria-label="Site status">
      <div className="wrap status-in">
        <div className="status-l">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span className="dot" style={{ width: 7, height: 7, boxShadow: 'none' }} />build 2026.11 · all checks passed</span>
          <span className="sep" aria-hidden="true">·</span>
          <span>Medellín <time>{clock}</time> (UTC−5)</span>
          <span className="sep" aria-hidden="true">·</span>
          <span>© 2026 Santiago González</span>
        </div>
        <div className="status-l">
          <a className="tag st-link" href="https://github.com/Santiago-mg/Portafolio_personal" target="_blank" rel="noopener noreferrer"><span className="ul">Source on GitHub</span> ↗</a>
        </div>
      </div>
    </footer>
  );
}
