import { useState } from 'react';
import { 
  Layers, 
  Droplets, 
  DollarSign, 
  Receipt, 
  TrendingUp, 
  CalendarClock, 
  Plus, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  Flame, 
  Users,
  ChevronDown,
  ChevronUp,
  BarChart3,
  AlertTriangle,
  Circle
} from 'lucide-react';
import type { 
  FarmSummary, 
  MilkRecord, 
  FinancialRecord, 
  ReminderTask, 
  NavigationTab,
  BiogasDailyLog,
  Employee,
  AttendanceRecord
} from '../../types/farm';
import { StatCard } from '../common/StatCard';
import { MilkTrendChart, IncomeExpenseChart } from '../common/Charts';

interface DashboardViewProps {
  summary: FarmSummary;
  milkRecords: MilkRecord[];
  financialRecords?: FinancialRecord[];
  reminders: ReminderTask[];
  biogasLogs: BiogasDailyLog[];
  employees?: Employee[];
  attendanceRecords?: AttendanceRecord[];
  isLiveCloud?: boolean;
  onNavigate: (tab: NavigationTab) => void;
  onOpenAddMilk: () => void;
  onOpenAddExpense: () => void;
  onOpenAddCow: () => void;
  onOpenAddTask: () => void;
  onToggleTask: (taskId: string) => void;
}

