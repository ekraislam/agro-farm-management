import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'info' | 'danger' | 'gold' | 'neutral';
  children: ReactNode;
  size?: 'sm' | 'md';
}

export const Badge = ({ 
  variant = 'neutral', 
  children, 
  size = 'md' 
}: BadgeProps) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs md:text-sm';

  const variantClasses = {
    success: 'bg-[#EAF5EE] text-[#1B4D35] border border-[#C5E3D0] font-medium',
    warning: 'bg-[#FFF8E6] text-[#8C6200] border border-[#FBE5AA] font-medium',
    danger: 'bg-[#FDF2F2] text-[#9E2A2B] border border-[#F8C8C8] font-medium',
    info: 'bg-[#EBF5FA] text-[#1E5670] border border-[#C6E2EE] font-medium',
    gold: 'bg-[#FEF9E7] text-[#936709] border border-[#F7E2A9] font-medium',
    neutral: 'bg-[#F4EFE6] text-[#4A5568] border border-[#E2DAC7] font-medium',
  }[variant];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${sizeClasses} ${variantClasses}`}>
      {children}
    </span>
  );
};
