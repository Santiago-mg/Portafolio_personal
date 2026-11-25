import type { Metadata } from 'next';
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';
import './sg.css';
import '../styles/sections-a.css';
import '../styles/sections-b.css';
import '../styles/sections-c.css';
import '../styles/fx.css';

const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo' });
const plexSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex-sans' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono' });

export const metadata: Metadata = {
  title: 'Santiago González — Full-stack developer · QA automation',
  description:
    'Full-stack developer (TypeScript · React · Node.js) who proves every feature with automated tests. Medellín, Colombia.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body>
        {/* Without JS the preloader never runs: let the narrative animations play. */}
        <noscript>
          <style>{'.sg[data-boot] .pl *, .sg[data-boot] .hero-h{animation-play-state:running !important}'}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
