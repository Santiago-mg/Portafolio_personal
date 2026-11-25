import type { ElementType, ReactNode } from 'react';

export type RevealTextProps = {
  /** element to render, default 'span' */
  as?: ElementType;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
  /** ms after entering the viewport */
  delay?: number;
  children: ReactNode;
};

/** STUB — the fx agent replaces the implementation; keep this API. A bar covers the text and retracts to reveal it on scroll-in. */
export default function RevealText({ as: Tag = 'span', className, id, style, children }: RevealTextProps) {
  return <Tag className={className} id={id} style={style}>{children}</Tag>;
}
