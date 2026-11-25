'use client';

import { useEffect, useRef, useState } from 'react';
import { useSite, type Lang } from '@/components/site/SiteProvider';
import RevealText from '@/components/fx/RevealText';
import DrawStroke from '@/components/fx/DrawStroke';
import ArrowNE from './process/ArrowNE';
import { HORIZON, LH, LW, RIDGE_PATHS, SKY_LINES, SURVEY } from './process/landscape';
import { SITE } from '@/content/site';

const COPY: Record<Lang, {
  pre: string; pass: string; line2: string;
  write: string; github: string; newTab: string;
  copy: string; copied: string; failed: string;
  place: string;
}> = {
  en: {
    pre: 'Built to ', pass: 'pass', line2: 'Ready to ship.',
    write: 'Write to me', github: 'Talk on GitHub', newTab: ' (opens in a new tab)',
    copy: 'Copy email address', copied: 'Email address copied', failed: 'Could not copy. The address is',
    place: 'Medellín, Colombia',
  },
  es: {
    pre: 'Hecho para ', pass: 'pasar', line2: 'Listo para entregar.',
    write: 'Escríbeme', github: 'Hablemos en GitHub', newTab: ' (se abre en una pestaña nueva)',
    copy: 'Copiar correo', copied: 'Correo copiado', failed: 'No se pudo copiar. La dirección es',
    place: 'Medellín, Colombia',
  },
};

/* Low-saturation dusk: blue-green shadows, a peach glow on the horizon and the far crests. */
const SKY: [number, string][] = [
  [0, '#243030'],
  [0.32, '#384b48'],
  [0.55, '#526962'],
  [0.66, '#727b70'],
  [0.73, '#b4917d'],
  [0.79, '#d9a58a'],
];
const RIDGE_TONES: [string, string, string][] = [
  ['#c39b86', '#8f8c7f', '#6f7d75'],
  ['#7e8c81', '#5f6f68', '#4f5f59'],
  ['#55665f', '#46554f', '#36433f'],
  ['#323d3a', '#262e2c', '#1d2322'],
];
const CONTOUR_ALPHA = [0.09, 0.07, 0.06, 0.05];

/** The painting, as a drawing: decorative, static, rendered once. */
function Landscape() {
  return (
    <svg className="ct-land" viewBox={`0 0 ${LW} ${LH}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ct-sky" x1="0" y1="0" x2="0" y2={LH} gradientUnits="userSpaceOnUse">
          {SKY.map(([o, c]) => (
            <stop key={o} offset={o} stopColor={c} />
          ))}
        </linearGradient>
        {RIDGE_PATHS.map((r, i) => (
          <linearGradient key={i} id={`ct-r${i}`} x1="0" y1={r.top} x2="0" y2={LH} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={RIDGE_TONES[i][0]} />
            <stop offset=".25" stopColor={RIDGE_TONES[i][1]} />
            <stop offset="1" stopColor={RIDGE_TONES[i][2]} />
          </linearGradient>
        ))}
        <linearGradient id="ct-fade" x1="0" y1={HORIZON - 10} x2="0" y2={LH} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#181818" stopOpacity="0" />
          <stop offset=".6" stopColor="#181818" stopOpacity=".6" />
          <stop offset="1" stopColor="#181818" />
        </linearGradient>
        <pattern id="ct-weave" width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M0 .5h2M2.5 2v2" stroke="#fffde0" strokeWidth="1" />
        </pattern>
        <filter id="ct-grain" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves={2} stitchTiles="stitch" seed={4} />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 -.2" />
        </filter>
      </defs>
      <rect width={LW} height={LH} fill="url(#ct-sky)" />
      <path className="ct-strata" d={SKY_LINES} />
      {RIDGE_PATHS.map((r, i) => (
        <g key={i}>
          <path d={r.fill} fill={`url(#ct-r${i})`} />
          <path className="ct-contour" d={r.contour} strokeOpacity={CONTOUR_ALPHA[i]} />
        </g>
      ))}
      <path className="ct-survey" d={SURVEY.map(([x, y]) => `M${x - 5} ${Math.round(y) - 14}h10M${x} ${Math.round(y) - 19}v10`).join('')} />
      <rect width={LW} height={LH} fill="url(#ct-fade)" />
      <rect className="ct-weave" width={LW} height={LH} fill="url(#ct-weave)" />
      <rect className="ct-grain" width={LW} height={LH} filter="url(#ct-grain)" />
    </svg>
  );
}

function CopyIcon({ done }: { done: boolean }) {
  return done ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M5.5 5.5h8v8h-8z" stroke="currentColor" strokeWidth="1.25" />
      <path d="M10.5 3.5v-1h-8v8h1" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

/**
 * Monumental closing call: a technical landscape (a valley, like the one Medellín sits in),
 * one sentence-case statement and a single dark action.
 */
export default function Contact() {
  const { lang } = useSite();
  const t = COPY[lang];
  const [copy, setCopy] = useState<'idle' | 'done' | 'failed'>('idle');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onCopy = async () => {
    window.clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(SITE.email);
      setCopy('done');
      timer.current = window.setTimeout(() => setCopy('idle'), 2000);
    } catch {
      setCopy('failed');
    }
  };

  return (
    <section className="ct" id="contact" aria-labelledby="ct-h" lang={lang}>
      <Landscape />
      <div className="ct-in">
        <RevealText as="h2" id="ct-h" className="ct-h">
          <span className="ct-l">
            {t.pre}
            <span className="stroke-host">
              {t.pass}
              <DrawStroke variant="underline" color="pass" delay={120} />
            </span>
            .
          </span>{' '}
          <span className="ct-l">{t.line2}</span>
        </RevealText>

        <div className="ct-acts">
          {SITE.email ? (
            <>
              <a className="ct-go" href={`mailto:${SITE.email}`}>
                <ArrowNE size={12} />
                <span className="ct-go-l">{t.write}</span>
              </a>
              <button type="button" className="ct-copy" onClick={onCopy} data-done={copy === 'done' ? '' : undefined} aria-label={t.copy}>
                <CopyIcon done={copy === 'done'} />
              </button>
            </>
          ) : (
            <a className="ct-go" href={SITE.github} target="_blank" rel="noopener noreferrer">
              <ArrowNE size={12} />
              <span className="ct-go-l">
                {t.github}
                <span className="sr">{t.newTab}</span>
              </span>
            </a>
          )}
        </div>
        {SITE.email ? (
          <p className="ct-mail">
            <span>{SITE.email}</span>
            <span className="sr" role="status">
              {copy === 'done' ? t.copied : copy === 'failed' ? `${t.failed} ${SITE.email}` : ''}
            </span>
          </p>
        ) : null}
      </div>
      <p className="ct-geo">
        {t.place}
        <span>6.2° N · 75.6° W</span>
      </p>
    </section>
  );
}
