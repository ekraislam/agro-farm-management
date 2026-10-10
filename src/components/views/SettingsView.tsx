import { useState, useEffect, type FormEvent, useRef } from 'react';
import { 
  Settings, 
  Save, 
  LogOut, 
  CheckCircle2,
  Download,
  Smartphone,
  Trash2,
  RotateCcw,
  Upload,
  User,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import type { FarmProfile } from '../../types/farm';
import { localFarmStorage } from '../../services/localFarmStorage';

interface SettingsViewProps {
  farmProfile: FarmProfile;
  onUpdateFarmProfile: (profile: FarmProfile) => Promise<void> | void;
  onResetDemoData: () => void;
  onLoadSampleData?: () => void;
  onShowToast: (msg: string) => void;
  onOpenAuth?: () => void;
  onOpenSetup?: () => void;
  onImportBackup?: (jsonString: string) => boolean;
  onOpenInstall?: () => void;
}

export const SettingsView = ({
  farmProfile,
  onUpdateFarmProfile,
  onResetDemoData,
  onLoadSampleData,
  onShowToast,
  onImportBackup,
  onOpenInstall,
}: SettingsViewProps) => {
  const { user, isConfigured, isDemoMode, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [farmName, setFarmName] = useState(farmProfile?.farmName || 'মুমিন এগ্রো');
  const [ownerName, setOwnerName] = useState(farmProfile?.ownerName || 'মুমিনুল ইসলাম');
  const [phone, setPhone] = useState(farmProfile?.phone || '');
  const [address, setAddress] = useState(farmProfile?.address || 'খামার প্রাঙ্গণ');
  const [defaultRate, setDefaultRate] = useState(String(farmProfile?.defaultMilkRate || 80));
  const [dairyCapacity, setDairyCapacity] = useState(String(farmProfile?.dairyCapacity || 10));
  const [notifications, setNotifications] = useState(farmProfile?.notificationsEnabled ?? true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (farmProfile) {
      setFarmName(farmProfile.farmName || 'মুমিন এগ্রো');
      setOwnerName(farmProfile.ownerName || 'মুমিনুল ইসলাম');
      setPhone(farmProfile.phone || '');
      setAddress(farmProfile.address || 'খামার প্রাঙ্গণ');
      setDefaultRate(String(farmProfile.defaultMilkRate || 80));
      setDairyCapacity(String(farmProfile.dairyCapacity || 10));
      setNotifications(farmProfile.notificationsEnabled ?? true);
    }
  }, [farmProfile]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const updated: FarmProfile = {
      ...farmProfile,
      farmName: farmName.trim() || 'মুমিন এগ্রো',
      ownerName: ownerName.trim() || 'মুমিনুল ইসলাম',
      phone: phone.trim(),
      address: address.trim() || 'খামার প্রাঙ্গণ',
      defaultMilkRate: parseFloat(defaultRate) || 80,
      dairyCapacity: parseInt(dairyCapacity, 10) || 10,
      notificationsEnabled: notifications,
    };

    try {
      await onUpdateFarmProfile(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmReset = () => {
    const confirmed = window.confirm(
      'আপনি কি নিশ্চিত যে সকল ডেমো বা নমুনা তথ্য মুছে খামার সম্পূর্ণ খালি করতে চান?\n\nএর ফলে শুধুমাত্র আপনার নিজের এন্ট্রি করা আসল গরু, দুধ ও খরচের হিসাব সংরক্ষিত থাকবে।'
    );
    if (confirmed) {
      onResetDemoData();
    }
  };

  const handleConfirmLoadDemo = () => {
    const confirmed = window.confirm(
      'আপনি কি পরীক্ষামূলক ডেমো ডেটা লোড করতে চান?\n\nএতে ডেমো গাভী, দুধ উৎপাদন ও আর্থিক হিসাব লোড হবে।'
    );
    if (confirmed && onLoadSampleData) {
      onLoadSampleData();
    }
  };

  const handleDownloadBackup = () => {
    try {
      const backupJson = localFarmStorage.exportBackup();
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `farm_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onShowToast('খামারের সম্পূর্ণ ডেটাবেজ ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে!');
    } catch {
      onShowToast('ব্যাকআপ ডাউনলোড করতে সমস্যা হয়েছে।');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && onImportBackup) {
        const success = onImportBackup(content);
        if (success) {
          onShowToast('ব্যাকআপ ফাইল থেকে সফলভাবে তথ্য পুনরুদ্ধার করা হয়েছে!');
        } else {
          onShowToast('ব্যাকআপ ফাইলটি সঠিক নয় বা তথ্য পড়তে ব্যর্থ হয়েছে।');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-20 md:pb-12 max-w-4xl">
      {/* Settings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#EAE2D0]">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#16402C] flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#16402C]/10 text-[#16402C]">
              <Settings className="w-5 h-5" />
            </div>
            <span>খামার সেটিংস ও মালিকানা পরিবর্তন</span>
          </h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            মালিকের নাম, খামারের নাম পরিবর্তন এবং ডেমো ডেটা ব্যবস্থাপনা
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
          <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE1]">
            <h3 className="font-bold text-base md:text-lg text-[#16402C] flex items-center gap-2">
              <User className="w-5 h-5 text-[#2A7A50]" />
              <span>খামার ও মালিকের পরিচিতি</span>
            </h3>
            <span className="text-[11px] text-[#2A7A50] bg-[#EAF5EE] px-2.5 py-1 rounded-full font-semibold border border-[#C5E3D0]">
              সর্বত্র তাৎক্ষণিক পরিবর্তন হবে
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                খামারের নাম *
              </label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="যেমন: মুমিন এগ্রো"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] focus:ring-1 focus:ring-[#16402C] outline-hidden text-sm bg-white font-semibold"
                required
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                হেডার, রিপোর্ট এবং সকল সনদে এই নামটি দৃশ্যমান হবে
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                খামার প্রধান / মালিকের নাম *
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="যেমন: মুমিনুল ইসলাম"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] focus:ring-1 focus:ring-[#16402C] outline-hidden text-sm bg-white font-semibold"
                required
              />
              <span className="text-[11px] text-[#2A7A50] mt-1 block font-medium">
                মালিক পরিবর্তন করলে ড্যাশবোর্ডের শুভেচ্ছা ও সকল ড্রপডাউনে এই নাম চলে আসবে
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                যোগাযোগের মোবাইল নম্বর
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="যেমন: ০১৭XXXXXXXX"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                খামারের ঠিকানা / অবস্থান
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="যেমন: খামার প্রাঙ্গণ, গ্রাম/উপজেলা"
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

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                প্রতি লিটার দুধের ডিফল্ট বিক্রয় দর (টাকা) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-gray-500 font-bold text-sm">৳</span>
                <input
                  type="number"
                  value={defaultRate}
                  onChange={(e) => setDefaultRate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm font-bold"
                  required
                />
              </div>
              <span className="text-[11px] text-gray-400 mt-1 block">
                নতুন দুধের হিসাব লেখার সময় এই দরটি স্বয়ংক্রিয়ভাবে বসবে
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between p-3.5 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0]">
            <div className="space-y-0.5">
              <span className="font-bold text-sm text-gray-900 block">দৈনিক অনুস্মারক নোটিফিকেশন</span>
              <span className="text-xs text-gray-500 block">টিকা, কৃমিনাশক ও দুধ দোয়ানোর সময়ে মনে করিয়ে দেওয়া</span>
            </div>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="w-5 h-5 accent-[#16402C] cursor-pointer"
            />
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 rounded-2xl bg-[#16402C] hover:bg-[#123323] text-white font-bold text-sm shadow-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4 text-[#E5B842]" />
              <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস ও মালিকানা সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Real Data vs Demo Data Control Card */}
      <div className="bg-white rounded-3xl border border-[#EAE2D0] p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE1]">
          <div>
            <h3 className="font-bold text-base md:text-lg text-[#16402C] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#2A7A50]" />
              <span>আসল খামার বনাম ডেমো ডেটা ব্যবস্থাপনা</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              প্রকল্পের ডেমো বা নমুনা তথ্য সম্পূর্ণ মুছে আপনার নিজের আসল খামারের হিসাব পরিচালনা করুন
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Clear Demo Data */}
          <div className="p-4 rounded-2xl border border-red-200 bg-red-50/50 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="font-bold text-sm text-[#991B1B] flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>সকল ডেমো ডেটা মুছে খামার সম্পূর্ণ খালি করুন</span>
              </h4>
              <p className="text-xs text-red-700/80 mt-1 leading-relaxed">
                ডেমো কর্মী, ডেমো গরু ও কাল্পনিক দুধের হিসাব মুছে যাবে। আপনি শুরু থেকেই আপনার আসল গাভী ও আসল কর্মীদের তালিকা নিজ হাতে যুক্ত করতে পারবেন।
              </p>
            </div>
            <button
              type="button"
              onClick={handleConfirmReset}
              className="w-full px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>সকল ডেমো তথ্য মুছুন (খালি খামার)</span>
            </button>
          </div>

          {/* Load Demo Data */}
          <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="font-bold text-sm text-amber-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-700" />
                <span>প্রয়োজনে নমুনা (ডেমো) ডেটা লোড করুন</span>
              </h4>
              <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">
                অ্যাপটি পরীক্ষা করার জন্য যদি আপনি নমুনা গাভী, দুধের উৎপাদন ও বায়োগ্যাসের কাল্পনিক হিসাব দেখতে চান, তবে এটি ব্যবহার করুন।
              </p>
            </div>
            <button
              type="button"
              onClick={handleConfirmLoadDemo}
              className="w-full px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>নমুনা ডেটা লোড করুন</span>
            </button>
          </div>
        </div>

        {/* Database Backup & Restore */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="font-bold text-xs text-gray-800 block">খামারের হিসাবের নিরাপদ ব্যাকআপ</span>
            <span className="text-[11px] text-gray-500 block">কম্পিউটার বা ফোনে ব্যাকআপ ফাইল ডাউনলোড করে রাখতে পারবেন</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="px-4 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#F2ECE1] text-[#16402C] font-bold text-xs border border-[#E2DAC7] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#2A7A50]" />
              <span>ব্যাকআপ ডাউনলোড</span>
            </button>

            {onImportBackup && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs border border-gray-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-gray-500" />
                  <span>ব্যাকআপ রিস্টোর</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Install Farm App Card */}
      {onOpenInstall && (
        <div className="bg-linear-to-r from-[#16402C] to-[#25603E] text-white rounded-3xl p-5 md:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/10 text-[#E5B842] shrink-0">
              <Smartphone className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-base md:text-lg text-white flex items-center gap-2">
                <span>মোবাইল বা কম্পিউটারে অ্যাপ ইনস্টল করুন</span>
              </h4>
              <p className="text-xs text-white/80 mt-1 leading-relaxed max-w-xl">
                কোনো ইন্টারনেট সংযোগ ছাড়াও আপনার ডিভাইসের হোম স্ক্রিন থেকে সরাসরি {farmName} পরিচালনা করতে পারবেন।
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenInstall}
            className="px-5 py-2.5 rounded-xl bg-[#E5B842] hover:bg-[#D4A32D] text-[#16402C] font-bold text-xs md:text-sm shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>অ্যাপ ইনস্টল করুন</span>
          </button>
        </div>
      )}

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
            আপনার খামারের প্রতিটি গাভী, দুধ বিক্রয় এবং দৈনিক খরচ এই ডিভাইসে সুরক্ষিত থাকে। কোনো ইন্টারনেট সংযোগ ছাড়াও নির্বিঘ্নে খামার পরিচালনা করা যাবে।
          </p>
        </div>
      </div>
    </div>
  );
};
