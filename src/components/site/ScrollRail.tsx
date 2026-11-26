'use client';

import { useEffect, useRef } from 'react';
import { watchRoom } from '@/components/sections/pillars/roomAt';

/** A solid ink marker (cream on dark rooms, black on putty) on the right edge that travels with page progress. */
export default function ScrollRail() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      el.style.transform = `translate3d(0, ${(innerHeight - el.offsetHeight) * p}px, 0)`;
    };
    const stopRoom = watchRoom(
      () => el.getBoundingClientRect().top + el.offsetHeight / 2,
      (room) => el.setAttribute('data-room', room),
    );
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => {
      stopRoom();
      cancelAnimationFrame(raf);
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
    };
  }, []);
  return <div ref={ref} className="rail" aria-hidden="true" />;
}
