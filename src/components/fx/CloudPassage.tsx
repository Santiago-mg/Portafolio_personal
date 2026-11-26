'use client';

import { useId, useRef, type CSSProperties, type RefObject } from 'react';
import { useSite, type Lang } from '@/components/site/SiteProvider';
import ArrowNE from '@/components/sections/process/ArrowNE';
import { aspectOf, boxOf, widthCss, type Variant } from './clouds/choreo';
import { LAYER_KEYS, type LayerKey } from './clouds/paint';
import { rng } from './clouds/noise';
import { useCloudTextures, usePassageMotion, useReducedMotion } from './clouds/hooks';

/** Rooms a passage can connect: charcoal, putty gallery wall, and the dusk sky of the closing scene. */
export type Room = 'dark' | 'putty' | 'dusk';

export type CloudPassageProps = {
  from: Room;
  to: Room;
  /** how the clouds move as you scroll through: part to the sides, rise, or descend */
  variant?: 'part' | 'rise' | 'descend';
  /** optional dark notched card floating over the clouds */
  card?: { label: string; stats: [string, string][]; action?: { text: string; href: string } };
  id?: string;
};

const COPY: Record<Lang, { region: string; newTab: string }> = {
  en: { region: 'In numbers', newTab: ' (opens in a new tab)' },
  es: { region: 'En cifras', newTab: ' (se abre en una pestaña nueva)' },
};

/* ---- per-passage variation: the same four textures, never the same sky twice ---- */
const SHIFT: Record<LayerKey, number> = { haze: 12, bank: 2.5, left: 3, right: 3 }; // ± vw
const SCALE: Record<LayerKey, [number, number]> = { haze: [0.92, 1.1], bank: [1, 1.06], left: [0.94, 1.06], right: [0.94, 1.06] };
const DRIFT: Record<LayerKey, [number, number]> = { haze: [16, 31], bank: [7, 37], left: [11, 23], right: [10, 27] }; // px, s

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Inline geometry of one layer: rest pose from the shared layout, plus this passage's variation. */
function layerStyles(variant: Variant, k: LayerKey, r: () => number): { outer: CSSProperties; inner: CSSProperties } {
  const b = boxOf(variant, k);
  const w = widthCss(b);
  const asp = aspectOf(k);
  const s = SCALE[k][0] + (SCALE[k][1] - SCALE[k][0]) * r();
  const flip = k === 'haze' && r() < 0.5 ? -1 : 1; // the haze is soft enough to mirror
  const [dx, dt] = DRIFT[k];
  return {
    outer: {
      width: w,
      left: `calc(${(b.cx * 100).toFixed(2)}% - ${w} * ${b.ax})`,
      top: `calc(var(--clp-h) * ${b.cy} - ${w} * ${(asp * b.ay).toFixed(4)})`,
      aspectRatio: `${(1 / asp).toFixed(4)}`,
    },
    inner: {
      translate: `${((r() * 2 - 1) * SHIFT[k]).toFixed(2)}vw 0`,
      scale: `${(s * flip).toFixed(3)} ${s.toFixed(3)}`,
      transformOrigin: `${b.ax * 100}% ${b.ay * 100}%`,
      ['--clp-drift' as string]: `${dx}px`,
      animationDuration: `${dt}s`,
      animationDelay: `${(-r() * dt).toFixed(2)}s`,
    },
  };
}

function ArrowDown() {
  return (
    <svg className="clp-arrow" width="12" height="12" viewBox="0 0 10 10" fill="none" aria-hidden="true" focusable="false">
      <path d="M5 1.5v7M1.75 5.5 5 8.75 8.25 5.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="square" />
    </svg>
  );
}

/**
 * A painted cloud passage between two rooms. The top of the band is the `from` room, the
 * bottom the `to` room; the hard seam sits behind the opaque core of the middle bank and
 * travels with it. Textures are painted once per session after hydration (see ./clouds);
 * until then a soft CSS composition holds their place, then they crossfade in.
 */
export default function CloudPassage({ from, to, variant = 'part', card, id }: CloudPassageProps) {
  const { theme, lang, booted } = useSite();
  const contrast = theme === 'contrast';
  const reduced = useReducedMotion();
  const tex = useCloudTextures(!contrast, booted);
  const ref = useRef<HTMLElement>(null);
  usePassageMotion(ref, variant, !contrast && !reduced);

  const uid = useId();
  const r = rng(hash(`${uid}|${from}|${to}|${variant}`));
  const palette = variant === 'descend' ? 'dusk' : 'day';
  const seamCy = boxOf(variant, 'bank').cy;

  const sky = (
    <>
      <div className="clp-ground" aria-hidden="true">
        {variant !== 'descend' ? <div className="clp-to" data-ground="" style={{ top: `calc(var(--clp-h) * ${seamCy})` }} /> : null}
      </div>
      <div className="clp-sky" aria-hidden="true">
        {LAYER_KEYS.map((k) => {
          const st = layerStyles(variant, k, r);
          return (
            <div key={k} className={`clp-l clp-${k}`} data-layer={k} style={st.outer}>
              <div className="clp-d" style={st.inner}>
                <div className="clp-ph" />
                <div className="clp-tx" style={tex ? { backgroundImage: `url(${tex[k][palette]})` } : undefined} />
              </div>
            </div>
          );
        })}
      </div>
      {variant === 'descend' ? <div className="clp-veil" aria-hidden="true" /> : null}
    </>
  );

  const attrs = {
    id,
    className: 'clp',
    'data-variant': variant,
    'data-from': from,
    'data-to': to,
    'data-ready': tex ? '' : undefined,
  };

  if (!card) {
    return (
      <div ref={ref as RefObject<HTMLDivElement>} {...attrs} aria-hidden="true" role="presentation">
        {sky}
      </div>
    );
  }

  const t = COPY[lang];
  const act = card.action;
  const external = act ? /^https?:/.test(act.href) : false;
  return (
    <section ref={ref} {...attrs} data-card-passage="" aria-label={t.region}>
      {sky}
      <div className="clp-card-a" data-card="">
        <div className="clp-card">
          <dl className="clp-stats">
            {card.stats.map(([k, v]) => (
              <div key={k} className="clp-stat">
                <dt>{k}:</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="clp-foot">
            <p className="clp-micro">{card.label}</p>
            {act ? (
              <a
                className="clp-act"
                href={act.href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                <span>{act.text}</span>
                {external ? <ArrowNE size={10} /> : <ArrowDown />}
                {external ? <span className="sr">{t.newTab}</span> : null}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
