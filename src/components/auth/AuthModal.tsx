import { useState, type FormEvent } from 'react';
import { 
  LogIn, 
  UserPlus, 
  X, 
  Lock, 
  Mail, 
  AlertCircle, 
  Sprout, 
  Building2, 
  User, 
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSetupGuide: () => void;
}

export const AuthModal = ({
  isOpen,
  onClose,
  onOpenSetupGuide,
}: AuthModalProps) => {
  const { signIn, signUp, isConfigured, setDemoMode } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ownerName, setOwnerName] = useState('মো: মুমিনুল হক');
  const [farmName, setFarmName] = useState('মুমিন এগ্রো');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email.trim() || !password.trim()) {
      setError('অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    if (password.length < 6) {
      setError('পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।');
      return;
    }

    if (!isConfigured) {
      setError('Supabase ক্লাউড ডেটাবেজ ক্রেডেনশিয়াল এখনো কনফিগার করা হয়নি। দয়া করে .env ফাইলে VITE_SUPABASE_URL এবং VITE_SUPABASE_ANON_KEY প্রদান করুন অথবা ডেমো মোড ব্যবহার করুন।');
      return;
    }

    setLoading(true);

    if (mode === 'signin') {
      const res = await signIn(email, password);
      setLoading(false);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'লগইন ব্যর্থ হয়েছে।');
      }
    } else {
      const res = await signUp(email, password, ownerName, farmName);
      setLoading(false);
      if (res.success) {
        if (res.data?.session) {
          onClose();
        } else {
          setSuccessMessage('আপনার খামার একাউন্ট সফলভাবে তৈরি হয়েছে! অনুগ্রহ করে আপনার ইমেইল ইনবক্স বা স্প্যাম ফোল্ডারে পাঠানো নিশ্চিতকরণ (verification) লিংকে ক্লিক করুন। নিশ্চিত করার পর নিচের বাটনে ক্লিক করে লগইন করুন।');
        }
      } else {
        setError(res.error || 'নিবন্ধন ব্যর্থ হয়েছে।');
      }
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
                {mode === 'signin' ? 'খামার মালিক লগইন' : 'নতুন খামার একাউন্ট নিবন্ধন'}
              </h2>
              <p className="text-xs text-white/80 mt-0.5">মুমিন এগ্রো — ক্লাউড ডেটাবেজ এক্সেস</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggle Mode Bar */}
        <div className="p-4 bg-[#FAF7F0] border-b border-[#EAE2D0]">
          <div className="grid grid-cols-2 gap-2 p-1 bg-white rounded-2xl border border-[#E8DFC9]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signin'
                  ? 'bg-[#16402C] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LogIn className="w-4 h-4" />
              লগইন করুন
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signup'
                  ? 'bg-[#16402C] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              নতুন নিবন্ধন
            </button>
          </div>
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

          {/* Success Message */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-[#1B4D35] text-xs space-y-2.5">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{successMessage}</span>
              </div>
              {mode === 'signup' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError('');
                  }}
                  className="w-full py-2 px-3 bg-[#16402C] hover:bg-[#123323] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#E5B842]" />
                  ইমেইল নিশ্চিত করেছি, এখন লগইন করুন
                </button>
              )}
            </div>
          )}

          {/* Sign Up extra fields */}
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  খামারের নাম *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="যেমন: মুমিন এগ্রো"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-[#16402C] outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  খামার প্রধান / মালিকের নাম *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="যেমন: মো: মুমিনুল হক"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-[#16402C] outline-hidden"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ইমেইল ঠিকানা *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farm.owner@example.com"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-[#16402C] outline-hidden"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              পাসওয়ার্ড (ন্যূনতম ৬ অক্ষর) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-[#16402C] outline-hidden"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-[#16402C] hover:bg-[#123323] text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mode === 'signin' ? (
              <>
                <LogIn className="w-4 h-4 text-[#E5B842]" />
                লগইন করুন
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 text-[#E5B842]" />
                নতুন একাউন্ট খুলুন
              </>
            )}
          </button>

          {/* Demo Mode Button */}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <button
              type="button"
              onClick={handleUseDemo}
              className="w-full py-2.5 px-4 rounded-xl bg-[#FAF7F0] hover:bg-[#F2ECE1] text-[#16402C] font-semibold text-xs border border-[#E8DFC9] flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-[#E5B842]" />
              লগইন ছাড়াই নমুনা তথ্য দেখুন (Explore Demo Mode)
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSetupGuide();
              }}
              className="w-full py-2 text-center text-[11px] text-[#2A7A50] hover:underline flex items-center justify-center gap-1 font-medium"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Supabase ক্লাউড ডেটাবেজ কীভাবে যুক্ত করবেন?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
