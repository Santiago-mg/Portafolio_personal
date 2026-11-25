'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSite } from '@/components/site/SiteProvider';
import CommandPalette from '@/components/site/CommandPalette';
import MobileMenu from '@/components/site/MobileMenu';

const LINKS = {
  en: [['work', 'Work'], ['quality', 'Quality'], ['skills', 'Skills'], ['about', 'About'], ['contact', 'Contact']],
  es: [['work', 'Proyectos'], ['quality', 'Calidad'], ['skills', 'Habilidades'], ['about', 'Sobre mí'], ['contact', 'Contacto']],
} as const;

const TRACKED = ['work', 'quality', 'skills', 'about', 'contact'];

export default function Nav() {
  const { theme, lang, setTheme, setLang } = useSite();
  const es = lang === 'es';
  const [active, setActive] = useState<string | null>(null);
  const [palette, setPalette] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(false);

  useEffect(() => { menuRef.current = menu; }, [menu]);

  // Highlight the section that crosses the reading line.
  useEffect(() => {
    const els = TRACKED.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!els.length || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          const id = en.target.id;
          if (en.isIntersecting) setActive(id);
          else setActive((cur) => (cur === id ? null : cur));
        }
      },
      { rootMargin: '-45% 0px -54% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // ⌘K / Ctrl+K toggles the command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (menuRef.current) return;
        setPalette((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const closePalette = useCallback(() => setPalette(false), []);
  const closeMenu = useCallback(() => setMenu(false), []);

  return (
    <>
      <header className="nav">
        <div className="wrap nav-in">
          <a className="logo" href="#top" aria-label={es ? 'Santiago González, volver arriba' : 'Santiago González, back to top'}>
            <span className="logo-mark">SG</span><span className="logo-name">Santiago González</span>
          </a>
          <nav className="nav-links" aria-label={es ? 'Principal' : 'Primary'} lang={lang}>
            {LINKS[lang].map(([id, label]) => (
              <a key={id} href={`#${id}`} className={active === id ? 'on' : undefined} aria-current={active === id ? 'true' : undefined}>
                <span className="ul">{label}</span>
              </a>
            ))}
          </nav>
          <div className="nav-tools">
            <div className="seg hide-m" role="group" aria-label={es ? 'Idioma' : 'Language'}>
              <button type="button" aria-pressed={!es} onClick={() => setLang('en')} lang="en">EN</button>
              <button type="button" aria-pressed={es} onClick={() => setLang('es')} lang="es">ES</button>
            </div>
            <div className="seg hide-m" role="group" aria-label={es ? 'Tema' : 'Theme'}>
              <button type="button" aria-label={es ? 'Tema claro' : 'Light theme'} aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="8" cy="8" r="2.75" /><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.06 1.06M11.54 11.54l1.06 1.06M3.4 12.6l1.06-1.06M11.54 4.46l1.06-1.06" /></svg>
              </button>
              <button type="button" aria-label={es ? 'Tema oscuro' : 'Dark theme'} aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true"><path d="M13.2 9.6A5.5 5.5 0 0 1 6.4 2.8a5.5 5.5 0 1 0 6.8 6.8z" /></svg>
              </button>
              <button type="button" aria-label={es ? 'Tema de alto contraste' : 'High-contrast theme'} aria-pressed={theme === 'contrast'} onClick={() => setTheme('contrast')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="8" cy="8" r="5.75" /><path d="M8 2.25A5.75 5.75 0 0 1 8 13.75Z" fill="currentColor" stroke="none" /></svg>
              </button>
            </div>
            <button
              type="button"
              className="b b-2 hide-m nav-k"
              aria-label={es ? 'Abrir paleta de comandos' : 'Open command palette'}
              aria-haspopup="dialog"
              aria-expanded={palette}
              aria-keyshortcuts="Meta+K Control+K"
              onClick={() => setPalette(true)}
            >
              ⌘K
            </button>
            <a className="b b-1" href="#contact" lang={lang}>{es ? 'Contrátame' : 'Hire me'}</a>
            <button
              type="button"
              className="b b-2 b-icon nav-menu"
              aria-label={es ? 'Abrir menú' : 'Open menu'}
              aria-haspopup="dialog"
              aria-expanded={menu}
              aria-controls={menu ? 'mobile-menu' : undefined}
              onClick={() => setMenu(true)}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" /></svg>
            </button>
          </div>
        </div>
      </header>
      {palette && <CommandPalette onClose={closePalette} />}
      {menu && <MobileMenu onClose={closeMenu} />}
    </>
  );
}
