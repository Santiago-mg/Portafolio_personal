/** 12px pointy-top hexagon indicator. Decorative: the state is carried by surrounding text. */
export default function Hex({ state, className }: { state: 'done' | 'cur' | 'next'; className?: string }) {
  return (
    <svg
      className={`hex is-${state}${className ? ` ${className}` : ''}`}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden="true"
      focusable="false"
    >
      <polygon points="6,.9 10.4,3.45 10.4,8.55 6,11.1 1.6,8.55 1.6,3.45" />
    </svg>
  );
}
