import { useState } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  Laptop, 
  Apple, 
  CheckCircle2, 
  WifiOff, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { CowLogo } from '../common/CowLogo';
import type { BeforeInstallPromptEvent } from '../../hooks/usePWAInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
}

export const InstallAppModal = ({
  isOpen,
  onClose,
  deferredPrompt,
  isInstalled
}: InstallAppModalProps) => {
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [isPrompting, setIsPrompting] = useState(false);

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    if (!deferredPrompt) return;
    setIsPrompting(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        onClose();
      }
    } catch {
      // Ignored
    } finally {
      setIsPrompting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF7F0] w-full max-w-lg rounded-3xl border border-[#EAE2D0] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 md:p-6 bg-linear-to-r from-[#16402C] to-[#25603E] text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <CowLogo size={48} rounded="rounded-2xl" className="ring-2 ring-[#E5B842]/40" />
            <div>
              <h3 className="font-bold text-lg md:text-xl text-white flex items-center gap-2">
                <span>মুমিন এগ্রো অ্যাপ ইনস্টল করুন</span>
              </h3>
              <p className="text-xs text-[#E5B842] font-medium mt-0.5">
                স্মার্ট ডেইরি ও বায়োগ্যাস খামার অ্যাপ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-5">
          {/* Direct Install Button if supported */}
          {deferredPrompt && !isInstalled && (
            <div className="p-4 bg-white rounded-2xl border-2 border-[#2A7A50] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <p className="font-bold text-sm text-[#16402C]">
                  সরাসরি এক-ক্লিকে ইনস্টল করুন
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  আপনার ডিভাইসে সরাসরি ডাউনলোড ছাড়াই ইনস্টল হবে
                </p>
              </div>
              <button
                onClick={handleDirectInstall}
                disabled={isPrompting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#16402C] hover:bg-[#123323] text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-[#E5B842]" />
                <span>{isPrompting ? 'ইনস্টল হচ্ছে...' : 'এখনই ইনস্টল করুন'}</span>
              </button>
            </div>
          )}

          {isInstalled && (
            <div className="p-4 bg-[#EAF5EE] rounded-2xl border border-[#C5E3D0] flex items-center gap-3 text-[#1B4D35]">
              <CheckCircle2 className="w-6 h-6 text-[#2A7A50] shrink-0" />
              <div>
                <p className="font-bold text-sm">অ্যাপটি ইতিমধ্যে ইনস্টল করা আছে!</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  আপনি আপনার হোম স্ক্রিন বা অ্যাপ ড্রয়ার থেকে এটি সরাসরি চালু করতে পারবেন।
                </p>
              </div>
            </div>
          )}

          {/* Features Highlights */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white rounded-2xl border border-[#EAE2D0] flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#2A7A50]/10 text-[#2A7A50] shrink-0">
                <WifiOff className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-gray-800">অফলাইনেও চলবে</p>
                <p className="text-[11px] text-gray-500">নেট ছাড়া হিসাব লিখুন</p>
              </div>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-[#EAE2D0] flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#E5B842]/20 text-[#8C6200] shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-gray-800">হোম স্ক্রিন অ্যাপ</p>
                <p className="text-[11px] text-gray-500">সহজে এক ক্লিকে খুলুন</p>
              </div>
            </div>
          </div>

          {/* Device Tabs */}
          <div>
            <div className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
              <span>ইনস্টল করার সহজ নিয়ম নির্বাচন করুন:</span>
            </div>
            <div className="grid grid-cols-3 gap-2 p-1 bg-[#EFE9DC] rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'android'
                    ? 'bg-white text-[#16402C] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-[#2A7A50]" />
                <span>অ্যান্ড্রয়েড</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'ios'
                    ? 'bg-white text-[#16402C] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Apple className="w-3.5 h-3.5 text-gray-800" />
                <span>আইফোন (iOS)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('desktop')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'desktop'
                    ? 'bg-white text-[#16402C] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Laptop className="w-3.5 h-3.5 text-[#16402C]" />
                <span>কম্পিউটার</span>
              </button>
            </div>
          </div>

          {/* Tab Instructions Content */}
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-[#EAE2D0] space-y-3">
            {activeTab === 'android' && (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#16402C] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ১
                  </div>
                  <p className="text-xs md:text-sm text-gray-700">
                    ক্রোম (Chrome) বা স্যামসাং ব্রাউজারের উপরে ডানদিকের <strong>তিনটি ডট (⋮)</strong> মেনুতে চাপ দিন।
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#16402C] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ২
                  </div>
                  <p className="text-xs md:text-sm text-gray-700">
                    মেনু থেকে <strong>"Install app"</strong> অথবা <strong>"Add to Home screen"</strong> (হোম স্ক্রিনে যোগ করুন) বেছে নিন।
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#16402C] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ৩
                  </div>
                  <p className="text-xs md:text-sm text-gray-700">
                    <strong>"Install"</strong> বাটনে চাপ দিন। আপনার ফোনের হোম স্ক্রিনে মুমিন এগ্রো অ্যাপের আইকন যুক্ত হয়ে যাবে!
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'ios' && (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#16402C] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ১
                  </div>
                  <p className="text-xs md:text-sm text-gray-700">
                    আইফোনের সাফারি (Safari) ব্রাউজারের নিচে থাকা <strong>শেয়ার বোতামে (Share icon 📤)</strong> চাপ দিন।
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#16402C] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ২
                  </div>
                  <p className="text-xs md:text-sm text-gray-700">
                    শেয়ার মেনুর একটু নিচের দিকে গিয়ে <strong>"Add to Home Screen"</strong> (হোম স্ক্রিনে যোগ করুন) চাপুন।
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#16402C] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ৩
                  </div>
                  <p className="text-xs md:text-sm text-gray-700">
                    উপরে ডানদিকের <strong>"Add"</strong> বাটনে চাপ দিলেই আপনার আইফোনে অ্যাপটি তৈরি হয়ে যাবে।
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'desktop' && (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#16402C] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ১
                  </div>
                  <p className="text-xs md:text-sm text-gray-700">
                    কম্পিউটারে গুগল ক্রোম বা মাইক্রোসফট এজ ব্রাউজার দিয়ে ওয়েবসাইটটি খুলুন।
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#16402C] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ২
                  </div>
                  <p className="text-xs md:text-sm text-gray-700">
                    ব্রাউজারের অ্যাড্রেস বারের (URL) ডানপাশে <strong>ইনস্টল আইকন (⬇ বা ⊕)</strong> দেখতে পাবেন।
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#16402C] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ৩
                  </div>
                  <p className="text-xs md:text-sm text-gray-700">
                    <strong>"Install"</strong> বাটনে ক্লিক করলে আপনার কম্পিউটারের ডেস্কটপে একটি স্বতন্ত্র সফটওয়্যার অ্যাপ হিসেবে ইনস্টল হবে।
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#EAE2D0] flex justify-between items-center">
          <p className="text-xs text-gray-500">
            মালিক: মুমিনুল ইসলাম
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#F2ECE1] text-[#16402C] font-bold text-xs border border-[#E2DAC7] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>ঠিক আছে</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
