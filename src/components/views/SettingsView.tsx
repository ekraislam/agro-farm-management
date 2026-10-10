import { useState, type FormEvent } from 'react';
import { 
  Settings, 
  Save, 
  LogOut, 
  CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';

interface SettingsViewProps {
  onResetDemoData: () => void;
  onLoadSampleData?: () => void;
  onShowToast: (msg: string) => void;
  onOpenAuth?: () => void;
  onOpenSetup?: () => void;
  onImportBackup?: (jsonString: string) => boolean;
}

export const SettingsView = ({
  onShowToast,
}: SettingsViewProps) => {
  const { user, isConfigured, isDemoMode, signOut } = useAuth();

  const [farmName, setFarmName] = useState('মুমিন এগ্রো (Mumin Agro)');
  const [ownerName, setOwnerName] = useState('মুমিনুল ইসলাম');
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
      {/* Sleek Modern Settings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#EAE2D0]">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#16402C] flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#16402C]/10 text-[#16402C]">
              <Settings className="w-5 h-5" />
            </div>
            <span>খামার সেটিংস ও তথ্য</span>
          </h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            মালিকানা বিবরণ ও দুধের বিক্রয় দর নির্ধারণ
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAF5EE] text-[#1B4D35] text-xs font-bold border border-[#C5E3D0]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2A7A50]" />
            খামার সক্রিয় (হিসাব সুরক্ষিত)
          </span>

          {isConfigured && user && !isDemoMode && (
            <button
              type="button"
              onClick={() => void signOut()}
              className="px-3 py-1.5 rounded-xl bg-[#FEE2E2] hover:bg-[#FECACA] text-[#991B1B] font-bold text-xs border border-[#FCA5A5] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>লগআউট</span>
            </button>
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
            className="px-6 py-3 rounded-2xl bg-[#16402C] hover:bg-[#123323] text-white font-bold text-sm shadow-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#E5B842]" />
            <span>পরিবর্তন সংরক্ষণ করুন</span>
          </button>
        </div>
      </form>

      {/* Safe Data Guarantee Card */}
      <div className="bg-white border border-[#EAE2D0] rounded-3xl p-5 md:p-6 shadow-xs flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-[#16402C]/10 text-[#16402C] shrink-0">
          <CheckCircle2 className="w-6 h-6 text-[#2A7A50]" />
        </div>
        <div>
          <h4 className="font-bold text-sm md:text-base text-[#16402C]">
            স্বয়ংক্রিয়ভাবে সংরক্ষিত খামার হিসাব
          </h4>
          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
            আপনার খামারের প্রতিটি গাভী, দুধ বিক্রয় এবং দৈনিক খরচ এই ফোনে স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকে। কোনো ইন্টারনেট সংযোগ ছাড়াও নির্বিঘ্নে খামার পরিচালনা করা যাবে।
          </p>
        </div>
      </div>
    </div>
  );
};
