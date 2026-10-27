import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { Link, useRouter } from '../router';
import { Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentPath } = useRouter();

  const navLinks = [
    { label: 'Kelas', path: '/#kelas' },
    { label: 'Kad Kripto', path: '/kad-kripto' },
    { label: 'Platform Kripto', path: '/beli-jual-kripto' },
    { label: 'Wallet Kripto', path: '#', disabled: true, tag: 'Akan Datang' },
    { label: 'Hubungi Kami', path: '/hubungi' },
  ];

  const isLinkActive = (path: string) => {
    if (path.includes('#')) {
      return currentPath === '/';
    }
    return currentPath === path;
  };

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#060B1E]/95 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="group focus:outline-none py-1">
            <Logo size="md" showTagline={false} />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => {
              if (link.disabled) {
                return (
                  <div
                    key={link.label}
                    className="flex items-center gap-1.5 text-sm font-medium text-white/40 cursor-not-allowed select-none py-2"
                  >
                    <span>{link.label}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase border border-white/10 bg-white/[0.04] text-white/50">
                      {link.tag || 'Akan Datang'}
                    </span>
                  </div>
                );
              }
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-[#5CF2C0] py-2 ${
                    isLinkActive(link.path)
                      ? 'text-[#5CF2C0]'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Mint Button "Daftar Kelas" (No arrow) */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              to="/#kelas"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-xs sm:text-sm tracking-tight hover:opacity-95 transition-opacity shadow-sm min-h-[40px]"
            >
              <span>Daftar Kelas</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-w-[44px] min-h-[44px] p-2.5 rounded-lg text-white/80 hover:text-white bg-[#0B1430] border border-white/[0.08] hover:border-white/20 transition-colors flex items-center justify-center cursor-pointer"
              aria-label={mobileMenuOpen ? 'Tutup Menu' : 'Buka Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0B1430] border-b border-white/[0.08] px-4 pt-3 pb-6 animate-fadeIn shadow-2xl">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              if (link.disabled) {
                return (
                  <div
                    key={link.label}
                    className="min-h-[44px] px-4 rounded-lg text-sm font-medium text-white/40 flex items-center justify-between cursor-not-allowed select-none bg-white/[0.02]"
                  >
                    <span>{link.label}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase border border-white/10 bg-white/[0.04] text-white/50">
                      {link.tag || 'Akan Datang'}
                    </span>
                  </div>
                );
              }
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`min-h-[44px] px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                    isLinkActive(link.path)
                      ? 'bg-[#060B1E] text-[#5CF2C0] font-semibold border-l-2 border-[#5CF2C0]'
                      : 'text-white/75 hover:bg-[#060B1E] hover:text-white'
                  }`}
                >
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="pt-3 border-t border-white/[0.08] mt-2">
              <Link
                to="/#kelas"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full min-h-[46px] flex items-center justify-center py-3 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-sm shadow-sm hover:opacity-95 transition-opacity"
              >
                <span>Daftar Kelas</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
