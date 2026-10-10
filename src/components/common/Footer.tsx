import { Code2, Heart, ShieldCheck } from 'lucide-react';
import { CowLogo } from './CowLogo';

interface FooterProps {
  farmName?: string;
}

export const Footer = ({ farmName = 'মুমিন এগ্রো' }: FooterProps) => {
  return (
    <footer className="mt-12 border-t border-[#E8DFC9] bg-white/70 backdrop-blur-xs text-gray-600 pb-24 md:pb-8 pt-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
        {/* Left: Branding & Copyright */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="shrink-0">
            <CowLogo size="sm" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <span className="font-bold text-sm text-[#16402C]">
                {farmName}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EAF5EE] text-[#1B4D35] font-semibold border border-[#C5E3D0]">
                খামার ব্যবস্থাপনা
              </span>
            </div>
            <p className="text-xs text-gray-500">
              © ২০২৬ {farmName} • সর্বস্বত্ব সংরক্ষিত
            </p>
          </div>
        </div>

        {/* Center: License */}
        <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-[#FAF7F0] px-3.5 py-1.5 rounded-xl border border-[#EAE2D0]">
          <ShieldCheck className="w-4 h-4 text-[#2A7A50] shrink-0" />
          <span>
            লাইসেন্স: <strong className="font-bold text-[#16402C]">MIT License</strong> (এমআইটি লাইসেন্সের আওতাভুক্ত)
          </span>
        </div>

        {/* Right: Developer Attribution (Ohi in English, rest in Bengali) */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-white px-3.5 py-1.5 rounded-xl border border-[#EAE2D0] shadow-2xs">
          <Code2 className="w-4 h-4 text-[#16402C]" />
          <span>ডিজাইন ও ডেভেলপ করেছেন</span>
          <span className="font-bold text-[#16402C] bg-[#E5B842]/20 px-2 py-0.5 rounded-md text-xs border border-[#E5B842]/40 tracking-wide">
            Ohi
          </span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 ml-0.5" />
        </div>
      </div>
    </footer>
  );
};
