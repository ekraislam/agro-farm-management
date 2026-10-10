import { useState } from 'react';
import { 
  KeyRound, 
  X, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle 
} from 'lucide-react';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPin: string;
  onSavePin: (newPin: string) => void;
}

export const ChangePinModal = ({
  isOpen,
  onClose,
  currentPin = '1234',
  onSavePin,
}: ChangePinModalProps) => {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const actualCurrentPin = currentPin || '1234';

    if (oldPin !== actualCurrentPin) {
      setError('বর্তমান পিন কোডটি সঠিক নয়। অনুগ্রহ করে সঠিক পিন দিন।');
      return;
    }

    if (newPin.length !== 4) {
      setError('নতুন পিন কোডটি অবশ্যই ৪ ডিজিটের হতে হবে।');
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setError('পিন কোডে শুধুমাত্র সংখ্যা (০-৯) ব্যবহার করুন।');
      return;
    }

    if (newPin !== confirmPin) {
      setError('নতুন পিন কোড ও নিশ্চিতকরণ পিন কোড মেলেনি।');
      return;
    }

    onSavePin(newPin);
    // Reset fields & close
    setOldPin('');
    setNewPin('');
    setConfirmPin('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-linear-to-r from-[#16402C] to-[#25603E] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/15 text-[#E5B842] border border-white/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg">গোপন পিন কোড পরিবর্তন</h3>
              <p className="text-xs text-white/80 mt-0.5">খামার ডেটা সুরক্ষার ৪ ডিজিট পিন আপডেট করুন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Show/Hide Toggle */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowPins(!showPins)}
              className="text-xs font-semibold text-[#16402C] hover:text-[#2A7A50] flex items-center gap-1.5 cursor-pointer select-none"
            >
              {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPins ? 'পিন লুকান' : 'পিন দেখুন'}</span>
            </button>
          </div>

          {/* 1. Old PIN */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              বর্তমান পিন কোড (ডিফল্ট: ১২৩৪) *
            </label>
            <input
              type={showPins ? 'text' : 'password'}
              maxLength={4}
              inputMode="numeric"
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="বর্তমান ৪ ডিজিটের পিন"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] focus:ring-1 focus:ring-[#16402C] outline-hidden text-sm bg-white font-mono tracking-widest font-bold"
              required
            />
          </div>

          {/* 2. New PIN */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              নতুন ৪ ডিজিটের পিন কোড *
            </label>
            <input
              type={showPins ? 'text' : 'password'}
              maxLength={4}
              inputMode="numeric"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="নতুন ৪ ডিজিটের পিন (যেমন: ৫৫৭৭)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] focus:ring-1 focus:ring-[#16402C] outline-hidden text-sm bg-white font-mono tracking-widest font-bold text-emerald-800"
              required
            />
          </div>

          {/* 3. Confirm New PIN */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              নতুন পিন কোড পুনরায় লিখুন (নিশ্চিতকরণ) *
            </label>
            <input
              type={showPins ? 'text' : 'password'}
              maxLength={4}
              inputMode="numeric"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="একই ৪ ডিজিটের পিন আবার দিন"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] focus:ring-1 focus:ring-[#16402C] outline-hidden text-sm bg-white font-mono tracking-widest font-bold text-emerald-800"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#16402C] hover:bg-[#123323] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4 text-[#E5B842]" />
              <span>পিন পরিবর্তন সম্পন্ন করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
