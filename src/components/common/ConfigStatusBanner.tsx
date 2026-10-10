import { Cloud, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

interface ConfigStatusBannerProps {
  onOpenAuth: () => void;
  onOpenSetup: () => void;
}

export const ConfigStatusBanner = ({}: ConfigStatusBannerProps) => {
  const { user, isConfigured, isDemoMode } = useAuth();

  // If user is authenticated to real cloud database
  if (isConfigured && user && !isDemoMode) {
    return (
      <div className="bg-[#EAF5EE] border-b border-[#C5E3D0] px-4 py-2 text-xs text-[#1B4D35] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-[#2A7A50] shrink-0" />
          <span className="font-semibold">
            ক্লাউড ডেটাবেজ সক্রিয়: <strong>মুমিন এগ্রো</strong> • সকল হিসাব Supabase-এ সুরক্ষিতভাবে সংরক্ষিত হচ্ছে।
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline px-2 py-0.5 rounded-md bg-[#2A7A50]/10 text-[#1B4D35] font-bold text-[11px] border border-[#2A7A50]/20">
            রিয়েল-টাইম সিঙ্ক
          </span>
        </div>
      </div>
    );
  }

  // Device Local Persistent Storage (Offline-First for Father's hassle-free daily use)
  return (
    <div className="bg-[#EAF5EE] border-b border-[#C5E3D0] px-4 py-2 text-xs text-[#1B4D35] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-[#2A7A50] shrink-0" />
        <div>
          <span className="font-bold">🌾 খামার ডেটাবেজ সক্রিয়:</span>{' '}
          <span className="text-gray-700">
            খামারের সকল হিসাব এই ডিভাইসে নিরাপদে স্বয়ংক্রিয়ভাবে সংরক্ষিত হচ্ছে।
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
        <span className="px-2.5 py-0.5 rounded-md bg-[#2A7A50]/10 text-[#1B4D35] font-bold text-[11px] border border-[#2A7A50]/20">
          অফলাইন সুরক্ষিত
        </span>
      </div>
    </div>
  );
};
