'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

/**
 * CodePortrait — the photo, and under the cursor the same face "compiled" into code.
 * A brush trail (like the reference video's mask reveal) paints the code layer in and
 * fades out on its own. Press and hold to reveal it all; the button does the same for
 * keyboard and screen-reader users. On touch screens it plays one automatic sweep.
 *
 * With `cutout` the source is a transparent PNG: the code only ever appears inside the
 * silhouette, so the portrait can float on the page like a stage presentation.
 */

const CODE =
  "expect(res.status).toBe(200); it('passes', async () => { await pipeline.run(); }); " +
  "assertThat($cupon, hasKeyValuePair('code', 'QA10')); Given Ana is the store administrator " +
  "When she bans Carlos Then Carlos can no longer sign in; docker build -t celularpro-api . ; " +
  "git commit -m 'fix: escape LIKE wildcards'; sonar.qualitygate.wait=true; const user = await repo.find(id); " +
  'export function Portfolio(): JSX.Element { return <Build status="passed" /> } ';

type Props = {
  src: string;
  alt: string;
  hint: string;
  hintTouch: string;
  toggleOn: string;
  toggleOff: string;
  /** how the photo fills its box, like CSS object-fit */
  fit?: 'cover' | 'contain';
  /** object-position as fractions (x, y) */
  pos?: [number, number];
  /** transparent PNG: keep the code inside the silhouette */
  cutout?: boolean;
  className?: string;
  sizes?: string;
};

type Rect = { x: number; y: number; w: number; h: number };

