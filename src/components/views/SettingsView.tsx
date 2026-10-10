import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { 
  Settings, 
  RotateCcw, 
  Save, 
  LogOut, 
  KeyRound, 
  CheckCircle2,
  Download,
  Upload,
  HardDrive
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { localFarmStorage } from '../../services/localFarmStorage';

interface SettingsViewProps {
  onResetDemoData: () => void;
  onLoadSampleData?: () => void;
  onShowToast: (msg: string) => void;
  onOpenAuth?: () => void;
  onOpenSetup?: () => void;
  onImportBackup?: (jsonString: string) => boolean;
}

export const SettingsView = ({
  onResetDemoData,
  onLoadSampleData,
  onShowToast,
  onOpenAuth,
  onImportBackup,
}: SettingsViewProps) => {
  const { user, isConfigured, isDemoMode, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [farmName, setFarmName] = useState('মুমিন এগ্রো (Mumin Agro)');
  const [ownerName, setOwnerName] = useState('মো: মোমিনুল ইসলাম');
  const [phone, setPhone] = useState('০১৭XXXXXXXX');
  const [defaultRate, setDefaultRate] = useState('80');
  const [dairyCapacity, setDairyCapacity] = useState('10');
  const [notifications, setNotifications] = useState(true);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    onShowToast('খামারের সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
  };

  const handleDownloadBackup = () => {
    try {
      const backupJson = localFarmStorage.exportBackup();
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().split('T')[0];
      const a = document.createElement('a');
      a.href = url;
      a.download = `momin-agro-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onShowToast('খামারের ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে!');
    } catch {
      onShowToast('ব্যাকআপ ডাউনলোড করতে সমস্যা হয়েছে');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      if (onImportBackup) {
        onImportBackup(content);
      } else {
        const ok = localFarmStorage.importBackup(content);
        if (ok) {
          onShowToast('ব্যাকআপ সফলভাবে রিস্টোর হয়েছে!');
          window.location.reload();
        } else {
          onShowToast('ব্যাকআপ ফাইলটি সঠিক নয়!');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-12 max-w-4xl">
      {/* Sleek Modern Settings Header & Mode Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#EAE2D0]">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#16402C] flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#16402C]/10 text-[#16402C]">
              <Settings className="w-5 h-5" />
            </div>
            <span>খামার সেটিংস ও তথ্য</span>
          </h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            মালিকানা বিবরণ, দুধের ডিফল্ট দর ও ব্যাকআপ সংরক্ষণ
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAF5EE] text-[#1B4D35] text-xs font-bold border border-[#C5E3D0]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2A7A50]" />
            {isConfigured && user && !isDemoMode ? 'ক্লাউড ডেটাবেজ সক্রিয়' : 'অফলাইন মেমোরি সক্রিয়'}
          </span>

          {isConfigured && user && !isDemoMode ? (
            <button
              type="button"
              onClick={() => void signOut()}
              className="px-3 py-1.5 rounded-xl bg-[#FEE2E2] hover:bg-[#FECACA] text-[#991B1B] font-bold text-xs border border-[#FCA5A5] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>লগআউট</span>
            </button>
          ) : (
            onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs border border-[#E2DAC7] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
              >
                <KeyRound className="w-3 h-3 text-gray-500" />
                <span>ক্লাউড লিঙ্ক</span>
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

      {/* Farm Data Backup & Restore Card */}
      <div className="bg-white border border-[#EAE2D0] rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE1]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#16402C]/10 text-[#16402C]">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-base md:text-lg text-[#16402C]">
                খামার ব্যাকআপ ও ডেটা সংরক্ষণ (Backup & Restore)
              </h4>
              <p className="text-xs text-gray-500">
                খামারের সমস্ত হিসাবের ফাইল ডাউনলোড করে পেনড্রাইভ বা ফোনে সুরক্ষিত রাখুন
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#EAE2D0] space-y-2">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-[#2A7A50]" />
              <span className="text-sm font-bold text-gray-900">ব্যাকআপ ফাইল ডাউনলোড</span>
            </div>
            <p className="text-xs text-gray-600">
              গরু, দুধের বিক্রি, আয়-ব্যয় এবং বায়োগ্যাসের সকল রেকর্ড একটি সুরক্ষিত JSON ফাইলে নামিয়ে নিন।
            </p>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="mt-2 w-full px-4 py-2.5 rounded-xl bg-[#16402C] hover:bg-[#123323] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#E5B842]" />
              <span>খামার ব্যাকআপ ডাউনলোড করুন</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#EAE2D0] space-y-2">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#8C6200]" />
              <span className="text-sm font-bold text-gray-900">ব্যাকআপ থেকে রিস্টোর</span>
            </div>
            <p className="text-xs text-gray-600">
              আগের ডাউনলোড করা ব্যাকআপ ফাইল নির্বাচন করে সমস্ত হিসাব এক ক্লিকে ফেরত আনুন।
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 w-full px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-[#16402C] border border-[#D5C9AF] font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#936709]" />
              <span>ব্যাকআপ ফাইল নির্বাচন ও রিস্টোর</span>
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-[#F2ECE1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            খামার নতুন করে শুরু করতে বা ডেমো দেখার জন্য নিচের বোতামগুলো ব্যবহার করুন।
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {onLoadSampleData && (
              <button
                type="button"
                onClick={onLoadSampleData}
                className="px-3.5 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#F2ECE1] text-[#16402C] text-xs font-semibold border border-[#E8DFC9] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>নমুনা ডেমো ডেটা লোড</span>
              </button>
            )}
            <button
              type="button"
              onClick={onResetDemoData}
              className="px-4 py-2 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-700 text-xs font-semibold border border-gray-200 hover:border-red-200 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>সব ডেটা মুছে পরিষ্কার করুন</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

