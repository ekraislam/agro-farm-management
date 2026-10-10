import { Code2, Heart } from 'lucide-react';
import { CowLogo } from './CowLogo';

interface FooterProps {
  farmName?: string;
}

export const Footer = ({ farmName = 'মুমিন এগ্রো' }: FooterProps) => {
  return (
    <footer className="mt-8 border-t border-[#E8DFC9] bg-white/80 backdrop-blur-xs text-gray-600 pb-20 md:pb-6 pt-5 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        {/* Left: Branding & Copyright */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 w-8 h-8 flex items-center justify-center">
            <CowLogo size={32} rounded="rounded-xl" />
          </div>
          <div className="space-y-0.5 min-w-0 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-[#16402C] truncate max-w-[220px]" title={farmName}>
                {farmName}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EAF5EE] text-[#1B4D35] font-semibold border border-[#C5E3D0] shrink-0">
                খামার ব্যবস্থাপনা
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              © ২০২৬ {farmName} • সর্বস্বত্ব সংরক্ষিত
            </p>
          </div>
        </div>

        {/* Right: Developer Attribution (Ohi in English, rest in Bengali) */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-white px-3.5 py-1.5 rounded-xl border border-[#EAE2D0] shadow-2xs shrink-0">
          <Code2 className="w-3.5 h-3.5 text-[#16402C]" />
          <span>ডিজাইন ও ডেভেলপ করেছেন</span>
          <span className="font-bold text-[#16402C] bg-[#E5B842]/20 px-2 py-0.5 rounded-md text-xs border border-[#E5B842]/40 tracking-wide">
            Ohi
          </span>
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500 ml-0.5" />
        </div>
      </div>
    </footer>
  );
};
