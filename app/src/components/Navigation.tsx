import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'Strona główna', href: '#hero' },
  { label: 'O nas', href: '#about' },
  { label: 'Usługi', href: '#services' },
  { label: 'Zespół', href: '#team' },
  { label: 'Opinie', href: '#testimonials' },
  { label: 'Kontakt', href: '#contact' },
];

export const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  // On booking page - show simple nav
  if (!isHomePage) {
    return (
      <nav className="bg-black text-white py-4">
        <div className="container-custom flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <Scissors className="w-8 h-8 group-hover:rotate-12 transition-transform" />
            <span className="text-xl font-bold">SZYMON</span>
          </Link>
          <Link to="/">
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black">
              Wróć do strony głównej
            </Button>
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-white/90 backdrop-blur-lg shadow-sm py-3'
            : 'bg-transparent py-6'
        }`}
      >
        <div className="container-custom flex items-center justify-between">
          {/* Logo */}
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('#hero');
            }}
            className="flex items-center gap-2 group"
          >
            <Scissors
              className={`w-8 h-8 transition-colors duration-300 ${
                isScrolled ? 'text-black' : 'text-white'
              } group-hover:rotate-12 transition-transform`}
            />
            <span
              className={`text-xl font-semibold tracking-tight transition-colors duration-300 ${
                isScrolled ? 'text-black' : 'text-white'
              }`}
            >
              SZYMON
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(item.href);
                }}
                className={`text-sm font-medium transition-colors duration-300 hover:opacity-70 ${
                  isScrolled ? 'text-black' : 'text-white'
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden lg:block">
            <Link to="/booking">
              <Button
                className={`px-6 py-2 border-2 font-medium transition-all duration-300 ${
                  isScrolled
                    ? 'border-black text-black hover:bg-black hover:text-white'
                    : 'border-white text-white hover:bg-white hover:text-black'
                }`}
                variant="ghost"
              >
                Umów się
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X
                className={`w-6 h-6 ${isScrolled ? 'text-black' : 'text-white'}`}
              />
            ) : (
              <Menu
                className={`w-6 h-6 ${isScrolled ? 'text-black' : 'text-white'}`}
              />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 bg-white transition-transform duration-500 lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(item.href);
              }}
              className="text-2xl font-medium text-black hover:opacity-70 transition-opacity"
            >
              {item.label}
            </a>
          ))}
          <Link to="/booking">
            <Button className="mt-4 px-8 py-3 bg-black text-white hover:bg-gray-800">
              Umów się
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
};
