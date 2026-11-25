import type { CSSProperties, Ref } from 'react';
import type { Lang } from '@/components/site/SiteProvider';
import {
  AXIS_TICKS,
  CENTER_LINE,
  DETAIL_KINDS,
  GROUPS,
  HIGHLIGHT,
  NOTES,
  PATHS,
  VB_H,
  VB_W,
  connectors,
  groupAt,
  noteAt,
  type GroupId,
  type State,
} from './geometry';

type Named = Exclude<GroupId, 'arrow'>;
const NAMES: Record<Lang, Record<Named, [string, string]>> = {
  en: {
    data: ['Data', 'PostgreSQL · Prisma'],
    api: ['API', 'Express · Clean Architecture'],
    ui: ['Interface', 'React · TypeScript'],
    qa: ['Quality', 'Tests · Quality Gate'],
    ship: ['Pipeline', 'Jenkins · Docker · Deploy'],
  },
  es: {
    data: ['Datos', 'PostgreSQL · Prisma'],
    api: ['API', 'Express · Clean Architecture'],
    ui: ['Interfaz', 'React · TypeScript'],
    qa: ['Calidad', 'Pruebas · Quality Gate'],
    ship: ['Pipeline', 'Jenkins · Docker · Despliegue'],
  },
};

/** Detail and leader paths of a group, as one layer (cream or green). */
function Layer({ g, className }: { g: GroupId; className: string }) {
  const p = PATHS[g];
  return (
    <g className={className}>
      {className === 'p-hi' ? <path className="p-o" d={p.faces} /> : null}
      {DETAIL_KINDS.map((k) => (p.detail[k] ? <path key={k} className={`p-${k}`} d={p.detail[k]} /> : null))}
      {p.leader ? <path className="p-ld" d={p.leader} /> : null}
    </g>
  );
}

/**
 * The exploded drawing in a given state. Decorative (aria-hidden): the chapter's text says
 * the same in words. `hl` picks the green group; the live chapter moves the groups itself.
 */
export default function Figure({ state, hl, lang, ref }: { state: State; hl: State; lang: Lang; ref?: Ref<HTMLDivElement> }) {
  const names = NAMES[lang];
  return (
    <div ref={ref} className="prc-fig" data-hl={hl} aria-hidden="true">
      <svg className="prc-svg" viewBox={`0 0 ${VB_W} ${VB_H}`} focusable="false">
        <path className="p-cl" d={CENTER_LINE} />
        <path className="p-tk" d={AXIS_TICKS} />
        {connectors(state).map((c, i) => (
          <line key={i} className="p-cn" x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} />
        ))}
        {GROUPS.map((g) => {
          const [x, y] = groupAt(g, state);
          const on = HIGHLIGHT[g];
          return (
            <g key={g} data-g={g} data-on={on} transform={`translate(${x} ${y})`}>
              <path className="p-f" d={PATHS[g].faces} />
              <Layer g={g} className="p-ink" />
              {on >= 0 ? <Layer g={g} className="p-hi" /> : null}
            </g>
          );
        })}
      </svg>
      {NOTES.map((n) => {
        const [ax, ay] = noteAt(n, state);
        return (
          <span
            key={n.g}
            className="prc-note"
            data-n={n.g}
            data-side={n.side}
            data-on={HIGHLIGHT[n.g]}
            style={{ '--ax': ax, '--ay': ay } as CSSProperties}
          >
            <b>{names[n.g][0]}</b>
            <span>{names[n.g][1]}</span>
          </span>
        );
      })}
    </div>
  );
}

/**
 * Binds a rendered Figure for scroll-linked updates. Returns `apply(σ)`, which moves the groups,
 * stretches the assembly lines and carries the notes along — transforms and two line
 * attributes per connector, no layout.
 */
export function bindFigure(fig: HTMLElement): (sigma: number) => void {
  const groups = GROUPS.map((g) => [g, fig.querySelector<SVGGElement>(`[data-g="${g}"]`)] as const);
  const lines = Array.from(fig.querySelectorAll<SVGLineElement>('.p-cn'));
  const notes = NOTES.map((n) => [n, fig.querySelector<HTMLElement>(`[data-n="${n.g}"]`)] as const);
  return (sigma) => {
    for (const [g, el] of groups) {
      if (!el) continue;
      const [x, y] = groupAt(g, sigma);
      el.setAttribute('transform', `translate(${x} ${y})`);
    }
    connectors(sigma).forEach((c, i) => {
      const l = lines[i];
      if (!l) return;
      l.setAttribute('x1', String(c.x1));
      l.setAttribute('y1', String(c.y1));
      l.setAttribute('x2', String(c.x2));
      l.setAttribute('y2', String(c.y2));
    });
    for (const [n, el] of notes) {
      if (!el) continue;
      const [ax, ay] = noteAt(n, sigma);
      el.style.setProperty('--ax', String(ax));
      el.style.setProperty('--ay', String(ay));
    }
  };
}
