import SiteProvider from '@/components/site/SiteProvider';
import Guides from '@/components/site/Guides';
import ScrollRail from '@/components/site/ScrollRail';
import Preloader from '@/components/fx/Preloader';
import Nav from '@/components/sections/Nav';
import Stage from '@/components/sections/Stage';
import Hero from '@/components/sections/Hero';
import Evidence from '@/components/sections/Evidence';
import Process from '@/components/sections/Process';
import CloudPassage from '@/components/fx/CloudPassage';
import Pillars from '@/components/sections/Pillars';
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
      <Guides />
      <ScrollRail />
      <Nav />
      <main id="content">
        <Stage />
        <Hero />
        <Evidence />
        <Process />
        <CloudPassage
          from="dark"
          to="putty"
          variant="part"
          card={{
            label: 'Scroll',
            stats: [['Tests', '1,000+'], ['Defects fixed', '37']],
            action: { text: 'See the work', href: '#work' },
          }}
        />
        <div className="room room-putty">
          <Work />
        </div>
        <CloudPassage from="putty" to="dark" variant="rise" />
        <Interlude />
        <Quality />
        <Ship />
        <CloudPassage from="dark" to="putty" variant="part" />
        <div className="room room-putty">
          <Pillars />
          <Skills />
          <Changelog />
          <About />
        </div>
        <CloudPassage from="putty" to="dark" variant="rise" />
        <Reel />
        <CloudPassage from="dark" to="dusk" variant="descend" />
        <Contact />
      </main>
      <StatusFooter />
    </SiteProvider>
  );
}
