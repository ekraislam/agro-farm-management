import { useState, type FormEvent } from 'react';
import { 
  KeyRound, 
  X, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Sprout, 
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';

interface FarmPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSetupGuide?: () => void;
}

export const FarmPinModal = ({
  isOpen,
  onClose,
}: FarmPinModalProps) => {
  const { unlockFarm, farmEmail, isConfigured, setDemoMode } = useAuth();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('অনুগ্রহ করে খামারের পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    if (!isConfigured) {
      setError('Supabase ক্লাউড ডেটাবেজ ক্রেডেনশিয়াল এখনো কনফিগার করা হয়নি। .env ফাইল পরীক্ষা করুন।');
      return;
    }

    setLoading(true);
    const res = await unlockFarm(password);
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'ভুল পাসওয়ার্ড দেওয়া হয়েছে।');
    }
  };

  const handleUseDemo = () => {
    setDemoMode(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E8DFC9] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-[#16402C] text-white flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-[#E5B842] flex items-center justify-center font-bold">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold">
                মুমিন এগ্রো — খামার আনলক
              </h2>
              <p className="text-xs text-white/80 mt-0.5">আব্বুর ব্যবহারের সহজ ক্লাউড সংযোগ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Sub-header */}
        <div className="p-4 bg-[#FAF7F0] border-b border-[#EAE2D0] text-xs text-[#8C6200] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#2A7A50] shrink-0" />
          <span>
            এই ডিভাইসে একবার পাসওয়ার্ড দিয়ে আনলক করলে পরবর্তীতে প্রতিবার সরাসরি আসল ড্যাশবোর্ড চালু হবে।
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Account indicator */}
          <div className="p-3 rounded-xl bg-[#EAF5EE] border border-[#C5E3D0] text-[#1B4D35] text-xs flex items-center justify-between">
            <span className="font-semibold">খামার অ্যাকাউন্ট:</span>
            <span className="font-mono font-bold text-[11px] truncate max-w-[200px]">{farmEmail}</span>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              খামার পাসওয়ার্ড *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="খামারের পাসওয়ার্ড দিন"
                autoFocus
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-300 text-sm focus:border-[#16402C] focus:ring-1 focus:ring-[#16402C] outline-hidden"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#16402C] hover:bg-[#123323] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>যাচাই করা হচ্ছে...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-[#E5B842]" />
                  <span>খামার আনলক করুন</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleUseDemo}
              className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>নমুনা তথ্য দেখতে ডেমো মোড ব্যবহার করুন</span>
            </button>
          </div>

          {/* Security Guarantee Note */}
          <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#EAE2D0] text-[11px] text-gray-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2A7A50] shrink-0 mt-0.5" />
            <p>
              <strong>নিরাপত্তা গ্যারান্টি:</strong> আপনার পাসওয়ার্ড লোকাল স্টোরেজ বা ব্রাউজারে কখনো জমা রাখা হয় না। Supabase-এর এনক্রিপ্টেড সেশনের মাধ্যমে এই ডিভাইসে খামার সুরক্ষিত থাকবে।
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
