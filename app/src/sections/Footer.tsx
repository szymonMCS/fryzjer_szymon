import { Link } from 'react-router-dom';
import { Scissors, Facebook, Instagram, ArrowUp } from 'lucide-react';

const footerLinks = {
  navigation: [
    { label: 'Strona główna', href: '#hero' },
    { label: 'O nas', href: '#about' },
    { label: 'Usługi', href: '#services' },
    { label: 'Zespół', href: '#team' },
    { label: 'Kontakt', href: '#contact' },
  ],
  services: [
    'Strzyżenie męskie',
    'Strzyżenie brody',
    'Combo',
    'Koloryzacja',
    'Odsiwianie',
  ],
};

export const Footer = () => {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-black text-white py-16">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <a
              href="#hero"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('#hero');
              }}
              className="flex items-center gap-2 mb-6"
            >
              <Scissors className="w-8 h-8" />
              <span className="text-2xl font-bold">SZYMON</span>
            </a>
            <p className="text-white/70 mb-6">
              Profesjonalny salon fryzjerski dla mężczyzn w Nysie. Twój styl, nasza
              pasja.
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com/fryzjerszymon"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com/fryzjerszymon"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-lg font-bold mb-6">Nawigacja</h3>
            <ul className="space-y-3">
              {footerLinks.navigation.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(link.href);
                    }}
                    className="text-white/70 hover:text-white transition-colors relative group"
                  >
                    {link.label}
                    <span className="absolute left-0 bottom-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full" />
                  </a>
                </li>
              ))}
              <li>
                <Link
                  to="/booking"
                  className="text-white/70 hover:text-white transition-colors relative group"
                >
                  Rezerwacja
                  <span className="absolute left-0 bottom-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-bold mb-6">Usługi</h3>
            <ul className="space-y-3">
              {footerLinks.services.map((service) => (
                <li key={service}>
                  <Link
                    to="/booking"
                    className="text-white/70 hover:text-white transition-colors relative group"
                  >
                    {service}
                    <span className="absolute left-0 bottom-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-6">Kontakt</h3>
            <div className="space-y-3 text-white/70">
              <p>ul. Gałczyńskiego 47a</p>
              <p>48-303 Nysa</p>
              <p className="mt-4">
                <a href="tel:+48123456789" className="hover:text-white transition-colors">
                  +48 123 456 789
                </a>
              </p>
              <p>
                <a
                  href="mailto:kontakt@fryzjerszymon.pl"
                  className="hover:text-white transition-colors"
                >
                  kontakt@fryzjerszymon.pl
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} Fryzjer Męski Szymon. Wszelkie prawa
            zastrzeżone.
          </p>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
          >
            Do góry
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};
