/** Drawn north-east arrow for outbound actions (matches the 1px drafting line, scaled up a touch). */
export default function ArrowNE({ size = 10, className }: { size?: number; className?: string }) {
  return (
    <svg className={className ? `arrow-ne ${className}` : 'arrow-ne'} width={size} height={size} viewBox="0 0 10 10" fill="none" aria-hidden="true" focusable="false">
      <path d="M1.5 8.5 8.5 1.5M3 1.5h5.5V7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="square" />
    </svg>
  );
}
