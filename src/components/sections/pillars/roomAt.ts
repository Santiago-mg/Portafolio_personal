/**
 * Which room is under a point of the viewport: 'putty' inside a `.room-putty`, else 'dark'.
 * `watchRoom` calls `apply` on mount and on scroll/resize (one rAF per frame, only on change).
 */
export type Room = 'putty' | 'dark';

export function roomAt(y: number): Room {
  const rooms = document.querySelectorAll('.room-putty');
  for (const r of rooms) {
    const b = r.getBoundingClientRect();
    if (b.top <= y && b.bottom > y) return 'putty';
  }
  return 'dark';
}

export function watchRoom(getY: () => number, apply: (room: Room) => void): () => void {
  let raf = 0;
  let last: Room | null = null;
  const run = () => {
    raf = 0;
    const room = roomAt(getY());
    if (room !== last) {
      last = room;
      apply(room);
    }
  };
  const onEvent = () => {
    if (!raf) raf = requestAnimationFrame(run);
  };
  run();
  addEventListener('scroll', onEvent, { passive: true });
  addEventListener('resize', onEvent);
  return () => {
    cancelAnimationFrame(raf);
    removeEventListener('scroll', onEvent);
    removeEventListener('resize', onEvent);
  };
}
