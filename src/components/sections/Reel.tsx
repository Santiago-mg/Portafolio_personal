'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSite } from '@/components/site/SiteProvider';
import RevealText from '@/components/fx/RevealText';
import ProjectPoster from '@/components/ProjectPoster';
import CircularGallery, { type GalleryItem } from '@/components/gallery/CircularGallery';
import { POSTER_RADIUS, POSTER_SIZE, projectPosters } from '@/components/gallery/posterImages';
import { useThemeTokens, useWebGL2 } from '@/components/gallery/hooks';
import { PROJECTS } from '@/content/projects';

const N = PROJECTS.length;
const pad = (n: number) => String(n).padStart(2, '0');

const T = {
  en: {
    title: 'Everything I’ve shipped',
    text: `Drag or swipe through all ${N} projects.`,
    aria: 'Project reel',
    newTab: ' (opens in a new tab)',
    onGitHub: 'on GitHub',
    priv: 'Private repo',
    hint: 'drag · shift + scroll',
  },
  es: {
    title: 'Todo lo que he entregado',
    text: `Arrastra o desliza para recorrer los ${N} proyectos.`,
    aria: 'Carrusel de proyectos',
    newTab: ' (se abre en una pestaña nueva)',
    onGitHub: 'en GitHub',
    priv: 'Repo privado',
    hint: 'arrastra · shift + rueda',
  },
};

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <rect x="3" y="7" width="10" height="7" rx="1.5" />
    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
  </svg>
);

/**
 * "Reel": every project on a draggable arc (WebGL). Without WebGL (or without JS) the same
 * posters are a plain, keyboard-reachable horizontal list of links.
 */
export default function Reel() {
  const { lang, booted } = useSite();
  const t = T[lang];
  const gl = useWebGL2();
  const tokens = useThemeTokens();
  const stageRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [posters, setPosters] = useState<string[] | null>(null);
  const [active, setActive] = useState(0);

  // Mount WebGL only when the stage is within one viewport.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || gl !== 'yes') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          setNear(true);
        }
      },
      { rootMargin: '100% 0px 100% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [gl]);

  // Draw the posters when idle after boot, or right away once near.
  useEffect(() => {
    if (gl !== 'yes' || (!booted && !near)) return;
    let alive = true;
    const start = () => {
      projectPosters('landscape').then(
        (urls) => {
          if (alive) setPosters(urls);
        },
        () => {},
      );
    };
    let idle = 0;
    let timer = 0;
    if (near) start();
    else if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(start, { timeout: 4000 });
    else timer = window.setTimeout(start, 1600);
    return () => {
      alive = false;
      if (idle) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, [gl, booted, near]);

  const items = useMemo<GalleryItem[] | null>(
    () =>
      posters?.map((image, i) => {
        const p = PROJECTS[i];
        const first = p.links[0];
        return {
          image,
          text: p.name,
          href: first?.href,
          label: first ? `${p.name} — ${first.label.toLowerCase()} ${t.onGitHub}${t.newTab}` : `${p.name} — ${t.priv.toLowerCase()}`,
        };
      }) ?? null,
    [posters, t],
  );

  const onItemClick = useCallback((item: GalleryItem) => {
    if (item.href) window.open(item.href, '_blank', 'noopener');
  }, []);

  const font = tokens ? `700 semi-expanded 30px ${tokens.disp}` : undefined;
  const ready = gl === 'yes' && near && items && tokens;
  const p = PROJECTS[active] ?? PROJECTS[0];
  const link = p.links[0];
  const { width: PW, height: PH } = POSTER_SIZE.landscape;

  return (
    <section className="sec fx-reel" id="reel" aria-labelledby="reel-h">
      <div className="wrap">
        <div className="g12 sec-head">
          <p className="label s12">Reel</p>
          <RevealText as="h2" id="reel-h" className="disp-s t-h2 s7 t12">
            {t.title}
          </RevealText>
          <p className="t-small s5 t12">{t.text}</p>
        </div>
      </div>

      {gl === 'yes' ? (
        <>
          <div className="fx-reel-stage" ref={stageRef}>
            {ready ? (
              <CircularGallery
                items={items}
                aria-label={t.aria}
                bend={3}
                itemAspect={PW / PH}
                itemSize={0.78}
                gap={0.22}
                borderRadius={(POSTER_RADIUS * PW) / PH}
                textColor={tokens.ink}
                ringColor={tokens.focus}
                placeholderColor={tokens.muted}
                font={font}
                labelRange={[14, 20]}
                scrollSpeed={2}
                scrollEase={0.06}
                wave={0.6}
                fadeEdges={0.1}
                shadow={0.2}
                snap
                autoScroll={0}
                openOnClick={false}
                intro
                onItemClick={onItemClick}
                onActiveChange={setActive}
              />
            ) : null}
          </div>
          <div className={`wrap fx-reel-foot${ready ? ' is-ready' : ''}`} aria-hidden={ready ? undefined : true}>
            <p className="meta fx-reel-now">
              <span className="num">
                {pad(active + 1)} / {pad(N)}
              </span>
              <span className="fx-reel-name">{p.name}</span>
              <span className="hide-m">{p.year}</span>
            </p>
            {link ? (
              <a className="tag" href={link.href} target="_blank" rel="noopener" tabIndex={ready ? undefined : -1}>
                <span className="ul">{link.label}</span> <span aria-hidden="true">↗</span>
                <span className="sr">
                  {' '}
                  — {p.name}
                  {t.newTab}
                </span>
              </a>
            ) : (
              <span className="tag tag-muted">
                <LockIcon />
                {t.priv}
              </span>
            )}
            <span className="meta fx-reel-hint" aria-hidden="true">
              {t.hint}
            </span>
          </div>
        </>
      ) : (
        <ul className="fx-reel-strip" aria-label={t.aria}>
          {PROJECTS.map((proj, i) => {
            const first = proj.links[0];
            return (
              <li key={proj.id} className="fx-reel-item">
                {first ? (
                  <a href={first.href} target="_blank" rel="noopener" className="fx-reel-card">
                    <ProjectPoster project={proj} index={i + 1} tone="dark" />
                    <span className="sr">
                      {proj.name} — {first.label.toLowerCase()} {t.onGitHub}
                      {t.newTab}
                    </span>
                  </a>
                ) : (
                  <div className="fx-reel-card">
                    <ProjectPoster project={proj} index={i + 1} tone="dark" />
                    <span className="sr">
                      {proj.name} — {t.priv.toLowerCase()}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
