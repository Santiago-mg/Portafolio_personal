import { PROJECTS, type Project } from '@/content/projects';

/*
 * Canvas versions of the "technical drawing" ProjectPoster (dark tone), for the WebGL
 * galleries. Rendered once per format after the real fonts are loaded, encoded off the
 * main thread (toBlob) and cached for the session as object URLs.
 */

export type PosterFormat = 'portrait' | 'landscape';

export const POSTER_SIZE: Record<PosterFormat, { width: number; height: number }> = {
  portrait: { width: 800, height: 1000 }, // Interlude · FlyingPosters
  landscape: { width: 800, height: 600 }, // Reel · CircularGallery
};

/** Corner radius as a fraction of the poster width. Pass the same radius to the WebGL masks. */
export const POSTER_RADIUS = 0.024;

/* CSS px width each format is designed for (keeps labels/badges in ProjectPoster proportions). */
const DESIGN_WIDTH: Record<PosterFormat, number> = { portrait: 330, landscape: 440 };

const C = {
  bg: '#0D0F0E',
  grid: '#262A27',
  line: '#262A27',
  ink: '#ECEDE7',
  mute: '#8D938E',
  chkBg: '#12261A',
  chkInk: '#5BD995',
  dot: '#3CCB7F',
  glow: 'rgba(60,203,127,0.12)',
  glow0: 'rgba(60,203,127,0)',
};

type Fonts = { disp: string; mono: string };

const cache = new Map<PosterFormat, Promise<string[]>>();

/** One poster per project (PROJECTS order), as image URLs. Cached per format. */
export function projectPosters(format: PosterFormat): Promise<string[]> {
  let job = cache.get(format);
  if (!job) {
    job = render(format);
    cache.set(format, job);
    job.catch(() => cache.delete(format));
  }
  return job;
}

/** Drops "Team project · N people" so the right-hand label stays short (same rule as ProjectPoster). */
function shortKind(kind: string): string {
  const parts = kind.split(' · ').filter((s) => !/^team project$/i.test(s) && !/^\d+ people$/i.test(s));
  return (parts.length ? parts : [kind]).join(' · ');
}

async function loadFonts(): Promise<Fonts> {
  const root = document.querySelector('.sg') ?? document.documentElement;
  const cs = getComputedStyle(root);
  const fonts: Fonts = {
    disp: cs.getPropertyValue('--f-disp').trim() || "'Archivo', 'Helvetica Neue', Arial, sans-serif",
    mono: cs.getPropertyValue('--f-mono').trim() || "'IBM Plex Mono', ui-monospace, monospace",
  };
  try {
    await Promise.all([
      document.fonts.load(`800 expanded 100px ${fonts.disp}`, 'CelularPro 0123456789'),
      document.fonts.load(`700 expanded 100px ${fonts.disp}`, '0123456789'),
      document.fonts.load(`500 24px ${fonts.mono}`, 'FIG. 0123456789 · e2e'),
    ]);
    await document.fonts.ready;
  } catch {
    /* draw with whatever is available */
  }
  return fonts;
}

/** Sets ctx.font, keeping the width axis where the browser supports it. */
function setFont(ctx: CanvasRenderingContext2D, weight: number, size: number, family: string, stretch: CanvasFontStretch = 'normal') {
  const px = Math.max(1, Math.round(size));
  ctx.font = `${weight} ${px}px ${family}`;
  if (stretch !== 'normal') {
    const plain = ctx.font;
    ctx.font = `${weight} ${stretch} ${px}px ${family}`;
    if (ctx.font === plain || !ctx.font.includes(`${px}px`)) ctx.font = plain;
  }
  if ('fontStretch' in ctx) ctx.fontStretch = stretch;
}

