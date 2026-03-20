import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Navigation } from '@/components/Navigation';
import { ChatWidget } from '@/components/ChatWidget';
import { Hero } from '@/sections/Hero';
import { Features } from '@/sections/Features';
import { About } from '@/sections/About';
import { Services } from '@/sections/Services';
import { Team } from '@/sections/Team';
import { Testimonials } from '@/sections/Testimonials';
import { Contact } from '@/sections/Contact';
import { Footer } from '@/sections/Footer';
import { BookingPage } from '@/pages/BookingPage';

gsap.registerPlugin(ScrollTrigger);

function HomePage() {
  useEffect(() => {
    try {
      document.documentElement.style.scrollBehavior = 'smooth';
      ScrollTrigger.refresh();
      
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      if (prefersReducedMotion) {
        gsap.globalTimeline.timeScale(0);
      }
    } catch (err) {
      console.error('Error initializing GSAP:', err);
    }

    return () => {
      try {
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      } catch (err) {
        console.error('Error cleaning up GSAP:', err);
      }
    };
  }, []);

  return (
    <div className="relative">
      <Navigation />
      <main>
        <Hero />
        <Features />
        <About />
        <Services />
        <Team />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/booking" element={<BookingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
