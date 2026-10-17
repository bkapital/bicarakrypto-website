/**
 * Bicara Krypto - Official Website Application
 * Perintis Crypto & Blockchain Malaysia
 */

import React, { useEffect } from 'react';
import { RouterProvider, useRouter } from './router';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Navbar } from './components/Navbar';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { Footer } from './components/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { ClassDetailPage } from './pages/ClassDetailPage';
import { CardPage } from './pages/CardPage';
import { WalletPage } from './pages/WalletPage';
import { ExchangePage } from './pages/ExchangePage';
import { ContactPage } from './pages/ContactPage';
import { PolicyPage } from './pages/PolicyPage';

const AppContent: React.FC = () => {
  const { currentPath } = useRouter();

  // Scroll to top on route change if not a hash anchor
  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, [currentPath]);

  // Route Resolver
  const renderCurrentPage = () => {
    switch (currentPath) {
      case '/':
      case '/kelas':
        return <HomePage />;
      case '/kelas/cab':
        return <ClassDetailPage slug="cab" />;
      case '/kelas/kita':
        return <ClassDetailPage slug="kita" />;
      case '/kelas/combo':
        return <ClassDetailPage slug="combo" />;
      case '/kad-kripto':
        return <CardPage />;
      // Crypto wallet page hidden for now
      // case '/crypto-wallet':
      //   return <WalletPage />;
      case '/beli-jual-kripto':
        return <ExchangePage />;
      case '/hubungi':
        return <ContactPage />;
      case '/polisi-privasi':
        return <PolicyPage type="privasi" />;
      case '/polisi-refund':
        return <PolicyPage type="refund" />;
      case '/terma-syarat':
        return <PolicyPage type="terma" />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#060B1E] text-white selection:bg-[#5CF2C0] selection:text-[#060B1E]">
      {/* 1. Announcement Bar (Top) */}
      <AnnouncementBar />

      {/* 2. Sticky Header Navbar */}
      <Navbar />

      {/* 3. Main Page Content */}
      <main className="flex-1">
        {renderCurrentPage()}
      </main>

      {/* 4. Footer */}
      <Footer />

      {/* 6. Floating WhatsApp Button (Bottom Right) */}
      <FloatingWhatsApp />
    </div>
  );
};

export default function App() {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  );
}
