import type { Metadata } from 'next';
import { IBM_Plex_Mono, Instrument_Serif, Inter } from 'next/font/google';
import './globals.css';
import './sg.css';
import '../styles/atlas.css'; // Atlas foundation: tokens, type, shapes (section files refine it)
import '../styles/sections-a.css';
import '../styles/sections-b.css';
import '../styles/sections-c.css';
import '../styles/fx.css';
import '../styles/intro.css';
import '../styles/atlas-scenes.css';
import '../styles/clouds.css';
import '../styles/rooms.css';

// One grotesk for everything; a monospace only where the content is literally code.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono' });
// Gallery serif for display moments only (room titles, the wordmark); the grotesk does the systems.
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'Santiago González — Full-stack developer · QA automation',
  description:
    'Full-stack developer (TypeScript · React · Node.js) who proves every feature with automated tests. Medellín, Colombia.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${inter.variable} ${plexMono.variable} ${serif.variable}`}>
      <body>
        {/* Without JS the preloader never runs: let the narrative animations play. */}
        <noscript>
          <style>
            {'.sg .pl *, .sg .hero-h, .sg .stage-h *{animation-play-state:running !important}' +
              '.sg .stage-h span, .sg .cp--stage .cp-box{transform:none !important; opacity:1 !important}'}
          </style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
