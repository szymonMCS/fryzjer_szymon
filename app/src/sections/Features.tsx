import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Award, Coffee, Scissors } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    id: '1',
    title: 'Doświadczenie',
    description: '15 lat w branży fryzjerskiej. Setki zadowolonych klientów i niezliczone perfekcyjne strzyżenia.',
    icon: Scissors,
  },
  {
    id: '2',
    title: 'Jakość',
    description: 'Premium produkty do pielęgnacji włosów i brody. Pracujemy tylko na najlepszych markach.',
    icon: Award,
  },
  {
    id: '3',
    title: 'Atmosfera',
    description: 'Relaks i komfort podczas wizyty. Poczuj się jak w domu, wyjdź jak nowy człowiek.',
    icon: Coffee,
  },
];

export const Features = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Cards 3D flip animation
      gsap.fromTo(
        '.feature-card',
        { rotateX: 90, opacity: 0, transformPerspective: 1000 },
        {
          rotateX: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Icons pop animation
      gsap.fromTo(
        '.feature-icon',
        { scale: 0 },
        {
          scale: 1,
          duration: 0.6,
          stagger: 0.2,
          ease: 'elastic.out(1, 0.5)',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Parallax for cards
      gsap.to('.feature-card:nth-child(1)', {
        y: -50,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });

      gsap.to('.feature-card:nth-child(3)', {
        y: -80,
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

  return (
    <section
      ref={sectionRef}
      className="section py-24 bg-[#F9F9F9]"
    >
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 reveal-up">
            Dlaczego warto wybrać nasz salon?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto reveal-up">
            Połączenie doświadczenia, jakości i wyjątkowej atmosfery tworzy
            miejsce, do którego chce się wracać.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className={`feature-card card-hover bg-white rounded-2xl p-8 shadow-lg ${
                  index === 1 ? 'md:-mt-8' : ''
                }`}
              >
                {/* Icon */}
                <div className="feature-icon w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-6">
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '15+', label: 'Lat doświadczenia' },
            { value: '5000+', label: 'Zadowolonych klientów' },
            { value: '3', label: 'Fryzjerów w zespole' },
            { value: '100%', label: 'Zadowolenia' },
          ].map((stat, index) => (
            <div key={index} className="text-center reveal-up">
              <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
