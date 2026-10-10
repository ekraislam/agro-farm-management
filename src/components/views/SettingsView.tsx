import { useState, type FormEvent } from 'react';
import { 
  Settings, 
  RotateCcw, 
  Save, 
  Info,
  Database,
  Cloud,
  ShieldCheck,
  LogIn,
  LogOut,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';

interface SettingsViewProps {
  onResetDemoData: () => void;
  onShowToast: (msg: string) => void;
  onOpenAuth?: () => void;
  onOpenSetup?: () => void;
}

export const SettingsView = ({
  onResetDemoData,
  onShowToast,
  onOpenAuth,
  onOpenSetup,
}: SettingsViewProps) => {
  const { user, isConfigured, isDemoMode, setDemoMode, signOut } = useAuth();
  const [farmName, setFarmName] = useState('মুমিন এগ্রো (Mumin Agro)');
  const [ownerName, setOwnerName] = useState('মো: মুমিনুল হক (আব্বু)');
  const [phone, setPhone] = useState('০১৭XXXXXXXX');
  const [defaultRate, setDefaultRate] = useState('80');
  const [dairyCapacity, setDairyCapacity] = useState('10');
  const [notifications, setNotifications] = useState(true);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    onShowToast('খামারের সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-12 max-w-4xl">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-[#EAE2D0] shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#16402C]/10 text-[#16402C]">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#16402C]">খামার সেটিংস ও তথ্য</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              খামারের সাধারণ তথ্য, দুধের ডিফল্ট বিক্রয় দর ও সিস্টেম নিয়ন্ত্রণ
            </p>
          </div>
        </div>
      </div>

      {/* Cloud Database & Auth Management Card (Phase 2) */}
      <div className="bg-white rounded-3xl border border-[#EAE2D0] p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE1]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#2A7A50]/10 text-[#2A7A50]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg text-[#16402C]">
                ক্লাউড ডেটাবেজ ও মালিকের একাউন্ট (Supabase & RLS)
              </h3>
              <p className="text-xs text-gray-500">
                Phase 2: বহু-ডিভাইস সিঙ্ক্রোনাইজেশন ও সুরক্ষিত প্রমাণীকরণ
              </p>
            </div>
          </div>

          {isConfigured && user && !isDemoMode ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5EE] text-[#1B4D35] text-xs font-bold border border-[#C5E3D0]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2A7A50]" />
              ক্লাউড সক্রিয়
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF9E7] text-[#8C6200] text-xs font-bold border border-[#F7E2A9]">
              ডেমো মোড
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#EAE2D0] space-y-1.5">
            <span className="text-xs font-semibold text-gray-500 block">সংযোগের অবস্থা</span>
            <div className="flex items-center gap-2">
              <Cloud className={`w-4 h-4 ${isConfigured ? 'text-[#2A7A50]' : 'text-gray-400'}`} />
              <span className="text-sm font-bold text-gray-900">
                {isConfigured ? 'Supabase কনফিগারেশন সংযুক্ত' : 'ক্রেডেনশিয়াল অনুপস্থিত (অফলাইন)'}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              {isConfigured
                ? 'পরিবেশ চলক (Environment Variables) সফলভাবে লোড হয়েছে।'
                : 'VITE_SUPABASE_URL এবং VITE_SUPABASE_ANON_KEY প্রয়োজন।'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#EAE2D0] space-y-1.5">
            <span className="text-xs font-semibold text-gray-500 block">বর্তমান ব্যবহারকারী</span>
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 ${user && !isDemoMode ? 'text-[#2A7A50]' : 'text-amber-600'}`} />
              <span className="text-sm font-bold text-gray-900 truncate">
                {user && !isDemoMode ? user.email : 'ডেমো মোড ব্যবহারকারী'}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              {user && !isDemoMode
                ? 'Row Level Security (RLS) সক্রিয় — শুধুমাত্র আপনার খামারের তথ্য সংরক্ষিত।'
                : 'কাল্পনিক ডেমো তথ্য প্রদর্শিত হচ্ছে।'}
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          {onOpenSetup && (
            <button
              type="button"
              onClick={onOpenSetup}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-[#16402C] font-bold text-xs border border-[#E2DAC7] flex items-center gap-2 transition-colors shadow-2xs"
            >
              <KeyRound className="w-4 h-4 text-[#936709]" />
              <span>সেটআপ গাইড ও সংযোগ তথ্য</span>
            </button>
          )}

          {isConfigured && user && !isDemoMode ? (
            <>
              <button
                type="button"
                onClick={() => setDemoMode(true)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-[#8C6200] font-bold text-xs border border-[#F7E2A9] flex items-center gap-2 transition-colors shadow-2xs"
              >
                <span>নমুনা ডেমো মোডে যান</span>
              </button>

              <button
                type="button"
                onClick={() => void signOut()}
                className="px-4 py-2.5 rounded-xl bg-[#FEE2E2] hover:bg-[#FECACA] text-[#991B1B] font-bold text-xs border border-[#FCA5A5] flex items-center gap-2 transition-colors shadow-2xs"
              >
                <LogOut className="w-4 h-4" />
                <span>লগআউট করুন</span>
              </button>
            </>
          ) : (
            onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-5 py-2.5 rounded-xl bg-[#16402C] hover:bg-[#123323] text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-2xs"
              >
                <LogIn className="w-4 h-4 text-[#E5B842]" />
                <span>খামার মালিক লগইন / নিবন্ধন</span>
              </button>
            )
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Farm Profile Box */}
        <div className="bg-white rounded-3xl border border-[#EAE2D0] p-5 md:p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-base md:text-lg text-[#16402C] pb-3 border-b border-[#F2ECE1]">
            খামার পরিচিতি
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                খামারের নাম
              </label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                খামার প্রধান / মালিকের নাম
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                যোগাযোগের মোবাইল নম্বর
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                সর্বোচ্চ গাভী ধারণক্ষমতা
              </label>
              <input
                type="number"
                value={dairyCapacity}
                onChange={(e) => setDairyCapacity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm"
              />
            </div>
          </div>
        </div>

        {/* Financial Defaults */}
        <div className="bg-white rounded-3xl border border-[#EAE2D0] p-5 md:p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-base md:text-lg text-[#16402C] pb-3 border-b border-[#F2ECE1]">
            দুধের ডিফল্ট বিক্রয় দর ও নোটিফিকেশন
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                প্রতি লিটার দুধের ডিফল্ট বিক্রয় মূল্য (টাকা)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-gray-500 font-bold text-sm">৳</span>
                <input
                  type="number"
                  value={defaultRate}
                  onChange={(e) => setDefaultRate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0]">
              <div className="space-y-0.5">
                <span className="font-bold text-sm text-gray-900 block">দৈনিক অনুস্মারক নোটিফিকেশন</span>
                <span className="text-xs text-gray-500 block">টিকা ও দুধ দোয়ানোর সময়ে মনে করিয়ে দেওয়া</span>
              </div>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="w-5 h-5 accent-[#16402C] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-[#16402C] hover:bg-[#123323] text-white font-bold text-sm shadow-xs flex items-center gap-2 transition-all active:scale-95"
          >
            <Save className="w-4 h-4 text-[#E5B842]" />
            <span>পরিবর্তন সংরক্ষণ করুন</span>
          </button>
        </div>
      </form>

      {/* Demo Data Management Card */}
      <div className="bg-[#FEF9E7] border border-[#F7E2A9] rounded-3xl p-5 md:p-6 shadow-xs space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#936709] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm md:text-base text-gray-900">
                নমুনা তথ্য নিয়ন্ত্রণ (Demo Data Management)
              </h4>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                কাল্পনিক নমুনা তথ্যের ওপর ভিত্তি করে খামারের ইন্টারফেস পরীক্ষা করা যায়। আসল ক্লাউড ডেটাবেজে সংরক্ষিত রেকর্ড নমুনা তথ্যের রিসেট দ্বারা কখনোই প্রভাবিত হবে না।
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onResetDemoData}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-[#8C6200] font-bold text-xs border border-[#F7E2A9] flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs"
          >
            <RotateCcw className="w-4 h-4 text-[#8C6200]" />
            <span>নমুনা তথ্য রিসেট</span>
          </button>
        </div>
      </div>
    </div>
  );
};

