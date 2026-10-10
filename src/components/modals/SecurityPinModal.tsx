import { useState } from 'react';
import { 
  Lock, 
  AlertTriangle, 
  X, 
  Trash2
} from 'lucide-react';
import { englishToBanglaDigits } from '../../utils/accounting';

interface SecurityPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  expectedPin?: string;
  onDownloadEmergencyBackup: () => void;
  farmName?: string;
}

export const SecurityPinModal = ({
  isOpen,
  onClose,
  onConfirm,
  expectedPin = '1234',
  onDownloadEmergencyBackup,
  farmName = 'মুমিন এগ্রো',
}: SecurityPinModalProps) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shouldDownloadBackup, setShouldDownloadBackup] = useState(false);

  if (!isOpen) return null;

  const handleDigitClick = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const handleVerifyAndReset = () => {
    if (pin.length !== 4) {
      setError('অনুগ্রহ করে ৪ ডিজিটের সম্পূর্ণ পিন কোড দিন');
      return;
    }

    const currentExpectedPin = expectedPin || '1234';
    if (pin !== currentExpectedPin) {
      setError('ভুল পিন কোড! সঠিক ৪ ডিজিটের পিন কোড দিয়ে পুনরায় চেষ্টা করুন।');
      return;
    }

    setIsProcessing(true);
    try {
      // Optional backup if checked
      if (shouldDownloadBackup) {
        onDownloadEmergencyBackup();
      }

      // Execute wipe
      onConfirm();
      onClose();
    } catch {
      setError('ডেটা খালি করার প্রক্রিয়ায় সমস্যা হয়েছে।');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-red-100 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-linear-to-r from-red-600 to-rose-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/15 text-white border border-white/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg">নিরাপত্তা পিন কোড যাচাই</h3>
              <p className="text-xs text-white/80 mt-0.5">খামারের ডেটা খালি করার সর্বোচ্চ সুরক্ষা</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 md:p-6 space-y-4">
          {/* High Danger Warning */}
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-red-800">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>সতর্কতা: খামারের সকল তথ্য স্থায়ীভাবে মুছে যাবে!</span>
            </div>
            <p className="text-[11px] text-red-700 leading-relaxed">
              <strong>{farmName}</strong>-এর গাভী, দুধের খতিয়ান, আয়-ব্যয় এবং স্বাস্থ্য রেকর্ড সম্পূর্ণ শূন্য হয়ে যাবে। কোনো ভুল ক্লিক যাতে ক্ষতি করতে না পারে, সেজন্য পিন যাচাই বাধ্যতামূলক।
            </p>
          </div>

          {/* Optional Backup Checkbox (Default: OFF) */}
          <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-700 text-xs cursor-pointer select-none hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={shouldDownloadBackup}
              onChange={(e) => setShouldDownloadBackup(e.target.checked)}
              className="w-4 h-4 accent-[#16402C] cursor-pointer"
            />
            <span className="text-[11px] font-medium text-gray-700">
              মোছার পূর্বে ব্যাকআপ ফাইল ডাউনলোড করুন (ঐচ্ছিক)
            </span>
          </label>

          {/* 4 Digit PIN Display */}
          <div className="text-center space-y-2 pt-1">
            <label className="block text-xs font-bold text-gray-700">
              আপনার ৪ ডিজিটের গোপন পিন কোড লিখুন:
            </label>
            <div className="flex items-center justify-center gap-3">
              {[0, 1, 2, 3].map((index) => {
                const filled = pin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-12 h-13 rounded-2xl border-2 flex items-center justify-center text-xl font-bold transition-all ${
                      filled
                        ? 'border-red-500 bg-red-50/50 text-red-700 scale-105'
                        : 'border-gray-200 bg-gray-50 text-gray-300'
                    }`}
                  >
                    {filled ? '●' : '—'}
                  </div>
                );
              })}
            </div>
            {error && (
              <p className="text-xs font-bold text-red-600 animate-in fade-in pt-1">
                {error}
              </p>
            )}
            <p className="text-[11px] text-gray-400">
              (ডিফল্ট পিন কোড: <strong>১২৩৪</strong> • সেটিংস থেকে পরিবর্তন করা যায়)
            </p>
          </div>

          {/* Numeric Keypad (Touch Friendly for Mobile/Father) */}
          <div className="grid grid-cols-3 gap-2 pt-2 max-w-xs mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigitClick(digit)}
                className="py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 active:bg-red-100 font-bold text-base text-gray-800 transition-colors shadow-2xs cursor-pointer select-none"
              >
                {englishToBanglaDigits(digit)}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 font-semibold text-xs text-gray-600 transition-colors cursor-pointer select-none"
            >
              মুছুন
            </button>
            <button
              type="button"
              onClick={() => handleDigitClick('0')}
              className="py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 active:bg-red-100 font-bold text-base text-gray-800 transition-colors shadow-2xs cursor-pointer select-none"
            >
              ০
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 font-semibold text-xs text-gray-600 transition-colors cursor-pointer select-none"
            >
              ⌫ ব্যাক
            </button>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
            >
              বাতিল করুন
            </button>
            <button
              type="button"
              onClick={handleVerifyAndReset}
              disabled={pin.length !== 4 || isProcessing}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                pin.length === 4 && !isProcessing
                  ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'ডেটা খালি হচ্ছে...' : 'পিন যাচাই ও খালি করুন'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
