import type { ReactNode } from 'react';

/** Tiny highlighter: ⟦k:text⟧ keyword · ⟦s:text⟧ string · ⟦c:text⟧ comment. */
export default function hl(src: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /⟦([ksc]):([\s\S]*?)⟧/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push(src.slice(last, m.index));
    out.push(
      <span key={i++} className={m[1]}>
        {m[2]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push(src.slice(last));
  return out;
}
