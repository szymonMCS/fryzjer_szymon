import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const contactInfo = {
  address: 'ul. Gałczyńskiego 47a, 48-303 Nysa',
  phone: '+48 123 456 789',
  email: 'kontakt@fryzjerszymon.pl',
  hours: [
    { day: 'Poniedziałek - Piątek', hours: '9:00 - 18:00' },
    { day: 'Sobota', hours: '9:00 - 14:00' },
    { day: 'Niedziela', hours: 'Zamknięte' },
  ],
  social: {
    facebook: 'https://facebook.com/fryzjerszymon',
    instagram: 'https://instagram.com/fryzjerszymon',
  },
};

export const Contact = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Form container slide up
      gsap.fromTo(
        '.contact-form',
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Info items stagger
      gsap.fromTo(
        '.contact-info-item',
        { x: -30, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 65%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="section py-24 bg-[#F9F9F9]"
    >
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
            <MapPin className="w-4 h-4" />
            Kontakt
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6">
            Skontaktuj się z nami
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Masz pytania? Chętnie na nie odpowiemy. Skontaktuj się z nami
            telefonicznie, mailowo lub odwiedź nasz salon.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            {/* Address */}
            <div className="contact-info-item flex items-start gap-4">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">Adres</h3>
                <p className="text-gray-600">{contactInfo.address}</p>
                <a
                  href="https://maps.google.com/?q=Gałczyńskiego+47a+Nysa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-black underline mt-2 inline-block hover:no-underline"
                >
                  Zobacz na mapie
                </a>
              </div>
            </div>

            {/* Phone */}
            <div className="contact-info-item flex items-start gap-4">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">Telefon</h3>
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="text-gray-600 hover:text-black transition-colors"
                >
                  {contactInfo.phone}
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="contact-info-item flex items-start gap-4">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">Email</h3>
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="text-gray-600 hover:text-black transition-colors"
                >
                  {contactInfo.email}
                </a>
              </div>
            </div>

            {/* Hours */}
            <div className="contact-info-item flex items-start gap-4">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">Godziny otwarcia</h3>
                <div className="space-y-1">
                  {contactInfo.hours.map((item, index) => (
                    <div key={index} className="flex justify-between text-gray-600">
                      <span>{item.day}</span>
                      <span className="font-medium">{item.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Social */}
            <div className="contact-info-item flex items-start gap-4">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                <Facebook className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Social Media</h3>
                <div className="flex gap-3">
                  <a
                    href={contactInfo.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition-colors"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a
                    href={contactInfo.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="contact-form bg-white rounded-2xl overflow-hidden shadow-lg h-[400px] lg:h-auto">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2525.7077424733886!2d17.3333!3d50.4667!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTDCsDI4JzAwLjAiTiAxN8KwMjAnMDAuMCJF!5e0!3m2!1spl!2spl!4v1609459200000!5m2!1spl!2spl"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '400px' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Salon location"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
