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
          className="w-full h-full p-1"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="512" height="512" rx="128" fill="#16402C"/>
          <circle cx="256" cy="256" r="210" fill="#1B4D35" stroke="#E5B842" strokeWidth="8"/>
          <circle cx="256" cy="115" r="24" fill="#E5B842"/>
          <path d="M190 230 C170 175 190 145 205 135 C195 160 190 185 200 220 Z" fill="#E5B842"/>
          <path d="M322 230 C342 175 322 145 307 135 C317 160 322 185 312 220 Z" fill="#E5B842"/>
          <path d="M185 230 C185 195 327 195 327 230 C332 280 340 325 330 360 C320 395 192 395 182 360 C172 325 180 280 185 230 Z" fill="#FAF7F0"/>
          <path d="M185 230 C195 205 240 210 245 245 C250 275 220 310 185 300 Z" fill="#16402C"/>
          <path d="M327 230 C317 205 275 210 270 245 C265 275 295 310 327 300 Z" fill="#16402C"/>
          <ellipse cx="205" cy="270" rx="10" ry="12" fill="#16402C"/>
          <circle cx="203" cy="267" r="3.5" fill="#FFFFFF"/>
          <ellipse cx="307" cy="270" rx="10" ry="12" fill="#16402C"/>
          <circle cx="305" cy="267" r="3.5" fill="#FFFFFF"/>
          <rect x="200" y="325" width="112" height="70" rx="35" fill="#E5B842"/>
          <ellipse cx="230" cy="355" rx="9" ry="12" fill="#16402C"/>
          <ellipse cx="282" cy="355" rx="9" ry="12" fill="#16402C"/>
        </svg>
      )}
    </div>
  );
};
