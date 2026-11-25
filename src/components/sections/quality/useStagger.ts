'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Scroll-in stagger, once. The hidden state is armed only after mount
 * (data-armed), so content is visible without JS and during SSR.
 * Styles live in sections-b.css (.stg / .stg-i).
 */
export default function useStagger(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') return;
    el.dataset.armed = 'true';
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.dataset.shown = 'true';
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
}
