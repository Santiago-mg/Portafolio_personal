/** Faint paired drafting rules fixed across every scene (Atlas "drafting overlay"). */
export default function Guides() {
  return (
    <div className="guides" aria-hidden="true">
      <i style={{ left: 'calc(var(--gutter) - 5px)' }} />
      <i style={{ left: 'calc(33.333% - 5px)' }} />
      <i style={{ left: 'calc(66.666% - 5px)' }} />
      <i style={{ right: 'calc(var(--gutter) - 5px)' }} />
    </div>
  );
}