export const DashboardView = ({
  summary,
  milkRecords,
  financialRecords = [],
  reminders,
  biogasLogs,
  employees = [],
  attendanceRecords = [],
  onNavigate,
  onOpenAddMilk,
  onOpenAddExpense,
  onOpenAddCow,
  onOpenAddTask,
  onToggleTask,
}: DashboardViewProps) => {
  // Dynamically compute activities from actual farm records
  const dynamicActivities = [];
  if (milkRecords.length > 0) {
    const latestMilk = milkRecords[0];
    dynamicActivities.push({
      id: `milk-${latestMilk.id}`,
      title: `দুধ সংগ্রহ: ${latestMilk.totalLiters} লিটার`,
      time: latestMilk.date,
      category: 'milk',
      detail: `সকাল: ${latestMilk.morningLiters} লিটার, বিকাল: ${latestMilk.eveningLiters} লিটার (${latestMilk.recordedBy || 'খামার রেকর্ড'})`,
      icon: Droplets,
      iconColor: 'text-[#2A7A50] bg-[#EAF5EE]',
    });
  }
  if (financialRecords && financialRecords.length > 0) {
    const latestFin = financialRecords[0];
    dynamicActivities.push({
      id: `fin-${latestFin.id}`,
      title: `${latestFin.title}`,
      time: latestFin.date,
      category: latestFin.type,
      detail: `৳ ${latestFin.amount.toLocaleString('en-US')} (${latestFin.categoryLabelBn})`,
      icon: latestFin.type === 'income' ? DollarSign : Receipt,
      iconColor: latestFin.type === 'income' ? 'text-[#1B4D35] bg-[#EAF5EE]' : 'text-[#9E2A2B] bg-[#FDF2F2]',
    });
  }
  if (biogasLogs.length > 0) {
    const latestBio = biogasLogs[0];
    dynamicActivities.push({
      id: `bio-${latestBio.id}`,
      title: `বায়োগ্যাস দৈনিক লগ: ${latestBio.statusBn}`,
      time: latestBio.date,
      detail: `গোবর: ${latestBio.dungInputKg} কেজি, চাপ: ${latestBio.gasPressurePsi ?? 2} PSI`,
      icon: Flame,
      iconColor: 'text-[#936709] bg-[#FEF9E7]',
    });
  }

  const recentActivities = dynamicActivities;
  const pendingReminders = reminders.filter((r) => !r.completed).slice(0, 3);
  const latestBiogas = biogasLogs[0];
  const [showFullChartsOnMobile, setShowFullChartsOnMobile] = useState(false);

  return (
    <div className="pb-24 md:pb-12">
      {/* ========================================================
          MOBILE FOCUSED VIEW (< md) - বাবার জন্য সহজ ও পরিচ্ছন্ন খামার মোড
          ======================================================== */}
      <div className="md:hidden space-y-4">
        {/* 1. Mobile Greeting & Date Header */}
        <div className="bg-linear-to-r from-[#16402C] to-[#25603E] text-white p-4.5 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between text-[11px] text-[#E5B842] font-semibold mb-1">
            <span>🌾 মুমিন এগ্রো</span>
            <span>আজ: ১০ অক্টোবর ২০২৬</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            আসসালামু আলাইকুম, মুমিনুল ইসলাম
          </h2>
          <p className="text-xs text-white/80 mt-1">
            {summary.todayMilkLiters > 0 
              ? `আজকের মোট দুধ উৎপাদন ${summary.todayMilkLiters} লিটার লিপিবদ্ধ হয়েছে।`
              : 'আজকের খামার কার্যক্রম সহজে পরিচালনা করতে নিচের বাটন চাপুন।'}
          </p>
        </div>

        {/* 2. Today's Two Big Primary Action Buttons (Thumb Zone) */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold text-gray-700 px-1">আজকের হিসাব লিখুন:</p>
          
          {/* Big Milk Button */}
          <button
            onClick={onOpenAddMilk}
            className="w-full p-4 rounded-2xl bg-linear-to-r from-[#16402C] via-[#1B4D35] to-[#23583C] text-white flex items-center justify-between shadow-md active:scale-98 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
                <Droplets className="w-6 h-6 text-[#E5B842]" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-base text-white leading-tight">
                  দুধের হিসাব লিখুন
                </h3>
                <p className="text-xs text-[#E5B842] mt-0.5 font-medium">
                  সকাল বা বিকালের দোয়ানো দুধ জমা দিন
                </p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 group-hover:translate-x-0.5 transition-transform">
              <ArrowRight className="w-5 h-5 text-[#E5B842]" />
            </div>
          </button>

          {/* Big Expense / Income Button */}
          <button
            onClick={onOpenAddExpense}
            className="w-full p-4 rounded-2xl bg-white border-2 border-[#16402C]/20 hover:border-[#16402C] text-[#16402C] flex items-center justify-between shadow-xs active:scale-98 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#9E2A2B]/10 flex items-center justify-center shrink-0 border border-[#9E2A2B]/20">
                <Receipt className="w-6 h-6 text-[#9E2A2B]" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-base text-gray-900 leading-tight">
                  আয় বা খরচ লিখুন
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                  দুধ বিক্রির টাকা জমা বা খামারের দৈনিক খরচ
                </p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#FAF7F0] flex items-center justify-center text-[#16402C] shrink-0 group-hover:translate-x-0.5 transition-transform border border-[#E8DFC9]">
              <ArrowRight className="w-5 h-5 text-[#16402C]" />
            </div>
          </button>

          {/* Secondary 2 shortcuts */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onOpenAddCow}
              className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E8DFC9] hover:bg-[#F2ECE1] text-[#16402C] flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#2A7A50]" />
              <span>নতুন গরু যোগ</span>
            </button>

            <button
              onClick={onOpenAddTask}
              className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E8DFC9] hover:bg-[#F2ECE1] text-[#8C6200] flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer"
            >
              <CalendarClock className="w-4 h-4 text-[#8C6200]" />
              <span>নতুন কাজ / অনুস্মারক</span>
            </button>
          </div>
        </div>

        {/* 3. Today's 3 Vital Big Stat Cards on Mobile */}
        <div className="space-y-2 pt-2">
          <p className="text-xs font-bold text-gray-700 px-1">আজকের খামার সংক্ষেপ:</p>
          <div className="grid grid-cols-3 gap-2">
            {/* Milk */}
            <div 
              onClick={() => onNavigate('milk')}
              className="p-3 rounded-2xl bg-white border border-[#EAE2D0] shadow-xs text-center cursor-pointer active:bg-[#FAF7F0]"
            >
              <div className="w-7 h-7 rounded-lg bg-[#2A7A50]/10 text-[#2A7A50] flex items-center justify-center mx-auto mb-1">
                <Droplets className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-gray-500 font-medium">আজকের দুধ</p>
              <p className="text-base font-bold text-[#16402C] mt-0.5">
                {summary.todayMilkLiters} <span className="text-[10px] font-normal">লি.</span>
              </p>
            </div>

            {/* Income */}
            <div 
              onClick={() => onNavigate('finance')}
              className="p-3 rounded-2xl bg-white border border-[#EAE2D0] shadow-xs text-center cursor-pointer active:bg-[#FAF7F0]"
            >
              <div className="w-7 h-7 rounded-lg bg-[#E5B842]/20 text-[#8C6200] flex items-center justify-center mx-auto mb-1">
                <DollarSign className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-gray-500 font-medium">আজকের আয়</p>
              <p className="text-base font-bold text-[#16402C] mt-0.5">
                ৳{summary.todayIncomeTk.toLocaleString('en-US')}
              </p>
            </div>

            {/* Total Cows */}
            <div 
              onClick={() => onNavigate('cows')}
              className="p-3 rounded-2xl bg-white border border-[#EAE2D0] shadow-xs text-center cursor-pointer active:bg-[#FAF7F0]"
            >
              <div className="w-7 h-7 rounded-lg bg-[#16402C]/10 text-[#16402C] flex items-center justify-center mx-auto mb-1">
                <Layers className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-gray-500 font-medium">মোট গরু</p>
              <p className="text-base font-bold text-[#16402C] mt-0.5">
                {summary.totalCows} <span className="text-[10px] font-normal">টি</span>
              </p>
            </div>
          </div>
        </div>

        {/* 4. Urgent Pending Tasks on Mobile (if any) */}
        {pendingReminders.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>আজকের বাকি কাজ ({summary.pendingTasksCount}টি)</span>
              </div>
              <button
                onClick={() => onNavigate('reminders')}
                className="text-[11px] font-bold text-amber-800 hover:underline cursor-pointer"
              >
                সব দেখুন
              </button>
            </div>
            <div className="space-y-1.5">
              {pendingReminders.slice(0, 2).map((task) => (
                <div
                  key={task.id}
                  onClick={() => onToggleTask(task.id)}
                  className="p-2.5 rounded-xl bg-white border border-amber-200/80 flex items-center justify-between text-xs cursor-pointer active:bg-amber-100/50"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <Circle className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-semibold text-gray-800 truncate">{task.title}</span>
                  </div>
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-md shrink-0">
                    {task.dueDate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Recent Farm Activities on Mobile (Top 3) */}
        <div className="p-4 rounded-2xl bg-white border border-[#EAE2D0] shadow-xs space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <span className="font-bold text-xs text-[#16402C]">সর্বশেষ খামার খাতা</span>
            <span className="text-[11px] text-gray-400">সাম্প্রতিক কার্যক্রম</span>
          </div>
          {recentActivities.length === 0 ? (
            <p className="text-xs text-gray-400 py-2 text-center">এখনো কোনো এন্ট্রি লেখা হয়নি</p>
          ) : (
            <div className="divide-y divide-gray-100 space-y-1">
              {recentActivities.map((act) => {
                const Icon = act.icon;
                return (
                  <div key={act.id} className="pt-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg ${act.iconColor} shrink-0`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-gray-800 truncate">{act.title}</p>
                        <p className="text-[10px] text-gray-500">{act.detail}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium shrink-0 ml-2">{act.time}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 6. Collapsible Deep Stats & Charts on Mobile */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowFullChartsOnMobile(!showFullChartsOnMobile)}
            className="w-full p-3.5 rounded-2xl bg-white hover:bg-[#FAF7F0] border border-[#EAE2D0] text-[#16402C] font-bold text-xs flex items-center justify-between shadow-xs transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#2A7A50]" />
              <span>
                {showFullChartsOnMobile
                  ? 'গ্রাফ ও বিস্তারিত পরিসংখ্যান লুকান'
                  : '📊 বিস্তারিত চার্ট ও বায়োগ্যাস/কর্মী হিসাব দেখুন'}
              </span>
            </div>
            {showFullChartsOnMobile ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {showFullChartsOnMobile && (
            <div className="mt-4 space-y-4 animate-in fade-in duration-200">
              {/* Month Expense and Profit */}
              <div className="grid grid-cols-2 gap-2.5">
                <StatCard
                  title="মাসের খরচ"
                  value={`৳${summary.monthExpensesTk.toLocaleString('en-US')}`}
                  subtitle="খাদ্য, বেতন ও ঔষধ"
                  icon={Receipt}
                  variant="red"
                  onClick={() => onNavigate('finance')}
                />
                <StatCard
                  title="মাসিক নিট লাভ"
                  value={`৳${summary.estimatedMonthProfitTk.toLocaleString('en-US')}`}
                  subtitle="হাতে থাকা নিট লাভ"
                  icon={TrendingUp}
                  variant="green"
                  onClick={() => onNavigate('reports')}
                />
              </div>

              {/* Charts */}
              <div className="space-y-4">
                <MilkTrendChart records={milkRecords} />
                <IncomeExpenseChart
                  monthIncome={summary.monthIncomeTk}
                  monthExpenses={summary.monthExpensesTk}
                  estimatedProfit={summary.estimatedMonthProfitTk}
                />
              </div>

              {/* Biogas & Employees */}
              <div className="space-y-3">
                {latestBiogas && (
                  <div className="p-4 bg-white rounded-2xl border border-[#EAE2D0] text-xs">
                    <span className="font-bold text-gray-800 block mb-1">বায়োগ্যাস প্ল্যান্টের অবস্থা</span>
                    <p className="text-gray-600">গোবর: {latestBiogas.dungInputKg} কেজি • গ্যাস: {latestBiogas.burnHoursToday} ঘণ্টা</p>
                  </div>
                )}
                <div className="p-4 bg-white rounded-2xl border border-[#EAE2D0] text-xs">
                  <span className="font-bold text-gray-800 block mb-1">কর্মচারী ও আজকের হাজিরা</span>
                  <p className="text-gray-600">মোট কর্মী: {employees.length} জন • আজকের উপস্থিতি: {attendanceRecords.filter(a => a.status === 'present').length} জন</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          DESKTOP FULL VIEW (hidden on mobile, visible on md+)
          ======================================================== */}
      <div className="hidden md:block space-y-6">
        {/* Hero Welcome & Quick Action Bar */}
        <div className="bg-linear-to-r from-[#16402C] via-[#1B4D35] to-[#226141] rounded-3xl p-5 md:p-7 text-white shadow-md relative overflow-hidden">
          {/* Subtle decorative background shape */}
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-[#E5B842] border border-white/15 mb-2">
              <span>🌾 মুমিন এগ্রো ড্যাশবোর্ড</span>
              <span>•</span>
              <span>১০ অক্টোবর ২০২৬</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              আসসালামু আলাইকুম, মুমিনুল ইসলাম
            </h2>
            <p className="text-sm md:text-base text-white/80 mt-1 max-w-xl">
              {summary.todayMilkLiters > 0 ? (
                <>
                  আজকের খামার কার্যক্রম স্বাভাবিক রয়েছে। সকাল ও বিকালের মোট দুধ উৎপাদন{' '}
                  <strong className="text-[#E5B842] font-bold">{summary.todayMilkLiters} লিটার</strong>{' '}
                  {biogasLogs.length > 0 ? 'এবং বায়োগ্যাস প্ল্যান্ট সচল আছে।' : 'লিপিবদ্ধ হয়েছে।'}
                </>
              ) : (
                <>
                  খামারের প্রতিদিনের দুধ দোয়ানো, ক্রয়-বিক্রয় ও নিয়মিত কার্যক্রম সহজে হিসাব রাখতে উপরের বোতামগুলো ব্যবহার করুন।
                </>
              )}
            </p>
          </div>

          {/* Quick Action Buttons (Large, Touch-Friendly) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <button
              onClick={onOpenAddMilk}
              className="p-3 bg-white text-[#16402C] hover:bg-[#FAF7F0] rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 text-center group"
            >
              <div className="p-2 rounded-xl bg-[#16402C]/10 text-[#16402C] group-hover:scale-105 transition-transform">
                <Droplets className="w-5 h-5 text-[#2A7A50]" />
              </div>
              <span className="text-xs font-bold leading-tight">দুধের হিসাব যোগ</span>
            </button>

            <button
              onClick={onOpenAddExpense}
              className="p-3 bg-white text-[#9E2A2B] hover:bg-[#FAF7F0] rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 text-center group"
            >
              <div className="p-2 rounded-xl bg-[#9E2A2B]/10 text-[#9E2A2B] group-hover:scale-105 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold leading-tight">খরচ যোগ</span>
            </button>

            <button
              onClick={onOpenAddCow}
              className="p-3 bg-white text-[#16402C] hover:bg-[#FAF7F0] rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 text-center group"
            >
              <div className="p-2 rounded-xl bg-[#16402C]/10 text-[#16402C] group-hover:scale-105 transition-transform">
                <Plus className="w-5 h-5 text-[#16402C]" />
              </div>
              <span className="text-xs font-bold leading-tight">নতুন গরু যোগ</span>
            </button>

            <button
              onClick={onOpenAddTask}
              className="p-3 bg-white text-[#8C6200] hover:bg-[#FAF7F0] rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 text-center group"
            >
              <div className="p-2 rounded-xl bg-[#E5B842]/20 text-[#8C6200] group-hover:scale-105 transition-transform">
                <CalendarClock className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold leading-tight">নতুন কাজ যোগ</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Core Farm Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-bold text-base md:text-lg text-[#16402C]">
            আজকের খামারের অবস্থা
          </h3>
          <span className="text-xs text-gray-500">আজকের হালনাগাদ তথ্য</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {/* 1. Total Cows */}
          <StatCard
            title="মোট গরু"
            value={summary.totalCows}
            unit="টি"
            subtitle={
              summary.totalCows > 0
                ? `${summary.milkingCows} দুধাল • ${summary.pregnantCows} গাভীন • ${summary.calvesCount} বাছুর`
                : 'নতুন গরু যোগ করুন'
            }
            icon={Layers}
            variant="green"
            onClick={() => onNavigate('cows')}
          />

          {/* 2. Today's Milk */}
          <StatCard
            title="আজকের দুধ"
            value={summary.todayMilkLiters}
            unit="লিটার"
            subtitle={summary.todayMilkLiters > 0 ? 'দৈনিক মোট সংগ্রহ' : 'আজকের দুধের হিসাব দিন'}
            icon={Droplets}
            variant="cream"
            trend={summary.todayMilkLiters > 0 ? { text: 'আজকের সংগৃহীত', isPositive: true } : undefined}
            onClick={() => onNavigate('milk')}
          />

          {/* 3. Today's Income */}
          <StatCard
            title="আজকের আয়"
            value={`৳${summary.todayIncomeTk.toLocaleString('en-US')}`}
            subtitle="দুধ বিক্রি থেকে জমা"
            icon={DollarSign}
            variant="gold"
            trend={summary.todayIncomeTk > 0 ? { text: 'নগদ জমা', isPositive: true } : undefined}
            onClick={() => onNavigate('finance')}
          />

          {/* 4. Monthly Expenses */}
          <StatCard
            title="মাসের খরচ"
            value={`৳${summary.monthExpensesTk.toLocaleString('en-US')}`}
            subtitle="খাদ্য, বেতন ও ঔষধ বাবদ"
            icon={Receipt}
            variant="red"
            onClick={() => onNavigate('finance')}
          />

          {/* 5. Estimated Monthly Profit */}
          <StatCard
            title="মাসিক নিট লাভ"
            value={`৳${summary.estimatedMonthProfitTk.toLocaleString('en-US')}`}
            subtitle="হাতে থাকা নিট লাভ"
            icon={TrendingUp}
            variant="green"
            trend={summary.estimatedMonthProfitTk > 0 ? { text: 'লাভজনক', isPositive: true } : undefined}
            onClick={() => onNavigate('reports')}
          />

          {/* 6. Pending Tasks */}
          <StatCard
            title="বাকি কাজ"
            value={summary.pendingTasksCount}
            unit="টি"
            subtitle="টিকা ও খামারের কাজ"
            icon={CalendarClock}
            variant="blue"
            trend={summary.pendingTasksCount > 0 ? { text: 'জরুরি', isPositive: false } : undefined}
            onClick={() => onNavigate('reminders')}
          />
        </div>
      </div>

      {/* Charts Section: Milk Trend + Income vs Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        <MilkTrendChart records={milkRecords} />
        <IncomeExpenseChart
          monthIncome={summary.monthIncomeTk}
          monthExpenses={summary.monthExpensesTk}
          estimatedProfit={summary.estimatedMonthProfitTk}
        />
      </div>

      {/* Operational Highlights: Biogas & Employee Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {latestBiogas ? (
          <div className="bg-white rounded-2xl p-5 border border-[#EBE4D5] shadow-xs flex flex-col justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-[#E5B842]/20 text-[#8C6200] border border-[#E5B842]/30 shrink-0">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base text-[#16402C]">বায়োগ্যাস প্ল্যান্টের অবস্থা</h4>
                  <span className="text-xs bg-[#EAF5EE] text-[#1B4D35] px-2.5 py-0.5 rounded-full font-bold border border-[#C5E3D0]">
                    {latestBiogas.statusBn}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  আজকে গোবর দেওয়া হয়েছে: <strong>{latestBiogas.dungInputKg} কেজি</strong> • দৈনিক গ্যাস জ্বলেছে: <strong>{latestBiogas.burnHoursToday} ঘণ্টা</strong> • জৈব সার: <strong>{latestBiogas.slurryProducedBags} বস্তা</strong>
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#F2ECE1] flex justify-end">
              <button
                onClick={() => onNavigate('biogas')}
                className="px-3.5 py-1.5 bg-[#FAF7F0] hover:bg-[#F2ECE1] text-[#16402C] font-semibold text-xs rounded-xl border border-[#E8DFC9] flex items-center gap-1.5 transition-colors"
              >
                <span>বায়োগ্যাস বিস্তারিত</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 border border-[#EBE4D5] shadow-xs flex items-center justify-between gap-4 text-xs text-gray-500">
            <span>আজকের বায়োগ্যাস হিসাব দেওয়া হয়নি</span>
            <button
              onClick={() => onNavigate('biogas')}
              className="text-[#16402C] font-bold hover:underline"
            >
              হিসাব লিখুন
            </button>
          </div>
        )}

        {/* Employee & Attendance Overview */}
        <div className="bg-white rounded-2xl p-5 border border-[#EBE4D5] shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-[#16402C]/10 text-[#16402C] border border-[#16402C]/20 shrink-0">
              <Users className="w-6 h-6 text-[#16402C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base text-[#16402C]">খামারের কর্মী ও আজকের হাজিরা</h4>
                <span className="text-xs bg-[#EAF5EE] text-[#1B4D35] px-2.5 py-0.5 rounded-full font-bold border border-[#C5E3D0]">
                  {employees.filter((e) => !e.isArchived && e.status === 'active').length} জন কর্মরত
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                আজকের হাজিরা: <strong>{attendanceRecords.filter((a) => a.status === 'present').length} জন উপস্থিত</strong> • মোট কর্মী: <strong>{employees.length} জন</strong>
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#F2ECE1] flex justify-end">
            <button
              onClick={() => onNavigate('employees')}
              className="px-3.5 py-1.5 bg-[#FAF7F0] hover:bg-[#F2ECE1] text-[#16402C] font-semibold text-xs rounded-xl border border-[#E8DFC9] flex items-center gap-1.5 transition-colors"
            >
              <span>কর্মীদের তালিকা ও হাজিরা</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Farm Activities & Upcoming Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        {/* Recent Farm Activity */}
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-[#EBE4D5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#F2ECE1]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#16402C]" />
                <h4 className="font-bold text-base md:text-lg text-[#16402C]">
                  সাম্প্রতিক কার্যক্রমের খাতা
                </h4>
              </div>
              <span className="text-xs text-gray-400">সর্বশেষ আপডেট</span>
            </div>

            {recentActivities.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                🌾 এখনো কোনো কার্যক্রম লিপিবদ্ধ করা হয়নি। নতুন দুধের হিসাব বা খরচ যোগ করলে এখানে দেখতে পাবেন।
              </div>
            ) : (
              <div className="divide-y divide-[#F4EFE2] mt-2">
                {recentActivities.map((act) => {
                  const Icon = act.icon;
                  return (
                    <div key={act.id} className="py-3.5 flex items-start gap-3">
                      <div className={`p-2 rounded-xl shrink-0 ${act.iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs md:text-sm font-bold text-gray-900 truncate">
                            {act.title}
                          </p>
                          <span className="text-[11px] text-gray-400 shrink-0">{act.time}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{act.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#F2ECE1] mt-2">
            <button
              onClick={() => onNavigate('milk')}
              className="w-full py-2.5 rounded-xl bg-[#FAF7F0] hover:bg-[#F2ECE1] text-[#16402C] text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>সকল দুধ ও আয়-ব্যয়ের হিসাব দেখুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Upcoming Reminders & Tasks */}
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-[#EBE4D5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#F2ECE1]">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-[#C53030]" />
                <h4 className="font-bold text-base md:text-lg text-[#16402C]">
                  আসন্ন জরুরি কাজ ও টিকা
                </h4>
              </div>
              <span className="text-xs font-bold bg-[#FDF2F2] text-[#9E2A2B] px-2 py-0.5 rounded-full border border-[#F8C8C8]">
                {pendingReminders.length} টি বাকি
              </span>
            </div>

            <div className="space-y-3 mt-3">
              {pendingReminders.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  সব কাজ সম্পন্ন হয়েছে! কোনো কাজ বাকি নেই।
                </div>
              ) : (
                pendingReminders.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl border border-[#EBE3D0] bg-[#FAF7F0] flex items-start justify-between gap-3 transition-colors hover:border-[#16402C]/30"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#16402C]">
                          {task.title}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                          task.priority === 'high'
                            ? 'bg-[#FDF2F2] text-[#9E2A2B] border border-[#F8C8C8]'
                            : 'bg-[#FEF9E7] text-[#936709] border border-[#F7E2A9]'
                        }`}>
                          {task.priorityBn}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{task.description}</p>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 pt-1">
                        <span>তারিখ: <strong>{task.dueDate}</strong></span>
                        <span>•</span>
                        <span>দায়িত্বে: {task.assignedTo}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="p-2 rounded-xl text-gray-400 hover:text-[#2A7A50] hover:bg-[#EAF5EE] transition-colors"
                      title="কাজটি সম্পন্ন করুন"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#F2ECE1] mt-4 flex items-center justify-between gap-2">
            <button
              onClick={onOpenAddTask}
              className="py-2.5 px-4 rounded-xl bg-[#FAF7F0] hover:bg-[#F2ECE1] text-[#16402C] text-xs md:text-sm font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4 text-[#E5B842]" />
              <span>নতুন কাজ যোগ</span>
            </button>

            <button
              onClick={() => onNavigate('reminders')}
              className="py-2.5 px-4 rounded-xl text-[#16402C] hover:underline text-xs md:text-sm font-semibold flex items-center gap-1"
            >
              <span>সকল কাজের তালিকা দেখুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
