import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { teamMembers } from '@/data/team';
import { ChevronLeft, ChevronRight, Star, Instagram, Scissors } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export const Team = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.team-header',
        { y: 50, opacity: 0 },
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
        '.team-card',
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sliderRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Auto-slide
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % teamMembers.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % teamMembers.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + teamMembers.length) % teamMembers.length);
  };

  return (
    <section
      id="team"
      ref={sectionRef}
      className="section py-24 bg-[#F9F9F9] overflow-hidden"
    >
      <div className="container-custom">
        {/* Section Header */}
        <div className="team-header text-center mb-16">
          <span className="inline-block text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
            Nasi eksperci
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Poznaj nasz zespół
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Profesjonaliści z pasją, którzy dbają o Twój wygląd i samopoczucie.
            Każdy z nas ma unikalne umiejętności i specjalizację.
          </p>
        </div>

        {/* Slider Container */}
        <div className="relative max-w-6xl mx-auto" ref={sliderRef}>
          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-16 z-20 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-black hover:text-white transition-all duration-300 group"
          >
            <ChevronLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-16 z-20 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-black hover:text-white transition-all duration-300 group"
          >
            <ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>

          {/* Cards Container */}
          <div className="overflow-hidden px-4">
            <div 
              className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="team-card w-full flex-shrink-0 px-4"
                >
                  <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      {/* Image Side */}
                      <div className="relative h-[400px] lg:h-[500px] overflow-hidden">
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        
                        {/* Name on Image */}
                        <div className="absolute bottom-6 left-6 right-6">
                          <h3 className="text-4xl font-bold text-white mb-2">
                            {member.name}
                          </h3>
                          <p className="text-white/80 text-lg flex items-center gap-2">
                            <Scissors className="w-5 h-5" />
                            {member.role}
                          </p>
                        </div>

                        {/* Social */}
                        <div className="absolute top-6 right-6">
                          <a
                            href="#"
                            className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all"
                          >
                            <Instagram className="w-5 h-5 text-white hover:text-black" />
                          </a>
                        </div>
                      </div>

                      {/* Content Side */}
                      <div className="p-8 lg:p-12 flex flex-col justify-center">
                        {/* Rating */}
                        <div className="flex items-center gap-1 mb-6">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          ))}
                          <span className="ml-2 text-gray-500">5.0 (127 opinii)</span>
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 text-lg leading-relaxed mb-8">
                          {member.description}
                        </p>

                        {/* Specialties */}
                        <div className="mb-8">
                          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                            Specjalizacje
                          </h4>
                          <div className="flex flex-wrap gap-3">
                            {member.specialties.map((specialty, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-4 py-2 bg-black text-white text-sm rounded-full"
                              >
                                <Star className="w-3 h-3 mr-2" />
                                {specialty}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* CTA */}
                        <Link
                          to="/booking"
                          className="inline-flex items-center justify-center w-full py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                        >
                          Umów wizytę z {member.name}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-3 mt-10">
            {teamMembers.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`h-3 rounded-full transition-all duration-500 ${
                  index === activeIndex
                    ? 'bg-black w-10'
                    : 'bg-gray-300 w-3 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* Counter */}
          <div className="text-center mt-6 text-gray-400 font-medium">
            <span className="text-black text-2xl">{activeIndex + 1}</span>
            <span className="mx-2">/</span>
            <span>{teamMembers.length}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
