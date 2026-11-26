import type { ReactNode } from 'react';
import RevealText from '@/components/fx/RevealText';
import Hex from './pillars/Hex';

/** Chapters in the page's build → test → ship → log → contact run. */
const CHAPTERS = 5;

/**
 * Chapter label: optional number, a row of hexagons (done = filled ink, current = filled green,
 * upcoming = outline) and the chapter word. The dots are decorative; the text reads "01 Build".
 */
export function ChapterLabel({ n, step, label, className }: { n?: string; step: number; label: ReactNode; className?: string }) {
  return (
    <p className={`label sh-meta${className ? ` ${className}` : ''}`}>
      {n ? <><span className="sh-n">{n}</span>{' '}</> : null}
      <span className="sh-dots" aria-hidden="true">
        {Array.from({ length: CHAPTERS }, (_, i) => (
          <Hex key={i} state={i + 1 < step ? 'done' : i + 1 === step ? 'cur' : 'next'} />
        ))}
      </span>{' '}
      <span className="sh-l">{label}</span>
    </p>
  );
}

/** Italic last word (serif moments in putty rooms; plain in the dark rooms). A single word is italic only when `single` is set. */
function emph(text: string, single = false): ReactNode {
  const i = text.lastIndexOf(' ');
  if (i < 0) return single ? <em>{text}</em> : text;
  return (
    <>
      {text.slice(0, i + 1)}
      <em>{text.slice(i + 1)}</em>
    </>
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
            <span className="sh-a">{title[0]}</span> <span className="sh-b">{emph(title[1], true)}</span>
          </>
        ) : (
          emph(title)
        )}
      </RevealText>
      <p className="t-small sh-intro">{intro}</p>
    </div>
  );
}
