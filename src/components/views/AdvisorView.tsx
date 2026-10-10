import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  RotateCcw, 
  ExternalLink, 
  ShieldAlert, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  HelpCircle
} from 'lucide-react';
import type { 
  FinancialRecord, 
  MilkRecord, 
  Cow, 
  HealthRecord, 
  Employee, 
  AttendanceRecord, 
  BiogasDailyLog, 
  BiogasInspectionItem, 
  ReminderTask,
  NavigationTab
} from '../../types/farm';
import type { AiChatMessage } from '../../types/aiAdvisor';
import { buildFarmAdvisorContext } from '../../utils/farmAdvisorContext';
import { aiAdvisorService } from '../../services/aiAdvisorService';
import { useAuth } from '../../context/useAuth';
import { generateId, getTimestampIso } from '../../utils/id';

interface AdvisorViewProps {
  financialRecords?: FinancialRecord[];
  milkRecords?: MilkRecord[];
  cows?: Cow[];
  healthRecords?: HealthRecord[];
  employees?: Employee[];
  attendanceRecords?: AttendanceRecord[];
  biogasLogs?: BiogasDailyLog[];
  biogasInspections?: BiogasInspectionItem[];
  reminders?: ReminderTask[];
  onNavigate: (tab: NavigationTab) => void;
}

const DEFAULT_SUGGESTIONS = [
  'এই মাসে খামারের মোট আয় আর খরচ কত?',
  'গত মাসের তুলনায় এই মাসে দুধ কম উৎপাদন হয়েছে কি?',
  'কোন খাতে সবচেয়ে বেশি টাকা খরচ হচ্ছে?',
  'কোন গরুর টিকা দেওয়ার তারিখ সামনে?',
  'কোন কর্মীর কোন কাজ বাকি আছে?',
  'গত ৭ দিনে কত কেজি গোবর বায়োগ্যাস প্ল্যান্টে দেওয়া হয়েছে?',
  'খামারের রেকর্ড দেখে খরচ কমানোর কী সুযোগ আছে?',
];

const INITIAL_WELCOME_MESSAGE: AiChatMessage = {
  id: 'msg-welcome-0',
  sender: 'assistant',
  text: 'আসসালামু আলাইকুম! আমি মুমিন এগ্রোর AI সহকারী। খামারের আয়-ব্যয়, দুধের হিসাব, গরুর রেকর্ড, কর্মীদের কাজ ও বায়োগ্যাস লগ বুঝতে সাহায্য করতে পারি। আপনার যেকোনো প্রশ্ন নিচে লিখুন অথবা সাজেস্টেড প্রশ্ন চাপুন।',
  timestamp: '২০২৬-১০-১০T০৬:০০:০০Z',
  evidence: {
    period: 'চলতি মাস',
    relevantView: 'dashboard',
    relevantViewLabelBn: 'ড্যাশবোর্ড ওভারভিউ',
  },
};

