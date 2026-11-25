'use client';

import { useEffect, useRef } from 'react';
import { useSite } from '@/components/site/SiteProvider';
import { lockScroll, trapTab } from '@/components/site/CommandPalette';

const COPY = {
  en: {
    label: 'Menu', primary: 'Primary', home: 'Santiago González, back to top', close: 'Close menu',
    links: [['work', 'Work'], ['quality', 'Quality'], ['skills', 'Skills'], ['about', 'About'], ['contact', 'Contact']],
    language: 'Language', theme: 'Theme', light: 'Light', dark: 'Dark', hc: 'HC', hcLabel: 'High contrast',
    hire: 'Hire me', avail: 'Open to junior full-stack & QA roles and internships',
  },
  es: {
    label: 'Menú', primary: 'Principal', home: 'Santiago González, inicio', close: 'Cerrar menú',
    links: [['work', 'Proyectos'], ['quality', 'Calidad'], ['skills', 'Habilidades'], ['about', 'Sobre mí'], ['contact', 'Contacto']],
    language: 'Idioma', theme: 'Tema', light: 'Claro', dark: 'Oscuro', hc: 'AC', hcLabel: 'Alto contraste',
    hire: 'Contrátame', avail: 'Disponible para roles junior full-stack, QA y prácticas',
  },
} as const;

export default function MobileMenu({ onClose }: { onClose: (restoreFocus?: boolean) => void }) {
  const { theme, lang, setTheme, setLang } = useSite();
  const t = COPY[lang];
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const prevFocus = useRef<Element | null>(null);
  const restore = useRef(true);

  useEffect(() => {
    prevFocus.current = document.activeElement;
    closeRef.current?.focus();
    const unlock = lockScroll();
    // The menu button disappears above 1100px; close with it.
    const mq = window.matchMedia('(min-width: 1101px)');
    const onMq = () => { if (mq.matches) onClose(false); };
    mq.addEventListener('change', onMq);
    return () => {
      unlock();
      mq.removeEventListener('change', onMq);
      const el = prevFocus.current;
      if (restore.current && el instanceof HTMLElement) el.focus();
    };
  }, [onClose]);

  const leave = () => {
    restore.current = false;
    onClose(false);
  };

  return (
    <div
      className="mm-root"
      id="mobile-menu"
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={t.label}
      lang={lang}
      onKeyDown={(e) => {
        if (e.key === 'Escape') { e.preventDefault(); onClose(true); return; }
        trapTab(e, rootRef.current);
      }}
    >
      <div className="mm-head">
        <a className="logo" href="#top" aria-label={t.home} onClick={leave}><span className="logo-mark">SG</span><span className="logo-name">Santiago González</span></a>
        <button ref={closeRef} type="button" className="b b-2 b-icon" aria-label={t.close} onClick={() => onClose(true)}>
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
        </button>
      </div>

      <nav className="mm-nav" aria-label={t.primary}>
        <ol className="plain mm-links">
          {t.links.map(([id, label], i) => (
            <li key={id} style={{ animationDelay: `${[0, 50, 90, 120, 140][i]}ms` }}>
              <a href={`#${id}`} onClick={leave}><span className="meta" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span><span className="disp-s mm-link-t">{label}</span></a>
            </li>
          ))}
        </ol>

        <div className="mm-ctl">
          <div className="mm-row">
            <span className="label" aria-hidden="true">{t.language}</span>
            <div className="seg" role="group" aria-label={t.language}>
              <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')} lang="en">EN</button>
              <button type="button" aria-pressed={lang === 'es'} onClick={() => setLang('es')} lang="es">ES</button>
            </div>
          </div>
          <div className="mm-row">
            <span className="label" aria-hidden="true">{t.theme}</span>
            <div className="seg" role="group" aria-label={t.theme}>
              <button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>{t.light}</button>
              <button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>{t.dark}</button>
              <button type="button" aria-pressed={theme === 'contrast'} aria-label={t.hcLabel} onClick={() => setTheme('contrast')}>{t.hc}</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="mm-cta">
        <a className="b b-1 mm-hire" href="#contact" onClick={leave}>{t.hire}</a>
        <p className="avail mm-avail"><span className="dot" />{t.avail}</p>
      </div>
      <div className="status mm-status">
        <p className="mono"><span className="dot" />build 2026.11 · all checks passed</p>
      </div>
    </div>
  );
}
