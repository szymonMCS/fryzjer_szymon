import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heroRef.current) return;
    
    const ctx = gsap.context(() => {
      // Animation timeline
      const tl = gsap.timeline({ delay: 0.3 });

      // Image reveal
      tl.fromTo('.hero-image', 
        { scale: 1.2, filter: 'blur(10px)' },
        { scale: 1, filter: 'blur(0px)', duration: 1.4, ease: 'power3.out' }
      );

      // Heading reveal
      tl.fromTo('.hero-heading', 
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
        '-=0.8'
      );

      // Subheading fade in
      tl.fromTo('.hero-subheading', 
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        '-=0.4'
      );

      // CTA button elastic
      tl.fromTo('.hero-cta', 
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: 'elastic.out(1, 0.5)' },
        '-=0.2'
      );

      // Parallax on scroll
      gsap.to('.hero-image', {
        y: 150,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      // Content fade out on scroll
      gsap.to(contentRef.current, {
        opacity: 0,
        y: -50,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: '50% top',
          scrub: true,
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative w-full h-screen overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <div className="hero-image absolute inset-0 w-full h-full">
          <img
            src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1920&q=80"
            alt="Barber shop"
            className="w-full h-full object-cover"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        </div>
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="relative z-10 h-full flex items-center"
      >
        <div className="container-custom">
          <div className="max-w-2xl">
            {/* Heading */}
            <h1 className="hero-heading text-white mb-4">
              <span className="block text-5xl md:text-7xl lg:text-8xl font-light">
                Fryzjer Męski
              </span>
              <span className="block text-6xl md:text-8xl lg:text-9xl font-bold mt-2">
                SZYMON
              </span>
            </h1>

            {/* Subheading */}
            <p className="hero-subheading text-xl md:text-2xl text-white/90 font-light mb-8 max-w-lg">
              Męskie strzyżenie włosów i brody w Nysie. Profesjonalizm, styl i
              precyzja w każdym cięciu.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link to="/booking">
                <Button
                  className="hero-cta px-8 py-6 text-lg bg-white text-black border-2 border-white hover:bg-black hover:text-white font-medium group transition-all"
                >
                  Umów się teraz
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button
                onClick={() => {
                  const element = document.querySelector('#services');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                variant="outline"
                className="hero-cta px-8 py-6 text-lg border-2 border-white text-white hover:bg-white hover:text-black font-medium transition-all"
              >
                Zobacz usługi
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#F9F9F9] to-transparent z-20" />
    </section>
  );
};
