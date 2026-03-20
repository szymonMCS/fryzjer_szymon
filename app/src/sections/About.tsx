import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, Phone, Clock } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export const About = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const image1Ref = useRef<HTMLDivElement>(null);
  const image2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Image 1 reveal from left
      gsap.fromTo(
        image1Ref.current,
        { x: -100, opacity: 0, clipPath: 'inset(0 100% 0 0)' },
        {
          x: 0,
          opacity: 1,
          clipPath: 'inset(0 0% 0 0)',
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Image 2 reveal from right
      gsap.fromTo(
        image2Ref.current,
        { x: 100, opacity: 0, clipPath: 'inset(0 0 0 100%)' },
        {
          x: 0,
          opacity: 1,
          clipPath: 'inset(0 0 0 0%)',
          duration: 1,
          delay: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Text content reveal
      gsap.fromTo(
        '.about-text',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Rotation on scroll
      gsap.to(image1Ref.current, {
        rotation: 2,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });

      gsap.to(image2Ref.current, {
        rotation: -2,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const scrollToTeam = () => {
    const element = document.querySelector('#team');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="about"
      ref={sectionRef}
      className="section py-24 bg-[#F9F9F9] overflow-hidden"
    >
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Images */}
          <div className="relative h-[500px] md:h-[600px]">
            {/* Image 1 */}
            <div
              ref={image1Ref}
              className="absolute top-0 left-0 w-[65%] h-[70%] rounded-2xl overflow-hidden shadow-2xl z-10"
            >
              <img
                src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80"
                alt="Barber at work"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Image 2 */}
            <div
              ref={image2Ref}
              className="absolute bottom-0 right-0 w-[60%] h-[60%] rounded-2xl overflow-hidden shadow-2xl z-20"
            >
              <img
                src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80"
                alt="Barber shop interior"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Decorative element */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-black/10 rounded-full z-0" />
          </div>

          {/* Content */}
          <div>
            <span className="about-text inline-block text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
              O nas
            </span>
            <h2 className="about-text text-4xl md:text-5xl font-bold mb-6">
              Pasja do fryzjerstwa od 2009 roku
            </h2>
            <div className="about-text space-y-4 text-gray-600 leading-relaxed mb-8">
              <p>
                Jesteśmy zespołem pasjonatów, dla których fryzjerstwo to nie tylko
                praca, ale styl życia. Od 2009 roku dbamy o to, aby każdy klient
                wychodził z naszego salonu z uśmiechem na twarzy i perfekcyjną
                fryzurą.
              </p>
              <p>
                Nasz salon to miejsce, gdzie tradycja spotyka się z nowoczesnością.
                Łączymy klasyczne techniki strzyżenia z najnowszymi trendami,
                tworząc unikalne style dopasowane do każdego klienta.
              </p>
              <p>
                Nieustannie podnosimy swoje kwalifikacje, uczestnicząc w
                szkoleniach i warsztatach. Stawiamy na jakość - zarówno w
                obsłudze, jak i w używanych produktach.
              </p>
            </div>

            {/* Contact Info */}
            <div className="about-text grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-black" />
                <span className="text-sm">ul. Gałczyńskiego 47a, Nysa</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-black" />
                <span className="text-sm">+48 123 456 789</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-black" />
                <span className="text-sm">Pn-Pt: 9:00 - 18:00</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-black" />
                <span className="text-sm">Sob: 9:00 - 14:00</span>
              </div>
            </div>

            <Button
              onClick={scrollToTeam}
              className="about-text liquid-button px-6 py-3 border-2 border-black text-black hover:text-white font-medium group"
              variant="outline"
            >
              Poznaj nasz zespół
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
