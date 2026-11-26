'use client';

import type { ReactNode } from 'react';
import RevealText from '@/components/fx/RevealText';
import { useSite, type Lang } from '@/components/site/SiteProvider';
import Hex from './pillars/Hex';
import { LandscapeArt, PortraitArt, StackArt } from './pillars/Art';

const COPY: Record<Lang, { title: ReactNode; items: [string, string][] }> = {
  en: {
    title: <>Three habits, <em>one</em> standard</>,
    items: [
      ['Build', 'Full-stack apps in TypeScript, React and Node.js, designed with Clean Architecture.'],
      ['Test', 'Every layer proven: unit, API, E2E, visual, accessibility and security tests.'],
      ['Ship', 'Delivered through pipelines: Docker, Jenkins, SonarQube Quality Gates, Vercel.'],
    ],
  },
  es: {
    title: <>Tres hábitos, <em>un</em> estándar</>,
    items: [
      ['Construir', 'Aplicaciones full-stack en TypeScript, React y Node.js, diseñadas con Clean Architecture.'],
      ['Probar', 'Cada capa comprobada: pruebas unitarias, de API, E2E, visuales, de accesibilidad y de seguridad.'],
      ['Entregar', 'Entrega con pipelines: Docker, Jenkins, Quality Gates de SonarQube, Vercel.'],
    ],
  },
};

/** Three habits as circular vignettes: the stack drawing, the portrait and the dusk landscape. */
export default function Pillars() {
  const { lang } = useSite();
  const t = COPY[lang];
  const arts = [<StackArt key="s" lang={lang} />, <PortraitArt key="p" />, <LandscapeArt key="l" />];
  return (
    <section className="sec pl" id="pillars" aria-labelledby="pl-h" lang={lang}>
      <div className="wrap">
        <RevealText as="h2" id="pl-h" className="pl-h">
          {t.title}
        </RevealText>
        <ol className="pl-grid" role="list">
          {t.items.map(([name, text], i) => (
            <li className="pl-item" key={name}>
              <p className="pl-cap">{name}</p>
              <div className="pl-disc">{arts[i]}</div>
              <div className="pl-hexes" aria-hidden="true">
                {[0, 1, 2].map((k) => (
                  <Hex key={k} state={k < i ? 'done' : k === i ? 'cur' : 'next'} />
                ))}
              </div>
              <p className="pl-t">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
