'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type Theme = 'light' | 'dark' | 'contrast';
export type Lang = 'en' | 'es';

type Site = {
  theme: Theme;
  lang: Lang;
  setTheme: (t: Theme) => void;
  setLang: (l: Lang) => void;
  /** false while the preloader covers the page; narrative animations wait for it. */
  booted: boolean;
  finishBoot: () => void;
};

const Ctx = createContext<Site | null>(null);

export function useSite(): Site {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSite must be used inside <SiteProvider>');
  return v;
}

/** Root of the page: owns theme, language and boot state, and renders the `.sg` wrapper. */
export default function SiteProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [lang, setLangState] = useState<Lang>('en');
  const [booted, setBooted] = useState(false);
  const [theming, setTheming] = useState(false);
  const t = useRef<number | undefined>(undefined);

  /* eslint-disable react-hooks/set-state-in-effect -- persisted prefs exist only in the browser; read them after hydration to avoid a mismatch */
  useEffect(() => {
    try {
      const th = localStorage.getItem('sg-theme') as Theme | null;
      const lg = localStorage.getItem('sg-lang') as Lang | null;
      if (th === 'light' || th === 'dark' || th === 'contrast') setThemeState(th);
      if (lg === 'en' || lg === 'es') setLangState(lg);
      else if (navigator.language?.toLowerCase().startsWith('es')) setLangState('es');
    } catch {}
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setTheme = useCallback((next: Theme) => {
    // Colours change together, and only while switching (never on first load).
    setTheming(true);
    window.clearTimeout(t.current);
    t.current = window.setTimeout(() => setTheming(false), 260);
    setThemeState(next);
    try { localStorage.setItem('sg-theme', next); } catch {}
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try { localStorage.setItem('sg-lang', next); } catch {}
  }, []);

  const finishBoot = useCallback(() => setBooted(true), []);

  return (
    <Ctx.Provider value={{ theme, lang, setTheme, setLang, booted, finishBoot }}>
      <div className={`sg${theming ? ' theming' : ''}`} data-theme={theme} data-boot={booted ? undefined : '1'} id="top">
        {children}
      </div>
    </Ctx.Provider>
  );
}
