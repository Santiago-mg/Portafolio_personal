import type { CSSProperties } from 'react';
import type { Project } from '@/content/projects';

/** Drops the "Team project · N people" prefix so the right-hand label stays short. */
function shortKind(kind: string): string {
  const parts = kind.split(' · ').filter((s) => !/^team project$/i.test(s) && !/^\d+ people$/i.test(s));
  return (parts.length ? parts : [kind]).join(' · ');
}

/** Decorative "technical drawing" stand-in for a screenshot. The card already names the project. */
export default function ProjectPoster({ project, index, tone = 'light' }: { project: Project; index: number; tone?: 'light' | 'dark' }) {
  const fig = String(index).padStart(2, '0');
  return (
    <div className={`pp pp-${tone}`} aria-hidden="true">
      <span className="disp pp-num">{fig}</span>
      <div className="pp-top">
        <span className="label pp-fig">FIG. {fig} · {project.year}</span>
        <span className="label pp-kind">{shortKind(project.kind)}</span>
      </div>
      <p className="disp pp-name" style={{ '--n': project.name.length } as CSSProperties}>{project.name}</p>
      <ul className="row-list pp-checks">
        {project.checks.map((c) => (
          <li key={c} className="chk">{c}</li>
        ))}
      </ul>
    </div>
  );
}
