'use client';

import CodePortrait from '@/components/CodePortrait';
import { useSite } from '@/components/site/SiteProvider';

const T = {
  en: {
    a: ['I build', 'software'],
    b: ['that', 'passes.'],
    sr: 'I build software that passes.',
    alt: 'Santiago González, portrait',
    hint: 'Move the cursor over my face to compile it',
    hintTouch: 'Drag across the photo to compile it',
    on: 'Show code version',
    off: 'Show photo',
    explore: 'Explore',
    tag: ['Full-stack developer', 'QA automation', 'Medellín, CO'],
  },
  es: {
    a: ['Construyo', 'software'],
    b: ['que pasa', 'las pruebas.'],
    sr: 'Construyo software que pasa las pruebas.',
    alt: 'Santiago González, retrato',
    hint: 'Pasa el cursor por mi cara para compilarla',
    hintTouch: 'Desliza sobre la foto para compilarla',
    on: 'Ver versión en código',
    off: 'Ver foto',
    explore: 'Explorar',
    tag: ['Desarrollador full-stack', 'QA automation', 'Medellín, CO'],
  },
};

/** Faint topographic contours behind the portrait (drafting texture). */
function Contours() {
  const rings = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <svg className="stage-topo" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {rings.map((i) => {
        const r = 120 + i * 62;
        const k = 1 + i * 0.035;
        return (
          <path
            key={i}
            d={`M ${600 - r} 430 C ${600 - r} ${430 - r * 0.9 * k}, ${600 + r * 1.1} ${430 - r * 1.05}, ${600 + r} 420 S ${600 - r * 0.4} ${430 + r * 0.95 * k}, ${600 - r} 430 Z`}
          />
        );
      })}
    </svg>
  );
}

/** First screen: the portrait as the material encounter, with a split headline around it. */
export default function Stage() {
  const { lang } = useSite();
  const t = T[lang];
  return (
    <section className="stage" aria-labelledby="stage-h">
      <Contours />
      <div className="stage-pairs" aria-hidden="true"><i /><i /></div>
      <CodePortrait
        className="cp--stage"
        src="/santiago-cutout.png"
        alt={t.alt}
        hint={t.hint}
        hintTouch={t.hintTouch}
        toggleOn={t.on}
        toggleOff={t.off}
        fit="contain"
        pos={[0.5, 1]}
        cutout
        sizes="(max-width: 767px) 100vw, 60vw"
      />
      <h1 id="stage-h" className="stage-h disp">
        <span className="sr">{t.sr}</span>
        <span className="stage-h-a" aria-hidden="true">
          <span>{t.a[0]}</span>
          <span>{t.a[1]}</span>
        </span>
        <span className="stage-h-b" aria-hidden="true">
          <span>{t.b[0]}</span>
          <span>{t.b[1]}</span>
        </span>
      </h1>
      <ul className="stage-tag" aria-label="Role">
        {t.tag.map((x) => <li key={x} className="label">{x}</li>)}
      </ul>
      <a className="stage-cue" href="#intro">
        {t.explore} <span className="stage-arrow" aria-hidden="true">↓</span>
      </a>
    </section>
  );
}
