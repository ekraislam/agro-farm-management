import React from 'react';
import { X, Database, KeyRound, Terminal, CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react';
import { getSupabaseConfigStatus } from '../../lib/supabase';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const configStatus = getSupabaseConfigStatus();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E8DFC9] flex flex-col">
        {/* Header */}
        <div className="p-5 md:p-6 bg-[#16402C] text-white flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 text-[#E5B842]">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold">Supabase ক্লাউড ডেটাবেজ সংযোগ গাইড</h2>
              <p className="text-xs text-white/80 mt-0.5">Mumin Agro — Phase 2 & 3 সেটআপ নির্দেশিকা</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Box */}
        <div className="p-5 md:p-6 space-y-5">
          <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
            configStatus.isConfigured
              ? 'bg-[#EAF5EE] border-[#C5E3D0] text-[#1B4D35]'
              : 'bg-[#FEF9E7] border-[#F7E2A9] text-[#8C6200]'
          }`}>
            <div className="p-2 rounded-xl bg-white/80 shrink-0">
              {configStatus.isConfigured ? (
                <CheckCircle2 className="w-5 h-5 text-[#2A7A50]" />
              ) : (
                <KeyRound className="w-5 h-5 text-[#936709]" />
              )}
            </div>
            <div className="text-xs md:text-sm">
              <p className="font-bold">
                {configStatus.isConfigured
                  ? 'Supabase ক্রেডেনশিয়াল সংযুক্ত রয়েছে'
                  : 'ক্লাউড ক্রেডেনশিয়াল এখনো অনুপস্থিত (Demo Mode সক্রিয়)'}
              </p>
              <p className="text-gray-700 mt-1">
                {configStatus.reason ||
                  `বর্তমান Project URL: ${configStatus.url || 'কোনো URL দেওয়া হয়নি'}`}
              </p>
            </div>
          </div>

          {/* 4 Setup Steps */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm md:text-base text-[#16402C] flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#2A7A50]" />
              কীভাবে আপনার আসল Supabase প্রজেক্ট যুক্ত করবেন:
            </h3>

            {/* Step 1 */}
            <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#EAE2D0] space-y-1.5 text-xs md:text-sm">
              <div className="flex items-center justify-between font-bold text-[#16402C]">
                <span>১. বিনামূল্যে Supabase একাউন্ট ও প্রজেক্ট তৈরি করুন</span>
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#2A7A50] hover:underline flex items-center gap-1"
                >
                  supabase.com <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-gray-600">
                Supabase ড্যাশবোর্ডে গিয়ে একটি নতুন প্রজেক্ট তৈরি করুন (যেমন: <code>mumin-agro-dairy</code>)।
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#EAE2D0] space-y-1.5 text-xs md:text-sm">
              <span className="font-bold text-[#16402C] block">
                ২. ডেটাবেজ স্কিমা মাইগ্রেশন রান করুন
              </span>
              <p className="text-gray-600">
                Supabase প্রজেক্টের <strong>SQL Editor</strong>-এ গিয়ে প্রজেক্টের মাইগ্রেশন ফাইলটি চালান:
              </p>
              <code className="block bg-white p-2 rounded-xl border border-gray-200 text-[11px] font-mono text-[#16402C]">
                supabase/migrations/20261010000000_initial_schema.sql
              </code>
              <p className="text-[11px] text-gray-500">
                * এটি সব ৭টি টেবিল, সূচক (indexes) এবং Row Level Security (RLS) সুরক্ষা সক্রিয় করবে।
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#EAE2D0] space-y-1.5 text-xs md:text-sm">
              <span className="font-bold text-[#16402C] block">
                ৩. প্রজেক্টের API কী সংগ্রহ ও <code>.env</code> ফাইল তৈরি করুন
              </span>
              <p className="text-gray-600">
                Supabase <strong>Settings &gt; API</strong> থেকে <code>Project URL</code> এবং <code>anon public key</code> কপি করুন। এরপর প্রজেক্ট রুট ফোল্ডারে <code>.env</code> ফাইল তৈরি করুন:
              </p>
              <div className="bg-[#1A281F] text-gray-100 p-3 rounded-xl text-xs font-mono space-y-1">
                <p className="text-emerald-400">VITE_SUPABASE_URL=https://your-project.supabase.co</p>
                <p className="text-emerald-400">VITE_SUPABASE_ANON_KEY=eyJhbGciOi...anon-key...</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#EAE2D0] space-y-1.5 text-xs md:text-sm">
              <span className="font-bold text-[#16402C] block">
                ৪. ডেভেলপমেন্ট সার্ভার রিস্টার্ট করুন
              </span>
              <p className="text-gray-600">
                টার্মিনালে <code>npm run dev</code> পুনরায় চালান। এরপর ইমেইল ও পাসওয়ার্ড দিয়ে সরাসরি খামার একাউন্ট খুলতে পারবেন!
              </p>
            </div>
          </div>

          {/* Security Guarantee */}
          <div className="p-3.5 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0] flex items-center gap-2.5 text-xs text-gray-600">
            <ShieldCheck className="w-5 h-5 text-[#2A7A50] shrink-0" />
            <span>
              <strong>নিরাপত্তা সতর্কতা:</strong> কোনো অবস্থাতেই <code>service_role key</code> বা ডেটাবেজ পাসওয়ার্ড ফ্রন্টএন্ড কোডে দেওয়া যাবে না। শুধুমাত্র নিরাপদ Public Anon Key ব্যবহারযোগ্য।
            </span>
          </div>

          {/* Footer Close Button */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-[#16402C] hover:bg-[#123323] text-white font-bold text-xs shadow-xs"
            >
              বুঝেছি, বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
