import Image from 'next/image';
import type { Lang } from '@/components/site/SiteProvider';
import Figure from '../process/Figure';
import { HORIZON, LH, LW, RIDGE_PATHS } from '../process/landscape';

/** Build: the exploded stack, drawn once in its first state. */
export function StackArt({ lang }: { lang: Lang }) {
  return (
    <div className="pl-art pl-stack">
      <Figure state={0} hl={0} lang={lang} />
    </div>
  );
}

const CODE_ROWS = [
  'test("pays the order", async () => {',
  '  const res = await api.post(',
  '    "/orders", payload);',
  '  expect(res.status).toBe(201);',
  '  await page.getByRole("button")',
  '    .click();',
  '  await expect(page).toHaveURL(',
  '    /confirmed/);',
  '});  // 1,000+ passed',
  'describe("checkout", () => {',
  '  it("keeps the cart", () => {',
  '    expect(cart.total).toBe(60);',
  '  });',
  '});',
];

/** Test: the portrait in warm grayscale over rows of green test code. */
export function PortraitArt() {
  return (
    <div className="pl-art pl-portrait">
      <div className="pl-code">
        {CODE_ROWS.map((r, i) => (
          <span key={i}>{r}</span>
        ))}
      </div>
      <Image src="/santiago-cutout.png" alt="" fill sizes="200px" style={{ objectFit: 'cover', objectPosition: '50% 12%' }} />
    </div>
  );
}

const SKY: [number, string][] = [
  [0, '#243030'],
  [0.32, '#384b48'],
  [0.55, '#526962'],
  [0.66, '#727b70'],
  [0.73, '#b4917d'],
  [0.79, '#d9a58a'],
];
const TONES: [string, string, string][] = [
  ['#c39b86', '#8f8c7f', '#6f7d75'],
  ['#7e8c81', '#5f6f68', '#4f5f59'],
  ['#55665f', '#46554f', '#36433f'],
  ['#323d3a', '#262e2c', '#1d2322'],
];

/** Ship: the dusk landscape from the closing scene, cropped to the disc. */
export function LandscapeArt() {
  return (
    <div className="pl-art pl-land">
      <svg viewBox={`0 0 ${LW} ${LH}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="pl-sky" x1="0" y1="0" x2="0" y2={LH} gradientUnits="userSpaceOnUse">
            {SKY.map(([o, c]) => (
              <stop key={o} offset={o} stopColor={c} />
            ))}
          </linearGradient>
          {RIDGE_PATHS.map((r, i) => (
            <linearGradient key={i} id={`pl-r${i}`} x1="0" y1={r.top} x2="0" y2={LH} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={TONES[i][0]} />
              <stop offset=".25" stopColor={TONES[i][1]} />
              <stop offset="1" stopColor={TONES[i][2]} />
            </linearGradient>
          ))}
        </defs>
        <rect width={LW} height={HORIZON + 120} fill="url(#pl-sky)" />
        {RIDGE_PATHS.map((r, i) => (
          <g key={i}>
            <path d={r.fill} fill={`url(#pl-r${i})`} />
            <path d={r.contour} fill="none" stroke="#fffde0" strokeOpacity={0.07} strokeWidth={1.5} />
          </g>
        ))}
      </svg>
    </div>
  );
}
