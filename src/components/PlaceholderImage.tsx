import React from 'react';
import { Image, User, Video, FileText, Award, Smartphone } from 'lucide-react';

interface PlaceholderImageProps {
  label: string;
  sublabel?: string;
  type?: 'photo' | 'poster' | 'video' | 'screenshot' | 'card' | 'wallet';
  aspectRatio?: 'square' | 'video' | 'poster' | 'card' | 'portrait';
  className?: string;
  iconOnly?: boolean;
}

export const PlaceholderImage: React.FC<PlaceholderImageProps> = ({
  label,
  sublabel,
  type = 'photo',
  aspectRatio = 'video',
  className = '',
}) => {
  const getIcon = () => {
    switch (type) {
      case 'photo':
        return <User className="w-8 h-8 text-[#5CF2C0]" />;
      case 'video':
        return <Video className="w-8 h-8 text-[#5CF2C0]" />;
      case 'poster':
        return <Award className="w-8 h-8 text-[#5CF2C0]" />;
      case 'screenshot':
        return <FileText className="w-8 h-8 text-[#5CF2C0]" />;
      case 'card':
        return <Smartphone className="w-8 h-8 text-[#5CF2C0]" />;
      default:
        return <Image className="w-8 h-8 text-[#5CF2C0]" />;
    }
  };

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'portrait'
      ? 'aspect-[3/4]'
      : aspectRatio === 'poster'
      ? 'aspect-[4/5]'
      : aspectRatio === 'card'
      ? 'aspect-[1.6/1]'
      : 'aspect-[16/9]';

  return (
    <div
      className={`relative w-full ${aspectClass} rounded-2xl bg-[#010A2E] border border-white/20 flex flex-col items-center justify-center p-6 text-center overflow-hidden group select-none ${className}`}
    >
      {/* Corner accents */}
      <div className="absolute top-3 left-3 w-2 h-2 border-t border-l border-[#5CF2C0]/60" />
      <div className="absolute top-3 right-3 w-2 h-2 border-t border-r border-[#5CF2C0]/60" />
      <div className="absolute bottom-3 left-3 w-2 h-2 border-b border-l border-[#5CF2C0]/60" />
      <div className="absolute bottom-3 right-3 w-2 h-2 border-b border-r border-[#5CF2C0]/60" />

      {/* Grid pattern background */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-3 max-w-xs">
        <div className="w-14 h-14 rounded-full bg-[#02124A] border border-white/20 flex items-center justify-center shadow-inner group-hover:border-[#5CF2C0] transition-colors">
          {getIcon()}
        </div>
        <div className="font-heading font-semibold text-white text-base tracking-tight">
          {label}
        </div>
        {sublabel && (
          <div className="text-xs text-white/60 leading-relaxed">
            {sublabel}
          </div>
        )}
        <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/10 text-[10px] text-white/40 uppercase tracking-widest">
          Placeholder Rasmi
        </div>
      </div>
    </div>
  );
};
