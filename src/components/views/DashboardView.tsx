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
  Info,
  Users
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
  // Recent farm activities combining milk records, expenses, and biogas
  const recentActivities = [
    {
      id: 'act-1',
      title: 'আজকের বিকালের দুধ দোয়ানো ও সংগ্রহ সম্পন্ন',
      time: 'আজ বিকাল ৫:১৫',
      category: 'milk',
      detail: '৩৩.০ লিটার সংগ্রহ (রহিম উদ্দিন)',
      icon: Droplets,
      iconColor: 'text-[#2A7A50] bg-[#EAF5EE]',
    },
    {
      id: 'act-2',
      title: 'আজকের বায়োগ্যাস ডাইজেস্টারে গোবর ও পানি ইনপুট সম্পন্ন',
      time: 'আজ দুপুর ১২:৩০',
      category: 'biogas',
      detail: '১১০ কেজি গোবর + ১১০ লিটার পানি মিশ্রণ (করিম হাসান)',
      icon: Flame,
      iconColor: 'text-[#936709] bg-[#FEF9E7]',
    },
    {
      id: 'act-3',
      title: 'আজকের দুধ বিক্রির নগদ টাকা জমা',
      time: 'আজ সকাল ১০:০০',
      category: 'income',
      detail: '৳ ৫,৯৬০ নগদ প্রাপ্তি',
      icon: DollarSign,
      iconColor: 'text-[#1B4D35] bg-[#EAF5EE]',
    },
    {
      id: 'act-4',
      title: 'পশুখাদ্য ক্রয় (গমের ভুসি ও সরিষার খৈল)',
      time: '০৮ অক্টোবর',
      category: 'expense',
      detail: '৳ ৯,২০০ বিকাশ পেমেন্ট (ভাই ভাই ফিড)',
      icon: Receipt,
      iconColor: 'text-[#9E2A2B] bg-[#FDF2F2]',
    },
  ];

  const pendingReminders = reminders.filter((r) => !r.completed).slice(0, 3);
  const latestBiogas = biogasLogs[0];

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      {/* Demo Notice Banner (Prominent & Clear) */}
      <div className="bg-[#FEF9E7] border border-[#F7E2A9] rounded-2xl p-3 md:p-4 flex items-center justify-between gap-3 text-xs md:text-sm text-[#8C6200]">
        <div className="flex items-center gap-2.5">
          <Info className="w-5 h-5 shrink-0 text-[#936709]" />
          <div>
            <span className="font-bold">নমুনা তথ্য প্রদর্শিত (Demo Data):</span>{' '}
            <span className="text-gray-700">
              অ্যাপ্লিকেশনের কার্যকারিতা প্রদর্শনের জন্য কাল্পনিক তথ্য ব্যবহার করা হয়েছে। নতুন হিসাব যোগ করতে উপরের বোতামগুলো ব্যবহার করুন।
            </span>
          </div>
        </div>
        <span className="hidden sm:inline-block px-2.5 py-1 bg-white rounded-lg text-xs font-bold text-[#8C6200] border border-[#E8DFC9] shrink-0">
          ১-১০ গাভী সংস্করণ
        </span>
      </div>

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
              আসসালামু আলাইকুম, আব্বু
            </h2>
            <p className="text-sm md:text-base text-white/80 mt-1 max-w-xl">
              আজকের খামার কার্যক্রম স্বাভাবিক রয়েছে। সকাল ও বিকালের মোট দুধ উৎপাদন{' '}
              <strong className="text-[#E5B842] font-bold">{summary.todayMilkLiters} লিটার</strong>{' '}
              এবং বায়োগ্যাস প্ল্যান্ট সচল আছে।
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
            খামারের সার্বিক সারাংশ
          </h3>
          <span className="text-xs text-gray-500">আজকের রিয়েল-টাইম তথ্য</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {/* 1. Total Cows */}
          <StatCard
            title="মোট গরু"
            value={summary.totalCows}
            unit="টি"
            subtitle={`${summary.milkingCows} দুধাল • ${summary.pregnantCows} গাভীন • ${summary.calvesCount} বাছুর`}
            icon={Layers}
            variant="green"
            onClick={() => onNavigate('cows')}
          />

          {/* 2. Today's Milk */}
          <StatCard
            title="আজকের দুধ"
            value={summary.todayMilkLiters}
            unit="লিটার"
            subtitle="সকাল ৪১.৫ + বিকাল ৩৩.০"
            icon={Droplets}
            variant="cream"
            trend={{ text: 'স্থিতিশীল', isPositive: true }}
            onClick={() => onNavigate('milk')}
          />

          {/* 3. Today's Income */}
          <StatCard
            title="আজকের আয়"
            value={`৳${summary.todayIncomeTk.toLocaleString('en-US')}`}
            subtitle="দুধ বিক্রি ও ক্যাশ আদায়"
            icon={DollarSign}
            variant="gold"
            trend={{ text: '+১০০%', isPositive: true }}
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
            subtitle="আনুমানিক উদ্বৃত্ত আয়"
            icon={TrendingUp}
            variant="green"
            trend={{ text: 'লাভজনক', isPositive: true }}
            onClick={() => onNavigate('reports')}
          />

          {/* 6. Pending Tasks */}
          <StatCard
            title="বাকি কাজ"
            value={summary.pendingTasksCount}
            unit="টি"
            subtitle="টিকা ও খাদ্য ব্যবস্থাপনা"
            icon={CalendarClock}
            variant="blue"
            trend={{ text: 'মনোযোগ দিন', isPositive: false }}
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
                  <h4 className="font-bold text-base text-[#16402C]">বায়োগ্যাস প্ল্যান্ট অবস্থা</h4>
                  <span className="text-xs bg-[#EAF5EE] text-[#1B4D35] px-2.5 py-0.5 rounded-full font-bold border border-[#C5E3D0]">
                    {latestBiogas.statusBn}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  আজকের গোবর ইনপুট: <strong>{latestBiogas.dungInputKg} কেজি</strong> • দৈনিক গ্যাস সরবরাহ: <strong>{latestBiogas.burnHoursToday} ঘণ্টা</strong> • সার: <strong>{latestBiogas.slurryProducedBags} বস্তা</strong>
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
            <span>কোনো বায়োগ্যাস লগ নেই</span>
            <button
              onClick={() => onNavigate('biogas')}
              className="text-[#16402C] font-bold hover:underline"
            >
              লগ যোগ করুন
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
                <h4 className="font-bold text-base text-[#16402C]">কর্মচারী ও দৈনিক উপস্থিতি</h4>
                <span className="text-xs bg-[#EAF5EE] text-[#1B4D35] px-2.5 py-0.5 rounded-full font-bold border border-[#C5E3D0]">
                  {employees.filter((e) => !e.isArchived && e.status === 'active').length} জন সক্রিয়
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                আজকের উপস্থিতি রেকর্ড: <strong>{attendanceRecords.filter((a) => a.status === 'present').length} জন উপস্থিত</strong> • মোট নিবন্ধিত কর্মী: <strong>{employees.length} জন</strong>
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#F2ECE1] flex justify-end">
            <button
              onClick={() => onNavigate('employees')}
              className="px-3.5 py-1.5 bg-[#FAF7F0] hover:bg-[#F2ECE1] text-[#16402C] font-semibold text-xs rounded-xl border border-[#E8DFC9] flex items-center gap-1.5 transition-colors"
            >
              <span>কর্মচারী ব্যবস্থাপনা</span>
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
                  সাম্প্রতিক খামার কার্যক্রম
                </h4>
              </div>
              <span className="text-xs text-gray-400">সর্বশেষ আপডেট</span>
            </div>

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
          </div>

          <div className="pt-4 border-t border-[#F2ECE1] mt-2">
            <button
              onClick={() => onNavigate('milk')}
              className="w-full py-2.5 rounded-xl bg-[#FAF7F0] hover:bg-[#F2ECE1] text-[#16402C] text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>সকল দুধ ও আর্থিক কার্যক্রম দেখুন</span>
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
                  আসন্ন কাজ ও স্বাস্থ্য অনুস্মারক
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
              <span>সকল অনুস্মারক দেখুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