export const AdvisorView = ({
  financialRecords = [],
  milkRecords = [],
  cows = [],
  healthRecords = [],
  employees = [],
  attendanceRecords = [],
  biogasLogs = [],
  biogasInspections = [],
  reminders = [],
  onNavigate,
}: AdvisorViewProps) => {
  const { user, isConfigured, isDemoMode } = useAuth();
  const isLiveCloud = Boolean(isConfigured && user && !isDemoMode);

  const [messages, setMessages] = useState<AiChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);

  // Privacy notice state (dismissible)
  const [hasConsented, setHasConsented] = useState<boolean>(() => {
    return sessionStorage.getItem('momin_agro_ai_consent') === 'true';
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleConsent = () => {
    setHasConsented(true);
    sessionStorage.setItem('momin_agro_ai_consent', 'true');
  };

  const handleSend = async (queryToSend?: string) => {
    const rawQuery = (queryToSend !== undefined ? queryToSend : inputText).trim();
    if (!rawQuery || isLoading) return;

    if (rawQuery.length > 500) {
      setErrorMessage('প্রশ্নটি সর্বোচ্চ ৫০০ অক্ষরের মধ্যে সীমাবদ্ধ রাখুন।');
      return;
    }

    setErrorMessage(null);
    setLastFailedQuery(null);

    const nowIso = getTimestampIso();
    const userMessage: AiChatMessage = {
      id: generateId('msg-user'),
      sender: 'user',
      text: rawQuery,
      timestamp: nowIso,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (queryToSend === undefined) {
      setInputText('');
    }
    setIsLoading(true);

    try {
      // 1. Build Scoped & Grounded Farm Context
      const context = buildFarmAdvisorContext({
        query: rawQuery,
        financialRecords,
        milkRecords,
        cows,
        healthRecords,
        employees,
        attendanceRecords,
        biogasLogs,
        biogasInspections,
        reminders,
        userId: user?.id,
        isDemoMode: !isLiveCloud,
      });

      // 2. Query the AI Service
      const result = await aiAdvisorService.askQuestion(user?.id, rawQuery, context);

      if (result.success) {
        const assistantMsg: AiChatMessage = {
          id: generateId('msg-asst'),
          sender: 'assistant',
          text: result.answer,
          timestamp: getTimestampIso(),
          evidence: result.evidence,
          safetyWarning: result.safetyWarning,
          suggestedAction: result.suggestedAction,
          isDemoPreview: result.isDemoPreview ?? !isLiveCloud,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setErrorMessage(result.error || 'AI প্রোভাইডার থেকে উত্তর পাওয়া সম্ভব হয়নি।');
        setLastFailedQuery(rawQuery);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`অনুরোধ প্রক্রিয়াকরণে সমস্যা হয়েছে: ${msg}`);
      setLastFailedQuery(rawQuery);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([INITIAL_WELCOME_MESSAGE]);
    setErrorMessage(null);
    setLastFailedQuery(null);
  };

  const handleRetry = () => {
    if (lastFailedQuery) {
      handleSend(lastFailedQuery);
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-12 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-[#EAE2D0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#16402C] text-[#E5B842] shadow-xs">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl md:text-2xl font-bold text-[#16402C]">
                AI ফার্ম অ্যাডভাইজার
              </h2>
              {isDemoMode ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  ডেমো প্রিভিউ (Demo Preview)
                </span>
              ) : isLiveCloud ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  সংরক্ষিত ক্লাউড ডেটা সংযুক্ত
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-300">
                  অফলাইন মোড
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              মুমিন এগ্রো (Mumin Agro) — আপনার খামারের সংরক্ষিত ডেটা ভিত্তিক নির্ভরযোগ্য বাংলা পরামর্শক
            </p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-[#FAF7F0] hover:bg-[#F2ECE1] text-[#16402C] font-semibold text-xs md:text-sm border border-[#EAE2D0] flex items-center gap-2 shadow-2xs transition-all active:scale-95 cursor-pointer"
          title="নতুন কথোপকথন শুরু করুন"
        >
          <RotateCcw className="w-4 h-4 text-[#16402C]" />
          <span>নতুন আলোচনা</span>
        </button>
      </div>

      {/* Privacy Notice Banner (Collapsible/Dismissible) */}
      {!hasConsented && (
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>গোপনীয়তা ও ডেটা সুরক্ষা বিজ্ঞপ্তি:</strong> আপনার প্রশ্নের নির্ভুল উত্তরের জন্য খামারের প্রয়োজনীয় সংরক্ষিত হিসাব (যেমন: আয়-ব্যয়, দুধের লিটার) সুরক্ষিতভাবে প্রক্রিয়াকরণ করা হয়। কোনো ফোন নম্বর বা অপ্রয়োজনীয় ব্যক্তিগত তথ্য পাঠানো হয় না।
            </p>
          </div>
          <button
            onClick={handleConsent}
            className="shrink-0 px-4 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer"
          >
            সম্মত আছি
          </button>
        </div>
      )}

      {/* Suggested Question Chips */}
      <div className="bg-white rounded-2xl p-4 border border-[#EAE2D0] shadow-xs">
        <div className="flex items-center gap-2 mb-2.5">
          <HelpCircle className="w-4 h-4 text-[#16402C]" />
          <span className="text-xs font-bold text-[#16402C]">ঝটপট প্রশ্ন করুন (ক্লিক করুন):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_SUGGESTIONS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              disabled={isLoading}
              className="text-left px-3 py-1.5 rounded-xl bg-[#FAF7F0] hover:bg-[#F2ECE1] text-gray-800 text-xs font-medium border border-[#EAE2D0] transition-all hover:border-[#16402C]/40 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Timeline */}
      <div className="bg-white rounded-3xl p-4 md:p-6 border border-[#EAE2D0] shadow-xs min-h-[380px] flex flex-col justify-between space-y-4">
        <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                {/* Bubble Container */}
                <div
                  className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#16402C] text-white shadow-xs rounded-br-xs'
                      : 'bg-[#FAF7F0] text-gray-900 border border-[#EAE2D0] shadow-2xs rounded-bl-xs'
                  }`}
                >
                  {/* Sender Indicator for Assistant */}
                  {!isUser && (
                    <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-[#EAE2D0]">
                      <Sparkles className="w-4 h-4 text-[#E5B842]" />
                      <span className="font-bold text-xs text-[#16402C]">মুমিন এগ্রো AI উপদেষ্টা</span>
                      {msg.isDemoPreview && (
                        <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          নমুনা প্রিভিউ
                        </span>
                      )}
                    </div>
                  )}

                  {/* Message Text with Line Breaks */}
                  <div className="whitespace-pre-wrap font-sans text-xs md:text-sm">
                    {msg.text}
                  </div>

                  {/* Safety Warning Card (if medical or biogas danger triggered) */}
                  {msg.safetyWarning && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-red-800">
                        <ShieldAlert className="w-4 h-4 text-red-600" />
                        <span>{msg.safetyWarning.titleBn}</span>
                      </div>
                      <p className="text-[11px] leading-tight text-red-700">
                        {msg.safetyWarning.messageBn}
                      </p>
                    </div>
                  )}

                  {/* Evidence & Grounding Card ("যে তথ্যের ভিত্তিতে উত্তর") */}
                  {msg.evidence && (
                    <div className="mt-3 pt-2.5 border-t border-[#EAE2D0] text-[11px] text-gray-600 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#16402C]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#16402C]" />
                        <span>যে তথ্যের ভিত্তিতে উত্তর:</span>
                      </div>
                      <div className="pl-5 space-y-0.5">
                        {msg.evidence.period && (
                          <div>• সময়সীমা: <span className="font-medium text-gray-800">{msg.evidence.period}</span></div>
                        )}
                        {msg.evidence.totalsOrCounts && (
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                            {Object.entries(msg.evidence.totalsOrCounts).map(([k, v]) => (
                              <span key={k}>• {k}: <strong>{v}</strong></span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Deep-link to relevant tab */}
                      {msg.evidence.relevantView && (
                        <div className="pt-1.5">
                          <button
                            onClick={() => onNavigate(msg.evidence!.relevantView!)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16402C] hover:underline cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-[#EAE2D0]"
                          >
                            <span>{msg.evidence.relevantViewLabelBn || 'সংশ্লিষ্ট পাতা দেখুন'}</span>
                            <ExternalLink className="w-3 h-3 text-[#16402C]" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-gray-400 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 p-4 bg-[#FAF7F0] border border-[#EAE2D0] rounded-2xl w-fit animate-pulse">
              <Sparkles className="w-4 h-4 text-[#E5B842] animate-spin" />
              <span className="text-xs font-semibold text-[#16402C]">
                খামারের রেকর্ড যাচাই করে উত্তর তৈরি করা হচ্ছে...
              </span>
            </div>
          )}

          {/* Recoverable Error Banner with Retry */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              {lastFailedQuery && (
                <button
                  onClick={handleRetry}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shrink-0 cursor-pointer transition-all active:scale-95"
                >
                  পুনরায় চেষ্টা করুন
                </button>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="pt-2 border-t border-[#EAE2D0]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                maxLength={500}
                placeholder="যেমন: এই মাসের মোট আয় ও খরচ কত? বা দুধের হিসাব বলুন..."
                disabled={isLoading}
                className="w-full pl-4 pr-16 py-3 bg-[#FAF7F0] border border-[#D5CBB5] rounded-2xl text-xs md:text-sm text-[#16402C] placeholder-gray-400 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#16402C] focus:bg-white transition-all disabled:opacity-60"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                {inputText.length}/500
              </span>
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="px-5 py-3 rounded-2xl bg-[#16402C] hover:bg-[#123323] text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed touch-target shrink-0"
              title="প্রশ্ন পাঠান"
            >
              <Send className="w-4 h-4 text-[#E5B842]" />
              <span className="hidden sm:inline">পাঠান</span>
            </button>
          </form>
          <p className="text-[10px] text-gray-400 mt-1.5 text-center">
            মুমিন এগ্রো AI খামার সহকারী — তথ্য বিশ্লেষণী পরামর্শ। চিকিৎসাজনিত প্রয়োজনে সর্বদা রেজিস্টার্ড পশু চিকিৎসকের শরণাপন্ন হোন।
          </p>
        </div>
      </div>
    </div>
  );
};
