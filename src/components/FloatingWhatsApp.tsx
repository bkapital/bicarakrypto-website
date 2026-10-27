import React from 'react';
import { CONFIG } from '../config';
import { useRouter } from '../router';
import { MessageCircle } from 'lucide-react';

export const FloatingWhatsApp: React.FC = () => {
  const { currentPath } = useRouter();
  const isClassDetail = currentPath.startsWith('/kelas');

  return (
    <a
      href={CONFIG.brand.whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp Team Bicara Krypto"
      className={`fixed bottom-6 right-4 sm:right-6 z-50 items-center gap-2 px-4 py-3 rounded-lg bg-[#5CF2C0] text-[#060B1E] font-medium text-xs sm:text-sm shadow-xl transition-all duration-200 hover:opacity-95 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
        isClassDetail ? 'hidden lg:flex' : 'flex'
      }`}
    >
      <MessageCircle className="w-4 h-4 fill-current shrink-0" />
      <span className="hidden sm:inline">WhatsApp Team</span>
    </a>
  );
};
