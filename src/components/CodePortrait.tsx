'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

/**
 * CodePortrait — the photo, and under the cursor the same face "compiled" into code.
 * A brush trail (like the reference video's mask reveal) paints the code layer in and
 * fades out on its own. Press and hold to reveal it all; the button does the same for
 * keyboard and screen-reader users. On touch screens it plays one automatic sweep.
 */

const CODE =
  "expect(res.status).toBe(200); it('passes', async () => { await pipeline.run(); }); " +
  "assertThat($cupon, hasKeyValuePair('code', 'QA10')); Given Ana is the store administrator " +
  "When she bans Carlos Then Carlos can no longer sign in; docker build -t celularpro-api . ; " +
  "git commit -m 'fix: escape LIKE wildcards'; sonar.qualitygate.wait=true; const user = await repo.find(id); " +
  'export function Portfolio(): JSX.Element { return <Build status="passed" /> } ';

const OBJECT_Y = 0.3; // must match objectPosition on the <Image>

type Props = { src: string; alt: string; hint: string; hintTouch: string; toggleOn: string; toggleOff: string };

export default function CodePortrait({ src, alt, hint, hintTouch, toggleOn, toggleOff }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [full, setFull] = useState(false);
  const fullRef = useRef(false);
  const kick = useRef<() => void>(() => {});

  useEffect(() => {
    fullRef.current = full;
    kick.current();
  }, [full]);

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;
    const ctx = canvas.getContext('2d')!;
    const code = document.createElement('canvas');
    const mask = document.createElement('canvas');
    const mctx = mask.getContext('2d')!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const img = new window.Image();
    let w = 0, h = 0, dpr = 1, raf = 0, idle = 0, radius = 60;
    let last: { x: number; y: number } | null = null;
    let hold: { x: number; y: number; r: number } | null = null;

    const buildCode = () => {
      if (!img.complete || !img.naturalWidth || !w) return;
      code.width = mask.width = canvas.width = Math.round(w * dpr);
      code.height = mask.height = canvas.height = Math.round(h * dpr);
      const cell = Math.max(7, Math.round(w / 52));
      const cols = Math.ceil(w / cell), rows = Math.ceil(h / (cell * 1.25));
      // Sample the photo with the same "cover" crop the <Image> uses.
      const s = document.createElement('canvas');
      s.width = cols; s.height = rows;
      const sctx = s.getContext('2d', { willReadFrequently: true })!;
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
      const dx = (w - dw) / 2, dy = (h - dh) * OBJECT_Y;
      sctx.drawImage(img, (dx / w) * cols, (dy / h) * rows, (dw / w) * cols, (dh / h) * rows);
      const px = sctx.getImageData(0, 0, cols, rows).data;
      const c = code.getContext('2d')!;
      c.fillStyle = '#0D0F0E';
      c.fillRect(0, 0, code.width, code.height);
      c.font = `600 ${cell * 1.15 * dpr}px ${getComputedStyle(box).getPropertyValue('--f-mono') || 'monospace'}`;
      c.textBaseline = 'top';
      // Stretch the luminance range (2nd–98th percentile) so the face, not the wall, carries the contrast.
      const lums = new Float32Array(cols * rows);
      for (let j = 0; j < lums.length; j++) lums[j] = (0.299 * px[j * 4] + 0.587 * px[j * 4 + 1] + 0.114 * px[j * 4 + 2]) / 255;
      const sorted = Float32Array.from(lums).sort();
      const lo = sorted[Math.floor(sorted.length * 0.02)], hi = sorted[Math.floor(sorted.length * 0.98)];
      const span = Math.max(0.05, hi - lo);
      let k = 0;
      for (let r = 0; r < rows; r++) {
        for (let q = 0; q < cols; q++) {
          const v = Math.min(1, Math.max(0, (lums[r * cols + q] - lo) / span));
          const a = 0.07 + Math.pow(v, 1.15) * 0.93;
          c.fillStyle = v > 0.9 ? `rgba(220,255,232,${a})` : `rgba(74,222,140,${a})`;
          c.fillText(CODE[k++ % CODE.length], q * cell * dpr, r * cell * 1.25 * dpr);
        }
      }
      radius = Math.max(34, Math.min(90, w * 0.1));
    };

    const stamp = (x: number, y: number, r: number) => {
      const g = mctx.createRadialGradient(x * dpr, y * dpr, 0, x * dpr, y * dpr, r * dpr);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(0.55, 'rgba(0,0,0,.9)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      mctx.fillStyle = g;
      mctx.beginPath();
      mctx.arc(x * dpr, y * dpr, r * dpr, 0, Math.PI * 2);
      mctx.fill();
    };

    const paint = (x: number, y: number) => {
      const from = last ?? { x, y };
      const dist = Math.hypot(x - from.x, y - from.y);
      const steps = Math.max(1, Math.ceil(dist / (radius * 0.25)));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        stamp(from.x + (x - from.x) * t, from.y + (y - from.y) * t, radius);
      }
      // A few splatters so the edge reads as a brush, not a perfect circle.
      for (let i = 0; i < 2; i++) {
        const ang = Math.random() * Math.PI * 2, off = radius * (0.7 + Math.random() * 0.6);
        stamp(x + Math.cos(ang) * off, y + Math.sin(ang) * off, radius * (0.18 + Math.random() * 0.22));
      }
      last = { x, y };
      wake();
    };

    const frame = () => {
      raf = 0;
      if (fullRef.current) {
        mctx.globalCompositeOperation = 'source-over';
        mctx.fillStyle = 'rgba(0,0,0,.18)';
        mctx.fillRect(0, 0, mask.width, mask.height);
      } else if (hold) {
        hold.r += Math.max(w, h) * 0.035;
        stamp(hold.x, hold.y, hold.r);
      } else {
        mctx.globalCompositeOperation = 'destination-out';
        mctx.fillStyle = 'rgba(0,0,0,.045)';
        mctx.fillRect(0, 0, mask.width, mask.height);
        mctx.globalCompositeOperation = 'source-over';
        idle++;
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(code, 0, 0);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(mask, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      if (fullRef.current || hold || idle < 120) raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      idle = 0;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    kick.current = wake;

    const local = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      if (hold) { hold.x = p.x; hold.y = p.y; }
      paint(p.x, p.y);
    };
    const onLeave = () => { last = null; hold = null; };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const p = local(e);
      hold = { x: p.x, y: p.y, r: radius };
      wake();
    };
    const onUp = () => { hold = null; wake(); };

    const resize = () => {
      const r = box.getBoundingClientRect();
      w = r.width; h = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
      buildCode();
      wake();
    };

    // Touch screens have no cursor: play one automatic sweep the first time it is seen.
    let swept = false;
    const io = new IntersectionObserver((entries) => {
      if (swept || reduce || !entries[0].isIntersecting) return;
      if (window.matchMedia('(hover: hover)').matches) return;
      swept = true;
      const t0 = performance.now();
      const sweep = (now: number) => {
        const t = (now - t0) / 2600;
        if (t > 1) { last = null; return; }
        paint(w * (0.5 + 0.32 * Math.sin(t * Math.PI * 3)), h * (0.18 + 0.6 * t));
        requestAnimationFrame(sweep);
      };
      requestAnimationFrame(sweep);
    }, { threshold: 0.5 });

    img.onload = resize;
    img.src = src;
    const ro = new ResizeObserver(resize);
    ro.observe(box);
    io.observe(box);
    box.addEventListener('pointermove', onMove);
    box.addEventListener('pointerleave', onLeave);
    box.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      box.removeEventListener('pointermove', onMove);
      box.removeEventListener('pointerleave', onLeave);
      box.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, [src]);

  return (
    <figure className="cp">
      <div ref={boxRef} className="cp-box">
        <Image src={src} alt={alt} fill priority sizes="(max-width: 1023px) 100vw, 40vw" style={{ objectFit: 'cover', objectPosition: `50% ${OBJECT_Y * 100}%` }} />
        <canvas ref={canvasRef} className="cp-canvas" aria-hidden="true" />
      </div>
      <figcaption className="cp-cap">
        <span className="meta">fig. 01 · santiago.tsx — <span className="cp-hint-pointer">{hint}</span><span className="cp-hint-touch">{hintTouch}</span></span>
        <button type="button" className="b b-2 b-sm" aria-pressed={full} onClick={() => setFull((v) => !v)}>
          {full ? toggleOff : toggleOn}
        </button>
      </figcaption>
    </figure>
  );
}
