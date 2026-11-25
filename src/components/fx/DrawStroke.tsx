export type DrawStrokeProps = {
  /** hand-drawn shapes; the host element must have position:relative (use class "stroke-host") */
  variant: 'underline' | 'circle' | 'arrow' | 'scribble';
  color?: 'pass' | 'ink';
  /** ms delay after entering the viewport */
  delay?: number;
  className?: string;
};

/** STUB — the fx agent replaces the implementation; keep this API. */
export default function DrawStroke(_props: DrawStrokeProps) {
  return null;
}
