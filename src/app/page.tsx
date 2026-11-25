import SiteProvider from '@/components/site/SiteProvider';
import Preloader from '@/components/fx/Preloader';
import Nav from '@/components/sections/Nav';
import Hero from '@/components/sections/Hero';
import Evidence from '@/components/sections/Evidence';
import Work from '@/components/sections/Work';
import Interlude from '@/components/sections/Interlude';
import Quality from '@/components/sections/Quality';
import Ship from '@/components/sections/Ship';
import Skills from '@/components/sections/Skills';
import Changelog from '@/components/sections/Changelog';
import About from '@/components/sections/About';
import Reel from '@/components/sections/Reel';
import Contact from '@/components/sections/Contact';
import StatusFooter from '@/components/sections/StatusFooter';

export default function Home() {
  return (
    <SiteProvider>
      <a className="skip" href="#content">Skip to content</a>
      <Preloader />
      <Nav />
      <main id="content">
        <Hero />
        <Evidence />
        <Work />
        <Interlude />
        <Quality />
        <Ship />
        <Skills />
        <Changelog />
        <About />
        <Reel />
        <Contact />
      </main>
      <StatusFooter />
    </SiteProvider>
  );
}
