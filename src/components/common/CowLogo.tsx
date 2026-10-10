import { useState } from 'react';

interface CowLogoProps {
  size?: number | string;
  className?: string;
  rounded?: string;
}

export const CowLogo = ({ 
  size = 40, 
  className = '',
  rounded = 'rounded-2xl'
}: CowLogoProps) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div 
      style={{ width: size, height: size }} 
      className={`relative overflow-hidden shrink-0 flex items-center justify-center bg-white border border-[#E8DFC9] shadow-2xs ${rounded} ${className}`}
    >
      {!hasError ? (
        <img 
          src="/logo.png" 
          alt="খামার লোগো" 
          className="w-full h-full object-cover select-none"
          onError={() => setHasError(true)}
        />
      ) : (
        <svg 
          viewBox="0 0 512 512" 
          className="w-full h-full"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="512" height="512" rx="128" fill="#16402C"/>
          <circle cx="256" cy="256" r="215" stroke="#E5B842" strokeWidth="6" opacity="0.6"/>
          <circle cx="256" cy="256" r="185" fill="#1B4D35" stroke="#E5B842" strokeWidth="10"/>
          {/* Royal Laurel Wreath & Crown */}
          <path d="M160 360 C130 290 140 200 200 150 C185 185 180 235 200 290 C215 330 240 360 256 370 C240 370 190 380 160 360 Z" fill="#E5B842"/>
          <path d="M352 360 C382 290 372 200 312 150 C327 185 332 235 312 290 C297 330 272 360 256 370 C272 370 322 380 352 360 Z" fill="#E5B842"/>
          {/* Center Royal Crown & Wheat */}
          <circle cx="256" cy="180" r="20" fill="#E5B842"/>
          <path d="M220 220 L256 240 L292 220 L280 270 L232 270 Z" fill="#E5B842"/>
          <path d="M210 280 C210 320 256 345 256 345 C256 345 302 320 302 280 Z" fill="#FAF7F0" stroke="#E5B842" strokeWidth="6"/>
        </svg>
      )}
    </div>
  );
};
