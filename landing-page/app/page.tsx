import { Collections } from '@/components/site/Collections';
import { Faq } from '@/components/site/Faq';
import { Features } from '@/components/site/Features';
import { FinalCta } from '@/components/site/FinalCta';
import { Footer } from '@/components/site/Footer';
import { Hero } from '@/components/site/Hero';
import { Nav } from '@/components/site/Nav';
import { Playground } from '@/components/site/Playground';
import { Privacy } from '@/components/site/Privacy';

export default function HomePage(): React.JSX.Element {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <Collections />
        <Features />
        <Playground />
        <Privacy />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
