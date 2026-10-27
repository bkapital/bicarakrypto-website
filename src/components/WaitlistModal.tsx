import React from 'react';
import { ProductItem, CONFIG } from '../config';
import { X, MessageCircle, Sparkles } from 'lucide-react';

interface WaitlistModalProps {
  product: ProductItem | null;
  onClose: () => void;
}

export const WaitlistModal: React.FC<WaitlistModalProps> = ({ product, onClose }) => {
  if (!product) return null;

  const encodedMessage = encodeURIComponent(`Saya nak join waitlist ${product.name}`);
  const whatsappUrl = `https://wa.me/60103394725?text=${encodedMessage}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#010A2E] border-2 border-[#5CF2C0]/40 p-6 sm:p-8 shadow-2xl text-center space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#02124A] text-white/70 hover:text-white border border-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-full bg-[#5CF2C0]/10 text-[#5CF2C0] mx-auto flex items-center justify-center">
          <Sparkles className="w-6 h-6" />
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-[#02124A] text-xs font-bold text-[#5CF2C0] uppercase tracking-wider border border-[#5CF2C0]/30 mb-2">
            Pendaftaran Awal
          </span>
          <h3 className="font-oswald text-2xl font-bold text-white uppercase tracking-tight">
            Sertai Waitlist: {product.name}
          </h3>
          <p className="text-xs sm:text-sm text-white/70 mt-2 leading-relaxed">
            Program ini sedang disiapkan. Jadi individu terawal yang dimaklumkan sebaik sahaja pendaftaran dibuka.
          </p>
        </div>

        <div className="pt-2 space-y-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 rounded-xl bg-[#5CF2C0] text-[#02124A] font-oswald font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Sertai Waitlist via WhatsApp</span>
          </a>
          <p className="text-[11px] text-white/40">
            Mesej pra-isi akan dibuka secara automatik di WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
};
