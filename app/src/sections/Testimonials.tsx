import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reviews } from '@/data/reviews';
import { Star, Quote } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export const Testimonials = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Speed up marquee on scroll
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          const speed = 1 + Math.abs(self.getVelocity()) / 5000;
          if (trackRef.current) {
            trackRef.current.style.animationDuration = `${30 / speed}s`;
          }
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Double the reviews for seamless loop
  const allReviews = [...reviews, ...reviews];

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      className="section py-24 bg-[#F9F9F9] overflow-hidden"
    >
      <div className="container-custom mb-16">
        {/* Section Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
            <Quote className="w-4 h-4" />
            Opinie klientów
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6">
            Co mówią nasi klienci
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Zadowolenie klientów jest dla nas najważniejsze. Sprawdź, co o nas
            mówią.
          </p>
        </div>
      </div>

      {/* Marquee Track */}
      <div className="relative">
        {/* Gradient masks */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#F9F9F9] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#F9F9F9] to-transparent z-10 pointer-events-none" />

        <div
          ref={trackRef}
          className="marquee-track flex gap-6 py-4"
          style={{ width: 'max-content' }}
        >
          {allReviews.map((review, index) => (
            <div
              key={`${review.id}-${index}`}
              className="flex-shrink-0 w-[350px] md:w-[400px] bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
              {/* Quote icon */}
              <Quote className="w-8 h-8 text-black/10 mb-4" />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* Comment */}
              <p className="text-gray-700 mb-6 leading-relaxed">
                "{review.comment}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white font-bold">
                  {review.customer_name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold">{review.customer_name}</h4>
                  <p className="text-sm text-gray-500">
                    {review.created_at ? new Date(review.created_at).toLocaleDateString('pl-PL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }) : ''}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="container-custom mt-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '4.9', label: 'Średnia ocena', suffix: '/5' },
            { value: '500+', label: 'Opinii' },
            { value: '98%', label: 'Poleca nas' },
            { value: '10+', label: 'Lat na rynku' },
          ].map((stat, index) => (
            <div key={index} className="text-center reveal-up">
              <div className="text-4xl md:text-5xl font-bold">
                {stat.value}
                <span className="text-2xl text-gray-400">{stat.suffix}</span>
              </div>
              <div className="text-gray-600 mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
