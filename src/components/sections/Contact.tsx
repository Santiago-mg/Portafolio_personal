'use client';

import { useEffect, useRef, useState } from 'react';
import RevealText from '@/components/fx/RevealText';
import DrawStroke from '@/components/fx/DrawStroke';
import { SITE } from '@/content/site';

export default function Contact() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SITE.email);
    } catch {
      window.location.href = `mailto:${SITE.email}`;
      return;
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="sec" id="contact" aria-labelledby="ct-h" style={{ paddingBottom: 96 }}>
      <div className="wrap">
        <p className="label">05 — Contact</p>
        <RevealText as="h2" id="ct-h" className="disp t-hero" style={{ marginTop: 28, maxWidth: '14ch' }}>
          Let&apos;s <span className="stroke-host">ship<DrawStroke variant="underline" color="pass" /></span> something.
        </RevealText>
        <div data-done={copied ? 'true' : 'false'} style={{ marginTop: 48, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px 24px' }}>
          {SITE.email ? (
            <>
              <button type="button" className="mail" onClick={copy}>
                <span className="sr">Copy email: </span>
                <span>{SITE.email}</span>
                <span className="swap" aria-hidden="true">
                  <span className="swap-a"><svg width="28" height="28" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" /><path d="M10.5 3.5v-.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h.5" /></svg></span>
                  <span className="swap-b" style={{ color: 'var(--pass)' }}><svg width="28" height="28" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg></span>
                </span>
              </button>
              <span className="swap meta" aria-hidden="true">
                <span className="swap-a">Click to copy</span>
                <span className="swap-b" style={{ color: 'var(--pass-ink)' }}>Copied ✓</span>
              </span>
              <span className="sr" role="status">{copied ? 'Email copied' : ''}</span>
            </>
          ) : (
            <a className="mail" href={SITE.github} target="_blank" rel="noopener noreferrer">
              github.com/Santiago-mg ↗<span className="sr"> (opens in a new tab)</span>
            </a>
          )}
        </div>
        {SITE.email || SITE.linkedin || SITE.cv ? (
        <ul className="plain" style={{ marginTop: 40, display: 'flex', flexWrap: 'wrap', gap: '8px 32px', alignItems: 'center' }}>
          {/* Without an email the big link above already is GitHub; don't repeat it. */}
          {SITE.email ? <li><a className="tag ct-link" style={{ fontSize: 14 }} href={SITE.github} target="_blank" rel="noopener noreferrer"><span className="ul">GitHub</span> ↗</a></li> : null}
          {SITE.linkedin ? <li><a className="tag ct-link" style={{ fontSize: 14 }} href={SITE.linkedin} target="_blank" rel="noopener noreferrer"><span className="ul">LinkedIn</span> ↗</a></li> : null}
          {SITE.cv ? <li><a className="tag ct-link" style={{ fontSize: 14 }} href={SITE.cv} download><span className="ul">CV</span> ↓</a></li> : null}
        </ul>
        ) : null}
        {SITE.email ? <p className="t-small" style={{ marginTop: 32 }}>No contact form on purpose — email is faster and needs no backend.</p> : null}
      </div>
    </section>
  );
}