function setTracking(ctx: CanvasRenderingContext2D, px: number) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${px.toFixed(2)}px`;
}

function ellipsize(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

/** Largest name size that fits; two lines when that makes the name meaningfully bigger. */
function fitName(ctx: CanvasRenderingContext2D, name: string, fonts: Fonts, maxW: number, maxSize: number, maxH: number) {
  const width = (text: string) => {
    setFont(ctx, 800, 100, fonts.disp, 'expanded');
    setTracking(ctx, -2); // -0.02em at 100px
    return ctx.measureText(text).width || 1;
  };
  const one = Math.min(maxSize, (100 * maxW) / width(name), maxH / 0.95);
  const words = name.split(' ');
  if (words.length < 2) return { size: one, lines: [name] };
  let best: [string, string] = [name, ''];
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const diff = Math.abs(a.length - b.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = [a, b];
    }
  }
  const two = Math.min(maxSize, (100 * maxW) / Math.max(width(best[0]), width(best[1])), maxH / (0.95 * 2));
  return two > one * 1.25 ? { size: two, lines: best } : { size: one, lines: [name] };
}

function drawPoster(ctx: CanvasRenderingContext2D, format: PosterFormat, p: Project, index: number, fonts: Fonts) {
  const { width: W, height: H } = POSTER_SIZE[format];
  const s = W / DESIGN_WIDTH[format]; // CSS px → canvas px
  const padX = 18 * s;
  const padTop = 16 * s;
  const padBottom = 18 * s;
  const fig = String(index).padStart(2, '0');

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.setLineDash([]);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  setTracking(ctx, 0);

  // paper + glow (radial-gradient(120% 90% at 100% 0%, glow, transparent 58%))
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.setTransform(1.2 * W, 0, 0, 0.9 * H, W, 0);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  glow.addColorStop(0, C.glow);
  glow.addColorStop(0.58, C.glow0);
  ctx.fillStyle = glow;
  ctx.fillRect(-1 / 1.2, 0, 1 / 1.2, 1 / 0.9);
  ctx.restore();

  // blueprint grid (24 px cells at design size)
  const cell = 24 * s;
  const lw = Math.max(1, s * 0.85);
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = lw;
  ctx.beginPath();
  for (let x = cell - s; x < W; x += cell) {
    ctx.moveTo(Math.round(x) + lw / 2, 0);
    ctx.lineTo(Math.round(x) + lw / 2, H);
  }
  for (let y = cell - s; y < H; y += cell) {
    ctx.moveTo(0, Math.round(y) + lw / 2);
    ctx.lineTo(W, Math.round(y) + lw / 2);
  }
  ctx.stroke();

  // big outlined index numeral, bottom-right, bleeding off the edge
  const numSize = Math.min(0.42 * W, 0.62 * H);
  setFont(ctx, 700, numSize, fonts.disp, 'expanded');
  setTracking(ctx, -0.04 * numSize);
  ctx.textAlign = 'right';
  ctx.strokeStyle = C.line;
  ctx.lineWidth = Math.max(1.5, s * 1.1);
  ctx.lineJoin = 'round';
  ctx.strokeText(fig, W - 14 * s, H + 0.07 * numSize);

  // top row: FIG label + kind
  const labelSize = 12 * s;
  setFont(ctx, 500, labelSize, fonts.mono);
  setTracking(ctx, 0.06 * labelSize);
  ctx.textBaseline = 'middle';
  const topY = padTop + 8 * s;
  const figText = `FIG. ${fig} · ${p.year}`.toUpperCase();
  ctx.textAlign = 'left';
  ctx.fillStyle = C.ink;
  ctx.fillText(figText, padX, topY);
  const figW = ctx.measureText(figText).width;
  const kindMax = W - padX * 2 - figW - 16 * s;
  if (kindMax > 40 * s) {
    ctx.textAlign = 'right';
    ctx.fillStyle = C.mute;
    ctx.fillText(ellipsize(ctx, shortKind(p.kind).toUpperCase(), kindMax), W - padX, topY);
  }

  // check badges (bottom), wrapped into rows
  const chkSize = 12 * s;
  setFont(ctx, 500, chkSize, fonts.mono);
  setTracking(ctx, 0);
  const bh = 24 * s;
  const gap = 6 * s;
  const maxRow = W - padX * 2;
  const badges = p.checks.map((text) => ({ text, w: 8 * s + 6 * s + 7 * s + ctx.measureText(text).width + 9 * s }));
  const rows: (typeof badges)[] = [[]];
  let rowW = 0;
  for (const b of badges) {
    const add = (rows[rows.length - 1].length ? gap : 0) + b.w;
    if (rows[rows.length - 1].length && rowW + add > maxRow) {
      rows.push([b]);
      rowW = b.w;
    } else {
      rows[rows.length - 1].push(b);
      rowW += add;
    }
  }
  const blockH = rows.length * bh + (rows.length - 1) * gap;
  let y = H - padBottom - blockH;
  const dashY = y - 12 * s;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (const row of rows) {
    let x = padX;
    for (const b of row) {
      ctx.fillStyle = C.chkBg;
      roundRect(ctx, x, y, b.w, bh, 4 * s);
      ctx.fill();
      ctx.fillStyle = C.dot;
      ctx.beginPath();
      ctx.arc(x + 8 * s + 3 * s, y + bh / 2, 3 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.chkInk;
      ctx.fillText(b.text, x + 8 * s + 6 * s + 7 * s, y + bh / 2 + 0.5 * s);
      x += b.w + gap;
    }
    y += bh + gap;
  }

  // dashed rule above the checks
  ctx.strokeStyle = C.line;
  ctx.lineWidth = Math.max(1, s);
  ctx.setLineDash([4 * s, 3 * s]);
  ctx.beginPath();
  ctx.moveTo(padX, Math.round(dashY) + 0.5);
  ctx.lineTo(W - padX, Math.round(dashY) + 0.5);
  ctx.stroke();
  ctx.setLineDash([]);

  // the name: Archivo expanded 800, as large as it fits, bottom-aligned above the rule
  const nameBottom = dashY - 12 * s;
  const nameTop = padTop + 16 * s + 16 * s;
  const maxSize = (format === 'portrait' ? 0.24 : 0.17) * W;
  const fit = fitName(ctx, p.name, fonts, W - padX * 2, maxSize, nameBottom - nameTop);
  setFont(ctx, 800, fit.size, fonts.disp, 'expanded');
  setTracking(ctx, -0.02 * fit.size);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.ink;
  const lh = 0.95 * fit.size;
  const lastBaseline = nameBottom - lh + 0.81 * fit.size; // baseline inside a 0.95em line box
  fit.lines.forEach((line, i) => {
    ctx.fillText(line, padX, lastBaseline - (fit.lines.length - 1 - i) * lh);
  });

  // hairline frame (corners follow the WebGL mask radius)
  const bw = Math.max(1, s);
  ctx.strokeStyle = C.line;
  ctx.lineWidth = bw;
  roundRect(ctx, bw / 2, bw / 2, W - bw, H - bw, POSTER_RADIUS * W);
  ctx.stroke();

  ctx.restore();
}

function encode(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve) => {
    if (typeof canvas.toBlob !== 'function') {
      resolve(canvas.toDataURL('image/jpeg', 0.92));
      return;
    }
    canvas.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : canvas.toDataURL('image/jpeg', 0.92)), 'image/jpeg', 0.92);
  });
}

const yieldToMain = () => new Promise<void>((r) => window.setTimeout(r, 0));

async function render(format: PosterFormat): Promise<string[]> {
  const fonts = await loadFonts();
  const { width, height } = POSTER_SIZE[format];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('2D canvas unavailable');
  const urls: string[] = [];
  for (let i = 0; i < PROJECTS.length; i++) {
    drawPoster(ctx, format, PROJECTS[i], i + 1, fonts);
    urls.push(await encode(canvas));
    await yieldToMain(); // one poster per task: no long main-thread blocks
  }
  return urls;
}
