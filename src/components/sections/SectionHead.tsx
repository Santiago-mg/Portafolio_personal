import type { ReactNode } from 'react';
import RevealText from '@/components/fx/RevealText';

/** Chapters in the page's build → test → ship → log → contact run. */
const CHAPTERS = 5;

/**
 * Chapter label: optional number, a row of process dots (done = cream, current = green,
 * upcoming = hollow) and the chapter word. The dots are decorative; the text reads "01 Build".
 */
export function ChapterLabel({ n, step, label, className }: { n?: string; step: number; label: ReactNode; className?: string }) {
  return (
    <p className={`label sh-meta${className ? ` ${className}` : ''}`}>
      {n ? <><span className="sh-n">{n}</span>{' '}</> : null}
      <span className="sh-dots" aria-hidden="true">
        {Array.from({ length: CHAPTERS }, (_, i) => (
          <i key={i} className={i + 1 < step ? 'is-done' : i + 1 === step ? 'is-cur' : undefined} />
        ))}
      </span>{' '}
      <span className="sh-l">{label}</span>
    </p>
  );
}

/**
 * Atlas section head: chapter label, display title (optionally split into two offset
 * phrases, like parts on a drafting table) and a short intro in a narrow measure.
 */
export default function SectionHead({
  id,
  n,
  step,
  label,
  title,
  intro,
}: {
  id: string;
  n?: string;
  step: number;
  label: ReactNode;
  /** one phrase, or two: the second sits offset on its own line */
  title: string | readonly [string, string];
  intro: ReactNode;
}) {
  const split = typeof title !== 'string';
  return (
    <div className="g12 sec-head sh">
      <ChapterLabel n={n} step={step} label={label} />
      <RevealText as="h2" id={id} className={`disp-s t-h2 sh-h${split ? ' sh-split' : ''}`}>
        {split ? (
          <>
            <span className="sh-a">{title[0]}</span> <span className="sh-b">{title[1]}</span>
          </>
        ) : (
          title
        )}
      </RevealText>
      <p className="t-small sh-intro">{intro}</p>
    </div>
  );
}
