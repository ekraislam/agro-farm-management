import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle: string;
  icon: LucideIcon;
  variant?: 'green' | 'gold' | 'cream' | 'red' | 'blue';
  trend?: {
    text: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
}

export const StatCard = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  variant = 'green',
  trend,
  onClick,
}: StatCardProps) => {
  const iconBgStyles = {
    green: 'bg-[#16402C]/10 text-[#16402C] border-[#16402C]/20',
    gold: 'bg-[#D4A017]/15 text-[#936709] border-[#D4A017]/30',
    cream: 'bg-[#F4EFE2] text-[#1B4D35] border-[#E2DAC7]',
    red: 'bg-[#C53030]/10 text-[#9B2C2C] border-[#C53030]/20',
    blue: 'bg-[#2B6CB0]/10 text-[#2B6CB0] border-[#2B6CB0]/20',
  }[variant];

  const borderAccentStyles = {
    green: 'hover:border-[#16402C]/40',
    gold: 'hover:border-[#D4A017]/50',
    cream: 'hover:border-[#C4B9A3]',
    red: 'hover:border-[#C53030]/40',
    blue: 'hover:border-[#2B6CB0]/40',
  }[variant];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-3.5 sm:p-4 md:p-5 border border-[#EBE4D5] shadow-xs transition-all duration-200 overflow-hidden min-w-0 flex flex-col justify-between ${borderAccentStyles} ${
        onClick ? 'cursor-pointer active:scale-[0.99] hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2.5 min-w-0">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-xs md:text-sm font-semibold text-gray-500 tracking-wide truncate" title={title}>
            {title}
          </p>
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span 
              className="text-lg sm:text-xl md:text-2xl font-black text-[#16402C] tracking-tight truncate leading-tight" 
              title={String(value)}
            >
              {value}
            </span>
            {unit && (
              <span className="text-xs md:text-sm font-bold text-gray-500 shrink-0">
                {unit}
              </span>
            )}
          </div>
        </div>

        <div className={`p-2 sm:p-2.5 md:p-3 rounded-xl border shrink-0 ${iconBgStyles}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </div>
      </div>

      <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-[#F2ECE1] flex items-center justify-between gap-1.5 min-w-0 text-[11px] sm:text-xs">
        <span className="text-gray-600 truncate flex-1 min-w-0 font-medium" title={subtitle}>
          {subtitle}
        </span>
        {trend && (
          <span
            className={`font-bold shrink-0 px-2 py-0.5 rounded-md text-[10px] sm:text-xs border ${
              trend.isPositive 
                ? 'text-[#1B4D35] bg-[#EAF5EE] border-[#C5E3D0]' 
                : 'text-[#9E2A2B] bg-[#FDF2F2] border-[#F8C8C8]'
            }`}
          >
            {trend.text}
          </span>
        )}
      </div>
    </div>
  );
};
