'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import RevealText from '@/components/fx/RevealText';

export default function About() {
  const ref = useRef<HTMLDivElement>(null);

  // Hidden state armed after mount only: the photo is visible without JS / with reduced motion.
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof IntersectionObserver === 'undefined') return;
    el.classList.add('is-armed');
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add('is-in');
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    // Observe the column, not the photo: a fully clipped element (inset 100%) never reports an
    // intersection in Chromium, so watching it would keep the photo hidden forever.
    io.observe(el.parentElement ?? el);
    return () => {
      io.disconnect();
      el.classList.remove('is-armed', 'is-in');
    };
  }, []);

  return (
    <section className="sec" id="about" aria-labelledby="about-h">
      <div className="wrap g12" style={{ rowGap: 48 }}>
        <div className="s4 t6">
          <div className="about-photo" ref={ref}>
            <Image
              src="/santiago.webp"
              alt="Portrait of Santiago González"
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
              style={{ objectFit: 'cover', objectPosition: '50% 30%' }}
            />
          </div>
        </div>
        <div className="s7 t12" style={{ gridColumnEnd: -1, display: 'flex', flexDirection: 'column', gap: 28 }}>
          <p className="label">About</p>
          <RevealText as="h2" id="about-h" className="disp-s t-h2">Building product and raising the bar, at the same time.</RevealText>
          <p className="t-lead">I build complete web applications with React, TypeScript and Node.js, and I take seriously the part many leave for last: proving they work. On CelularPro, a team e-commerce project, I wrote E2E suites with Serenity/JS, Playwright and Cypress, visual regression with Argos and tests driven by AI agents — all running in a Jenkins pipeline with SonarQube that deploys to Vercel. On OpenCart, a widely used open-source e-commerce platform, I fixed 37 real defects in its code that our tests found. I&apos;m looking for a team where I can build product and raise the quality bar at the same time.</p>
          <div className="spec" style={{ maxWidth: 620 }}>
            <dl className="ink-top" style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', columnGap: 24, rowGap: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, lineHeight: 1.5 }}>
              <dt>education</dt><dd>Systems Engineering · Universidad de Medellín</dd>
              <dt>location</dt><dd>Medellín, Colombia · open to remote</dd>
              <dt>languages</dt><dd>Spanish (native)</dd>
              <dt>focus</dt><dd>Full-stack (TS · React · Node) + QA automation</dd>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
