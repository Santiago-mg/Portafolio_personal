'use client';

import { useEffect, useRef, useState } from 'react';
import { useSite } from '@/components/site/SiteProvider';
import { PROJECTS } from '@/content/projects';
import { SITE } from '@/content/site';

/** Locks page scroll while an overlay is open, compensating the scrollbar so nothing shifts. */
export function lockScroll(): () => void {
  const html = document.documentElement;
  const prevOverflow = html.style.overflow;
  const prevPad = html.style.paddingRight;
  const bar = window.innerWidth - html.clientWidth;
  html.style.overflow = 'hidden';
  if (bar > 0) html.style.paddingRight = `${bar}px`;
  return () => {
    html.style.overflow = prevOverflow;
    html.style.paddingRight = prevPad;
  };
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keeps Tab / Shift+Tab inside `root`. */
export function trapTab(e: React.KeyboardEvent, root: HTMLElement | null) {
  if (e.key !== 'Tab' || !root) return;
  const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
  if (!items.length) {
    e.preventDefault();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && (active === first || !root.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (active === last || !root.contains(active))) {
    e.preventDefault();
    first.focus();
  }
}

/** Smooth-scrolls to a section and moves focus there (for keyboard and screen-reader users). */
export function goToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView();
  try { history.replaceState(null, '', `#${id}`); } catch {}
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

type Cmd = {
  id: string;
  group: string;
  label: string;
  icon: string;
  hint?: string;
  /** stay open after running (theme, language, copy) */
  keep?: boolean;
  /** navigation moves focus to the target, so the trigger must not take it back */
  run: () => void;
  moves?: boolean;
};

export default function CommandPalette({ onClose }: { onClose: (restoreFocus?: boolean) => void }) {
  const { theme, lang, setTheme, setLang } = useSite();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const [toast, setToast] = useState<{ msg: string; n: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevFocus = useRef<Element | null>(null);
  const restore = useRef(true);

  // Focus in, lock scroll; on unmount give focus back to whatever opened the palette.
  useEffect(() => {
    prevFocus.current = document.activeElement;
    inputRef.current?.focus();
    const unlock = lockScroll();
    return () => {
      unlock();
      const el = prevFocus.current;
      if (restore.current && el instanceof HTMLElement) el.focus();
    };
  }, []);

  const flash = (msg: string) => setToast((t) => ({ msg, n: (t?.n ?? 0) + 1 }));
  const toastN = toast?.n;
  useEffect(() => {
    if (!toastN) return;
    const id = window.setTimeout(() => setToast((t) => (t && t.n === toastN ? { ...t, msg: '' } : t)), 1600);
    return () => window.clearTimeout(id);
  }, [toastN]);
  const toastOn = !!toast?.msg;

  const sections: [string, string, string?][] = [
    ['work', 'Go to Work', '01'],
    ['quality', 'Go to Quality', '02'],
    ['ship', 'Go to Ship'],
    ['skills', 'Go to Skills'],
    ['log', 'Go to Changelog'],
    ['about', 'Go to About'],
    ['contact', 'Go to Contact', '05'],
  ];

  const all: Cmd[] = [
    ...sections.map(([id, label, hint]): Cmd => ({
      id: `go-${id}`, group: 'Navigate', label, icon: '#', hint, moves: true, run: () => requestAnimationFrame(() => goToSection(id)),
    })),
    ...PROJECTS.filter((p) => p.links.length > 0).map((p): Cmd => ({
      id: `open-${p.id}`, group: 'Projects', label: `Open ${p.name}`, icon: '→', hint: p.links[0].label.toLowerCase(),
      run: () => { window.open(p.links[0].href, '_blank', 'noopener,noreferrer'); },
    })),
    ...(SITE.email ? [{
      id: 'copy-email', group: 'Actions', label: 'Copy email', icon: '@', keep: true,
      run: () => {
        navigator.clipboard.writeText(SITE.email).then(() => flash('Copied ✓'), () => flash('Copy failed'));
      },
    } as Cmd] : []),
    {
      id: 'th-contrast', group: 'Actions', label: 'Theme: high contrast', icon: '◐', hint: theme === 'contrast' ? 'on' : 'off', keep: true,
      run: () => setTheme(theme === 'contrast' ? 'dark' : 'contrast'),
    },
    { id: 'lang', group: 'Actions', label: lang === 'es' ? 'Language: English' : 'Idioma: español', icon: 'Aa', keep: true, run: () => setLang(lang === 'es' ? 'en' : 'es') },
    ...(SITE.github ? [{
      id: 'github', group: 'Actions', label: 'Open GitHub', icon: '↗', hint: SITE.github.split('/').filter(Boolean).pop(),
      run: () => { window.open(SITE.github, '_blank', 'noopener,noreferrer'); },
    } as Cmd] : []),
  ];

  const needle = q.trim().toLowerCase();
  const flat = all.filter((c) => !needle || c.label.toLowerCase().includes(needle) || c.group.toLowerCase().includes(needle));
  const groups: { name: string; items: { cmd: Cmd; idx: number }[] }[] = [];
  flat.forEach((cmd, idx) => {
    let g = groups.find((x) => x.name === cmd.group);
    if (!g) groups.push((g = { name: cmd.group, items: [] }));
    g.items.push({ cmd, idx });
  });

  const max = flat.length - 1;
  const cur = Math.max(0, Math.min(sel, max));
  const activeId = flat.length ? `cmd-opt-${cur}` : undefined;

  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }, [activeId]);

  const run = (cmd: Cmd) => {
    if (cmd.keep) {
      cmd.run();
      return;
    }
    if (cmd.moves) restore.current = false;
    onClose(!cmd.moves);
    cmd.run();
  };

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(Math.min(cur + 1, max)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(Math.max(cur - 1, 0)); }
    else if (e.key === 'Home' && e.ctrlKey) { e.preventDefault(); setSel(0); }
    else if (e.key === 'End' && e.ctrlKey) { e.preventDefault(); setSel(max); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (flat[cur]) run(flat[cur]);
    }
  };

  const onRootKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose(true);
      return;
    }
    trapTab(e, rootRef.current);
  };

  return (
    <div className="cp-root" ref={rootRef} onKeyDown={onRootKey}>
      <div className="scrim" onMouseDown={() => onClose(true)} aria-hidden="true" />
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="cp-field">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" className="cp-ico"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg>
          <input
            ref={inputRef}
            className="cmd-in"
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={flat.length ? 'cmd-list' : undefined}
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            aria-label="Type a command or search"
            placeholder="Type a command or search…"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={q}
            onChange={(e) => { setQ(e.target.value); setSel(0); }}
            onKeyDown={onInputKey}
          />
          <span className="kbd cp-esc" aria-hidden="true">esc</span>
        </div>
        {flat.length > 0 ? (
          <div id="cmd-list" role="listbox" aria-label="Commands" className="cp-list">
            {groups.map((g) => (
              <div key={g.name} role="group" aria-label={g.name} className="cp-group">
                <p className="label cp-glabel" aria-hidden="true">{g.name}</p>
                {g.items.map(({ cmd, idx }) => (
                  <button
                    key={cmd.id}
                    type="button"
                    tabIndex={-1}
                    className="cmd-item"
                    id={`cmd-opt-${idx}`}
                    role="option"
                    aria-selected={idx === cur}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseMove={() => { if (idx !== cur) setSel(idx); }}
                    onClick={() => run(cmd)}
                  >
                    <span className="cp-oi" aria-hidden="true">{cmd.icon}</span>
                    {cmd.label}
                    {cmd.hint ? <span className="hint">{cmd.hint}</span> : null}
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="t-small cp-empty" role="status">No results for “{q}”.</p>
        )}
        <div className="cp-foot">
          <span className="meta cp-keys" aria-hidden="true">
            <span><span className="kbd">↑</span> <span className="kbd">↓</span> move</span>
            <span><span className="kbd">↵</span> open</span>
            <span><span className="kbd">esc</span> close</span>
          </span>
          <span className="toast cp-toast" data-show={toastOn} aria-hidden="true">{toast?.msg}</span>
          <span className="sr" role="status">{toast?.msg ?? ''}</span>
        </div>
      </div>
    </div>
  );
}
