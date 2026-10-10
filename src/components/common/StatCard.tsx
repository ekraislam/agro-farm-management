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
      className={`bg-white rounded-2xl p-4 md:p-5 border border-[#EBE4D5] shadow-xs transition-all duration-200 ${borderAccentStyles} ${
        onClick ? 'cursor-pointer active:scale-[0.99]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs md:text-sm font-medium text-gray-500 tracking-wide">
            {title}
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-bold text-[#16402C] tracking-tight">
              {value}
            </span>
            {unit && (
              <span className="text-xs md:text-sm font-semibold text-gray-500">
                {unit}
              </span>
            )}
          </div>
        </div>

        <div className={`p-2.5 md:p-3 rounded-xl border shrink-0 ${iconBgStyles}`}>
          <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-[#F2ECE1] flex items-center justify-between text-xs md:text-sm">
        <span className="text-gray-600 truncate">{subtitle}</span>
        {trend && (
          <span
            className={`font-medium shrink-0 ml-2 ${
              trend.isPositive ? 'text-[#2A7A50]' : 'text-[#C53030]'
            }`}
          >
            {trend.text}
          </span>
        )}
      </div>
    </div>
  );
};
