# Santiago González — Portfolio

Personal portfolio of **Santiago González**, full-stack developer (TypeScript · React · Node.js) with a QA engineer's discipline. Systems Engineering student at Universidad de Medellín, Colombia.

> An engineering-led, cinematic design: charcoal ground, warm cream type, hairline drafting guides and square controls. The site is presented as a software release that passed every check — and green only ever means *passed*.

## Highlights

- **Opening presentation** — the SG mark rises, the screen floods green on *all checks passed*, then the mark bursts into rays that uncover the stage.
- **Code portrait stage** — a full-screen, background-free portrait with a split headline. Move the cursor over the face and a brush trail reveals it rendered from real test and pipeline code, only inside the silhouette. Press and hold to compile it all; a toggle does the same for keyboard and screen-reader users; touch screens get an automatic sweep.
- **Exploded system study** — a sticky, scroll-linked isometric drawing of the stack that moves through BUILD → TEST → SHIP, highlighting one layer at a time.
- Headings revealed by sweeping bars, hand-drawn strokes that draw themselves on scroll, and a monumental closing statement over a landscape drawn in SVG.
- **WebGL galleries** — a dark interlude with scroll-linked marquee type and project posters floating in depth, plus an arc carousel of every project (drag, swipe, keyboard).
- **Quality section** — interactive test pyramid with real numbers and snippets, and a defect log that replays each bug going from red to green.
- **Command palette** (⌘K / Ctrl+K), full-screen mobile menu, English/Spanish and a high-contrast theme.
- **Accessible by default** — semantic HTML, full keyboard support, visible focus, WCAG AA contrast in every theme and `prefers-reduced-motion` respected everywhere.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · CSS design tokens · Canvas 2D and WebGL2 · self-hosted Inter and IBM Plex Mono via `next/font`.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Production build: `npm run build && npm start`.

## Project structure

```
src/
  app/                 layout, page, global styles and design tokens (sg.css)
  components/
    sections/          one component per page section
    fx/                preloader, text reveal and hand-drawn strokes
    gallery/           WebGL galleries and the poster renderer
    site/              theme/language provider, command palette, mobile menu
    CodePortrait.tsx   the cursor code-reveal portrait
  content/             project data and personal links (single source of truth)
  styles/              section and effect stylesheets
```

Personal links (email, LinkedIn, CV) live in `src/content/site.ts`; empty values are simply not rendered.

## Credits

The floating-posters and arc-carousel galleries are adapted from [React Bits](https://reactbits.dev) by David Haz (MIT + Commons Clause).
