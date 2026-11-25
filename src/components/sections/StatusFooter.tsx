'use client';

import { useSyncExternalStore } from 'react';
import { useSite, type Lang } from '@/components/site/SiteProvider';
import ArrowNE from './process/ArrowNE';
import { SITE } from '@/content/site';

const SOURCE = 'https://github.com/Santiago-mg/Portafolio_personal';

const COPY: Record<Lang, {
  sections: string; elsewhere: string; contact: string;
  links: [string, string][];
  talk: string; cv: string; newTab: string;
  status: string; source: string;
}> = {
  en: {
    sections: 'Sections', elsewhere: 'Elsewhere', contact: 'Contact',
    links: [['#work', 'Work'], ['#quality', 'Quality'], ['#skills', 'Skills'], ['#about', 'About']],
    talk: 'Talk on GitHub', cv: 'CV', newTab: ' (opens in a new tab)',
    status: 'build 2026.11 · all checks passed', source: 'Source on GitHub',
  },
  es: {
    sections: 'Secciones', elsewhere: 'En otros sitios', contact: 'Contacto',
    links: [['#work', 'Proyectos'], ['#quality', 'Calidad'], ['#skills', 'Habilidades'], ['#about', 'Sobre mí']],
    talk: 'Hablemos en GitHub', cv: 'Hoja de vida', newTab: ' (se abre en una pestaña nueva)',
    status: 'build 2026.11 · todas las verificaciones aprobadas', source: 'Código en GitHub',
  },
};

/* ---- Medellín clock: "--:--" on the server and during hydration, live afterwards ---- */
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
function subscribe(cb: () => void) {
  let t = 0;
  // Tick on the minute boundary, and catch up when the tab becomes visible again.
  const arm = () => {
    t = window.setTimeout(() => {
      cb();
      arm();
    }, 60_000 - (Date.now() % 60_000) + 40);
  };
  const onVis = () => {
    if (document.visibilityState === 'visible') cb();
  };
  arm();
  document.addEventListener('visibilitychange', onVis);
  return () => {
    window.clearTimeout(t);
    document.removeEventListener('visibilitychange', onVis);
  };
}
const clientTime = () => fmt.format(new Date());
const serverTime = () => '--:--';

function Out({ href, children, newTab }: { href: string; children: React.ReactNode; newTab: string }) {
  return (
    <a className="ft-a" href={href} target="_blank" rel="noopener noreferrer">
      <span className="ul">{children}</span>
      <ArrowNE />
      <span className="sr">{newTab}</span>
    </a>
  );
}

/** Grounded footer: identity, three link groups and the build's status line. */
export default function StatusFooter() {
  const { lang } = useSite();
  const t = COPY[lang];
  const clock = useSyncExternalStore(subscribe, clientTime, serverTime);
  const ready = clock !== '--:--';

  return (
    <footer className="ft" lang={lang}>
      <div className="ft-in">
        <div className="ft-top">
          <p className="ft-id">
            <span>Santiago</span> <span>González</span>
          </p>

          <nav className="ft-col ft-c1" aria-labelledby="ft-h1">
            <h2 id="ft-h1" className="ft-hd">{t.sections}</h2>
            <ul>
              {t.links.map(([href, label]) => (
                <li key={href}>
                  <a className="ft-a" href={href}>
                    <span className="ul">{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ft-col ft-c2">
            <h2 className="ft-hd">{t.elsewhere}</h2>
            <ul>
              <li><Out href={SITE.github} newTab={t.newTab}>GitHub</Out></li>
              {SITE.linkedin ? <li><Out href={SITE.linkedin} newTab={t.newTab}>LinkedIn</Out></li> : null}
              {SITE.cv ? (
                <li>
                  <a className="ft-a" href={SITE.cv} download>
                    <span className="ul">{t.cv}</span>
                    <svg className="arrow-ne" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" focusable="false">
                      <path d="M5 1v7.5M1.75 5.5 5 8.75 8.25 5.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="square" />
                    </svg>
                  </a>
                </li>
              ) : null}
            </ul>
          </div>

          <div className="ft-col ft-c3">
            <h2 className="ft-hd">{t.contact}</h2>
            <ul>
              <li>
                {SITE.email ? (
                  <a className="ft-a ft-mail" href={`mailto:${SITE.email}`}>
                    <span className="ul">{SITE.email}</span>
                  </a>
                ) : (
                  <Out href={SITE.github} newTab={t.newTab}>{t.talk}</Out>
                )}
              </li>
            </ul>
          </div>
        </div>

        <div className="ft-row">
          <p className="ft-st">
            <span className="dot" aria-hidden="true" />
            {t.status}
          </p>
          <p className="ft-clock">
            Medellín <time dateTime={ready ? clock : undefined}>{clock}</time> (UTC−5)
          </p>
          <p>
            <Out href={SOURCE} newTab={t.newTab}>{t.source}</Out>
          </p>
          <p className="ft-c">© 2026</p>
        </div>
      </div>
    </footer>
  );
}
