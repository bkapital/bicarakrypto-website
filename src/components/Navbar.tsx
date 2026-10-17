import React, { useState } from 'react';
import { Logo } from './Logo';
import { Link, useRouter } from '../router';
import { Menu, X, ArrowUpRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentPath } = useRouter();

  const navLinks = [
    { label: 'Kelas', path: '/#kelas' },
    { label: 'Kad Kripto', path: '/kad-kripto' },
    { label: 'Platform Kripto', path: '/beli-jual-kripto' },
    { label: 'Hubungi Kami', path: '/hubungi' },
  ];

  const isLinkActive = (path: string) => {
    if (path.includes('#')) {
      return currentPath === '/';
    }
    return currentPath === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#060B1E]/95 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="group focus:outline-none">
            <Logo size="md" showTagline={false} />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-[#5CF2C0] ${
                  isLinkActive(link.path)
                    ? 'text-[#5CF2C0]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action: Mint Button "Daftar Kelas" */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/#kelas"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-xs sm:text-sm tracking-tight hover:opacity-95 transition-opacity shadow-sm"
            >
              <span>Daftar Kelas</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-white/80 hover:text-white bg-[#0B1430] border border-white/[0.08] transition-colors"
              aria-label="Buka Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0B1430] border-b border-white/[0.08] px-4 pt-3 pb-6 animate-fadeIn">
          <div className="flex flex-col gap-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isLinkActive(link.path)
                    ? 'bg-[#060B1E] text-[#5CF2C0]'
                    : 'text-white/70 hover:bg-[#060B1E] hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-3 border-t border-white/[0.08] mt-2">
              <Link
                to="/#kelas"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-semibold text-sm shadow-sm"
              >
                <span>Daftar Kelas</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