export default function CodePortrait({
  src, alt, hint, hintTouch, toggleOn, toggleOff,
  fit = 'cover', pos = [0.5, 0.3], cutout = false, className, sizes = '(max-width: 1023px) 100vw, 40vw',
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [full, setFull] = useState(false);
  const fullRef = useRef(false);
  const kick = useRef<() => void>(() => {});
  const [px, py] = pos;

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
    let rect: Rect = { x: 0, y: 0, w: 0, h: 0 };
    let last: { x: number; y: number } | null = null;
    let hold: { x: number; y: number; r: number } | null = null;

    /** Where the <Image> draws the photo inside the box (object-fit + object-position). */
    const place = (): Rect => {
      const s = fit === 'cover'
        ? Math.max(w / img.naturalWidth, h / img.naturalHeight)
        : Math.min(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      return { x: (w - dw) * px, y: (h - dh) * py, w: dw, h: dh };
    };

    const buildCode = () => {
      if (!img.complete || !img.naturalWidth || !w) return;
      code.width = mask.width = canvas.width = Math.round(w * dpr);
      code.height = mask.height = canvas.height = Math.round(h * dpr);
      rect = place();
      // Character grid sized to the photo, not the box, so a big stage keeps fine detail.
      const cell = Math.max(6, Math.round(Math.min(rect.w, w) / (cutout ? 68 : 54)));
      const x0 = Math.max(0, rect.x), y0 = Math.max(0, rect.y);
      const x1 = Math.min(w, rect.x + rect.w), y1 = Math.min(h, rect.y + rect.h);
      const cols = Math.ceil((x1 - x0) / cell), rows = Math.ceil((y1 - y0) / (cell * 1.25));
      if (cols < 1 || rows < 1) return;
      // Sample the visible part of the photo, one pixel per character.
      const s = document.createElement('canvas');
      s.width = cols; s.height = rows;
      const sctx = s.getContext('2d', { willReadFrequently: true })!;
      const sx = cols / (x1 - x0), sy = rows / (y1 - y0);
      sctx.drawImage(img, (rect.x - x0) * sx, (rect.y - y0) * sy, rect.w * sx, rect.h * sy);
      const data = sctx.getImageData(0, 0, cols, rows).data;
      const n = cols * rows;
      const lums = new Float32Array(n), alpha = new Float32Array(n);
      const opaque: number[] = [];
      for (let j = 0; j < n; j++) {
        alpha[j] = data[j * 4 + 3] / 255;
        lums[j] = (0.299 * data[j * 4] + 0.587 * data[j * 4 + 1] + 0.114 * data[j * 4 + 2]) / 255;
        if (alpha[j] > 0.5) opaque.push(lums[j]);
      }
      // Stretch the luminance range (2nd–98th percentile of the subject) so the face carries the contrast.
      const sorted = Float32Array.from(opaque.length ? opaque : lums).sort();
      const lo = sorted[Math.floor(sorted.length * 0.02)], hi = sorted[Math.floor(sorted.length * 0.98)];
      const span = Math.max(0.05, hi - lo);
      const c = code.getContext('2d')!;
      c.clearRect(0, 0, code.width, code.height);
      c.fillStyle = '#0D0F0E';
      if (cutout) {
        // Dark backing only inside the silhouette.
        c.drawImage(img, rect.x * dpr, rect.y * dpr, rect.w * dpr, rect.h * dpr);
        c.globalCompositeOperation = 'source-in';
        c.fillRect(0, 0, code.width, code.height);
        c.globalCompositeOperation = 'source-over';
      } else {
        c.fillRect(0, 0, code.width, code.height);
      }
      c.font = `600 ${cell * 1.15 * dpr}px ${getComputedStyle(box).getPropertyValue('--f-mono') || 'monospace'}`;
      c.textBaseline = 'top';
      let k = 0;
      for (let r = 0; r < rows; r++) {
        for (let q = 0; q < cols; q++) {
          const j = r * cols + q;
          if (cutout && alpha[j] < 0.15) { k++; continue; }
          const v = Math.min(1, Math.max(0, (lums[j] - lo) / span));
          // A steeper curve on the cutout: hair and shirt recede, the face carries the light.
          const a = (cutout ? 0.05 + Math.pow(v, 1.8) * 0.95 : 0.07 + Math.pow(v, 1.15) * 0.93) * (cutout ? alpha[j] : 1);
          c.fillStyle = v > 0.9 ? `rgba(220,255,232,${a})` : `rgba(74,222,140,${a})`;
          c.fillText(CODE[k++ % CODE.length], (x0 + q * cell) * dpr, (y0 + r * cell * 1.25) * dpr);
        }
      }
      if (cutout) {
        // Crisp silhouette edge: keep the code only where the subject is.
        c.globalCompositeOperation = 'destination-in';
        c.drawImage(img, rect.x * dpr, rect.y * dpr, rect.w * dpr, rect.h * dpr);
        c.globalCompositeOperation = 'source-over';
      }
      radius = Math.max(34, Math.min(110, Math.min(rect.w, w) * 0.11));
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
        hold.r += Math.max(rect.w, rect.h) * 0.035;
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
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      if ((e.target as HTMLElement).closest('a, button')) return;
      const p = local(e);
      hold = { x: p.x, y: p.y, r: radius };
      wake();
    };
    const onUp = () => { hold = null; wake(); };

    const resize = () => {
      const r = box.getBoundingClientRect();
      // Big stage canvases are expensive: cap the density a little lower there.
      w = r.width; h = r.height; dpr = Math.min(window.devicePixelRatio || 1, cutout ? 1.5 : 2);
      buildCode();
      wake();
    };

    // Touch screens have no cursor: play one automatic sweep over the face the first time it is seen.
    let swept = false;
    const io = new IntersectionObserver((entries) => {
      if (swept || reduce || !entries[0].isIntersecting) return;
      if (window.matchMedia('(hover: hover)').matches) return;
      swept = true;
      const t0 = performance.now();
      const sweep = (now: number) => {
        const t = (now - t0) / 2600;
        if (t > 1) { last = null; return; }
        const fx = Math.max(0, rect.x) + Math.min(rect.w, w) * (0.5 + 0.3 * Math.sin(t * Math.PI * 3));
        const fy = rect.y + rect.h * (0.16 + 0.5 * t);
        paint(fx, fy);
        requestAnimationFrame(sweep);
      };
      requestAnimationFrame(sweep);
    }, { threshold: 0.5 });

    img.onload = resize;
    // The canvas samples Next's optimised copy (a few hundred KB instead of the original).
    img.src = `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=75`;
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
  }, [src, fit, px, py, cutout]);

  return (
    <figure className={`cp${className ? ` ${className}` : ''}`}>
      <div ref={boxRef} className="cp-box">
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes={sizes}
          style={{ objectFit: fit, objectPosition: `${px * 100}% ${py * 100}%` }}
        />
        <canvas ref={canvasRef} className="cp-canvas" aria-hidden="true" />
      </div>
      <figcaption className="cp-cap">
        <span className="meta">
          fig. 01 · santiago.tsx — <span className="cp-hint-pointer">{hint}</span>
          <span className="cp-hint-touch">{hintTouch}</span>
        </span>
        <button type="button" className="b b-2 b-sm" aria-pressed={full} onClick={() => setFull((v) => !v)}>
          {full ? toggleOff : toggleOn}
        </button>
      </figcaption>
    </figure>
  );
}
