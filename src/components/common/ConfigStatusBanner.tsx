import { Database, Cloud, CloudOff, LogIn, LogOut, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

interface ConfigStatusBannerProps {
  onOpenAuth: () => void;
  onOpenSetup: () => void;
}

export const ConfigStatusBanner = ({
  onOpenAuth,
  onOpenSetup,
}: ConfigStatusBannerProps) => {
  const { user, isConfigured, isDemoMode, signOut } = useAuth();

  // If user is authenticated to real cloud database
  if (isConfigured && user && !isDemoMode) {
    return (
      <div className="bg-[#EAF5EE] border-b border-[#C5E3D0] px-4 py-2 text-xs text-[#1B4D35] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-[#2A7A50] shrink-0" />
          <span className="font-semibold">
            ক্লাউড ডেটাবেজ সক্রিয়: <strong>{user.email}</strong> • সকল হিসাব Supabase-এ সংরক্ষিত হচ্ছে।
          </span>
        </div>

        <button
          onClick={() => void signOut()}
          className="px-2.5 py-1 rounded-lg bg-white border border-[#C5E3D0] hover:bg-gray-50 text-xs font-bold text-[#16402C] flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5 text-[#C53030]" />
          লগআউট
        </button>
      </div>
    );
  }

  // If Supabase credentials are missing or in Demo Mode
  return (
    <div className="bg-[#FEF9E7] border-b border-[#F7E2A9] px-4 py-2 text-xs text-[#8C6200] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <CloudOff className="w-4 h-4 text-[#936709] shrink-0" />
        <div>
          <span className="font-bold">নমুনা তথ্য — Demo Mode:</span>{' '}
          <span className="text-gray-700">
            {!isConfigured
              ? 'ক্লাউড ডেটাবেজ এখনো সংযুক্ত হয়নি (.env ফাইলে Supabase URL দিন)।'
              : 'বর্তমানে আপনি অফলাইন নমুনা তথ্য দেখছেন। আসল ক্লাউড ডেটায় কাজ করতে লগইন করুন।'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
        <button
          onClick={onOpenSetup}
          className="px-2.5 py-1 rounded-lg bg-white border border-[#E8DFC9] hover:bg-gray-50 text-[11px] font-bold text-[#8C6200] flex items-center gap-1 transition-colors shadow-2xs"
        >
          <KeyRound className="w-3.5 h-3.5 text-[#936709]" />
          {!isConfigured ? 'সেটআপ গাইড' : 'সংযোগ তথ্য'}
        </button>

        {isConfigured ? (
          <button
            onClick={onOpenAuth}
            className="px-2.5 py-1 rounded-lg bg-[#16402C] hover:bg-[#123323] text-white text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
          >
            <LogIn className="w-3.5 h-3.5 text-[#E5B842]" />
            খামার লগইন
          </button>
        ) : (
          <button
            onClick={onOpenSetup}
            className="px-2.5 py-1 rounded-lg bg-[#16402C] hover:bg-[#123323] text-white text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
          >
            <Database className="w-3.5 h-3.5 text-[#E5B842]" />
            ডেটাবেজ সংযুক্ত করুন
          </button>
        )}
      </div>
    </div>
  );
};
