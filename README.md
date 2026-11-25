# Santiago González — Portfolio

Personal portfolio of **Santiago González**, full-stack developer (TypeScript · React · Node.js) with a QA engineer's discipline. Systems Engineering student at Universidad de Medellín, Colombia.

> **Build verde** — the site is presented as a software release that passed every check: a CI pipeline in the hero, check badges on every project, a defect log and a status bar. Green only ever means *passed*.

## Highlights

- **Code portrait** — move the cursor over the photo and a brush trail reveals the same face rendered from real test and pipeline code. Press and hold to compile it all; a toggle does the same for keyboard and screen-reader users; touch screens get an automatic sweep.
- **Preloader and diagonal wipe**, headings revealed by sweeping bars, and hand-drawn strokes that draw themselves on scroll.
- **WebGL galleries** — a dark interlude with scroll-linked marquee type and project posters floating in depth, plus an arc carousel of every project (drag, swipe, keyboard).
- **Quality section** — interactive test pyramid with real numbers and snippets, and a defect log that replays each bug going from red to green.
- **Command palette** (⌘K / Ctrl+K), full-screen mobile menu, English/Spanish and three themes (light, dark, high contrast).
- **Accessible by default** — semantic HTML, full keyboard support, visible focus, WCAG AA contrast in every theme and `prefers-reduced-motion` respected everywhere.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · CSS design tokens · WebGL2 · self-hosted Archivo and IBM Plex fonts via `next/font`.

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
