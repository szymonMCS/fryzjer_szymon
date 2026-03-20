import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { services } from '@/data/services';
import { Clock, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollTrigger);

const serviceImages = [
  'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80',
  'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80',
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
];

export const Services = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.services-container',
        { y: 100, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );

      gsap.fromTo(
        '.service-card',
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="services"
      ref={sectionRef}
      className="section py-24 bg-[#F9F9F9]"
    >
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
            <Sparkles className="w-4 h-4" />
            Nasza oferta
          </span>
          <h2 className="text-5xl md:text-6xl font-bold mb-6">Usługi</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Oferujemy kompleksowe usługi fryzjerskie dla mężczyzn. 
            Od klasycznych strzyżeń po nowoczesne koloryzacje.
          </p>
        </div>

        {/* Services Grid */}
        <div className="services-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.slice(0, 4).map((service, index) => (
            <div
              key={service.id}
              className="service-card group relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500"
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {/* Image - always visible */}
              <div className="relative h-[400px] overflow-hidden">
                <img
                  src={serviceImages[index]}
                  alt={service.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Gradient overlay - always visible but intensifies on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-500" />
                
                {/* Hover overlay */}
                <div className={`absolute inset-0 bg-black/40 transition-opacity duration-500 ${
                  activeIndex === index ? 'opacity-100' : 'opacity-0'
                }`} />

                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                  {/* Service Name - always visible */}
                  <h3 className="text-2xl font-bold mb-2 transition-transform duration-500 group-hover:-translate-y-2">
                    {service.name}
                  </h3>

                  {/* Price - always visible */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl font-bold">{service.price} PLN</span>
                    <span className="flex items-center text-white/80 text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      {service.duration} min
                    </span>
                  </div>

                  {/* Description - visible on hover */}
                  <p className={`text-white/90 text-sm mb-4 transition-all duration-500 ${
                    activeIndex === index 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-4'
                  }`}>
                    {service.description}
                  </p>

                  {/* CTA Button - visible on hover */}
                  <div className={`transition-all duration-500 ${
                    activeIndex === index 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-4'
                  }`}>
                    <Link to="/booking">
                      <Button
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-white text-black hover:bg-black hover:text-white transition-colors"
                      >
                        Umów się
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Services Button */}
        <div className="text-center mt-12">
          <Link to="/booking">
            <Button
              variant="outline"
              className="px-8 py-6 text-lg border-2 border-black text-black hover:bg-black hover:text-white font-medium transition-all"
            >
              Zobacz wszystkie usługi
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
