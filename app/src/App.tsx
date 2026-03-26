import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import AdminLoginPage from '@/pages/admin/LoginPage';
import AdminLayout from '@/pages/admin/AdminLayout';
import DashboardPage from '@/pages/admin/DashboardPage';
import ServicesPage from '@/pages/admin/ServicesPage';
import TeamPage from '@/pages/admin/TeamPage';
import BookingsPage from '@/pages/admin/BookingsPage';
import BlacklistPage from '@/pages/admin/BlacklistPage';
import MemberSchedulePage from '@/pages/admin/MemberSchedulePage';

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
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="schedule" element={<MemberSchedulePage />} />
          <Route path="blacklist" element={<BlacklistPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
