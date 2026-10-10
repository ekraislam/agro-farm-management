import { useState, useMemo } from 'react';
import { 
  FileBarChart, 
  Printer, 
  Download, 
  Calendar, 
  DollarSign, 
  Milk, 
  Stethoscope, 
  Users, 
  Flame, 
  TrendingUp,
  Filter,
  ShieldAlert,
  Info
} from 'lucide-react';
import type { 
  FarmSummary, 
  MilkRecord, 
  FinancialRecord, 
  Cow, 
  HealthRecord, 
  Employee, 
  AttendanceRecord, 
  BiogasDailyLog, 
  BiogasInspectionItem, 
  ReminderTask 
} from '../../types/farm';
import { 
  getReportDateRange, 
  generateFinancialReport, 
  generateMilkReport, 
  generateHealthReport, 
  generateEmployeeReport, 
  generateBiogasReport,
  exportFinancialCsv,
  exportMilkCsv,
  exportHealthCsv,
  exportEmployeeCsv,
  exportBiogasCsv
} from '../../utils/farmReports';
import type { ReportDateRangeType } from '../../utils/farmReports';
import { formatBanglaDate } from '../../utils/accounting';
import { useAuth } from '../../context/useAuth';

interface ReportsViewProps {
  summary: FarmSummary;
  milkRecords: MilkRecord[];
  financialRecords: FinancialRecord[];
  cows?: Cow[];
  healthRecords?: HealthRecord[];
  employees?: Employee[];
  attendanceRecords?: AttendanceRecord[];
  biogasLogs?: BiogasDailyLog[];
  biogasInspections?: BiogasInspectionItem[];
  reminders?: ReminderTask[];
}

type ReportTab = 'financial' | 'milk' | 'health' | 'employees' | 'biogas';

export const ReportsView = ({
  milkRecords = [],
  financialRecords = [],
  cows = [],
  healthRecords = [],
  employees = [],
  attendanceRecords = [],
  biogasLogs = [],
  biogasInspections = [],
  reminders = [],
}: ReportsViewProps) => {
  const { isDemoMode, isConfigured, user } = useAuth();
  const isLiveCloud = Boolean(isConfigured && user && !isDemoMode);
  const [activeTab, setActiveTab] = useState<ReportTab>('financial');
  const [dateRangeType, setDateRangeType] = useState<ReportDateRangeType>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState('2026-10-01');
  const [customEndDate, setCustomEndDate] = useState('2026-10-10');
  const [selectedCowFilter, setSelectedCowFilter] = useState<string>('all');

  // Compute active date range
  const dateRange = useMemo(() => {
    return getReportDateRange(dateRangeType, customStartDate, customEndDate);
  }, [dateRangeType, customStartDate, customEndDate]);

  // Aggregate Reports Data
  const financialReport = useMemo(() => {
    return generateFinancialReport(financialRecords, dateRange);
  }, [financialRecords, dateRange]);

  const milkReport = useMemo(() => {
    return generateMilkReport(milkRecords, cows, dateRange);
  }, [milkRecords, cows, dateRange]);

  const healthReport = useMemo(() => {
    return generateHealthReport(healthRecords, cows, reminders, dateRange);
  }, [healthRecords, cows, reminders, dateRange]);

  const employeeReport = useMemo(() => {
    return generateEmployeeReport(employees, attendanceRecords, financialRecords, dateRange, reminders);
  }, [employees, attendanceRecords, financialRecords, dateRange, reminders]);

  const biogasReport = useMemo(() => {
    return generateBiogasReport(biogasLogs, biogasInspections, dateRange, reminders);
  }, [biogasLogs, biogasInspections, dateRange, reminders]);

  const [generatedDateBn] = useState(() => formatBanglaDate(new Date()));

  // Filtered health events if specific cow selected
  const displayedHealthEvents = useMemo(() => {
    if (selectedCowFilter === 'all') return healthReport.eventsList;
    return healthReport.eventsList.filter((e) => e.cowId === selectedCowFilter);
  }, [healthReport.eventsList, selectedCowFilter]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    switch (activeTab) {
      case 'financial':
        exportFinancialCsv(financialReport.summary.filteredRecords, dateRange.labelBn);
        break;
      case 'milk':
        exportMilkCsv(milkReport.dailyBreakdown, dateRange.labelBn);
        break;
      case 'health':
        exportHealthCsv(displayedHealthEvents, dateRange.labelBn);
        break;
      case 'employees':
        exportEmployeeCsv(employeeReport.employeeSummaries, dateRange.labelBn);
        break;
      case 'biogas':
        exportBiogasCsv(biogasReport.logsList, dateRange.labelBn);
        break;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      {/* Top Banner & Actions (Hidden during print) */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-[#EAE2D0] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#16402C]/10 text-[#16402C]">
            <FileBarChart className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl md:text-2xl font-bold text-[#16402C]">
                খামার স্মার্ট প্রতিবেদন ও অ্যানালিটিক্স
              </h2>
              {isDemoMode && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF5EE] text-[#1B4D35] border border-[#C5E3D0]">
                  খামার ডেটাবেজ (লোকাল)
                </span>
              )}
              {isLiveCloud && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  সংরক্ষিত ক্লাউড ডেটা
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              মুমিন এগ্রো (Mumin Agro) — আয়-ব্যয়, দুধ উৎপাদন, স্বাস্থ্য, কর্মী হাজিরা ও বায়োগ্যাস প্ল্যান্টের সঠিক হিসাব
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-[#FAF7F0] text-[#16402C] font-semibold text-xs md:text-sm border border-[#E8DFC9] flex items-center gap-2 shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="কম্পিউটার বা মোবাইলে খামারের সম্পূর্ণ হিসাব ডাউনলোড করুন"
          >
            <Download className="w-4 h-4 text-[#16402C]" />
            <span>হিসাব ফাইল ডাউনলোড</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-2xl bg-[#16402C] hover:bg-[#123323] text-white font-bold text-xs md:text-sm shadow-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            title="ব্রাউজারের প্রিন্ট ডায়ালগ খুলবে — এখান থেকে প্রিন্ট বা PDF হিসেবে সংরক্ষণ করা যাবে"
          >
            <Printer className="w-4 h-4 text-[#E5B842]" />
            <span>প্রিন্ট / PDF সংরক্ষণ</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector (Hidden during print) */}
      <div className="bg-white rounded-3xl p-5 border border-[#EAE2D0] shadow-xs space-y-4 no-print">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#16402C]" />
            <span className="text-xs md:text-sm font-bold text-[#16402C]">সময়সীমা নির্বাচন করুন:</span>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-[#FAF7F0] text-[#16402C] border border-[#E8DFC9] rounded-xl">
            {dateRange.labelBn}
          </span>
        </div>

        {/* Date Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'today', label: 'আজ' },
            { id: 'last7days', label: 'গত ৭ দিন' },
            { id: 'thisMonth', label: 'চলতি মাস' },
            { id: 'lastMonth', label: 'গত মাস' },
            { id: 'thisYear', label: 'চলতি বছর' },
            { id: 'allTime', label: 'সর্বমোট সময়কাল' },
            { id: 'custom', label: 'নির্দিষ্ট তারিখ...' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setDateRangeType(item.id as ReportDateRangeType)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                dateRangeType === item.id
                  ? 'bg-[#16402C] text-white shadow-xs'
                  : 'bg-[#FAF7F0] text-gray-700 hover:bg-[#F2ECE1] border border-[#EAE2D0]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom Date Range Controls */}
        {dateRangeType === 'custom' && (
          <div className="p-3.5 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0] flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">শুরুর তারিখ:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#D5CBB5] rounded-xl text-xs text-[#16402C] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#16402C]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">শেষ তারিখ:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#D5CBB5] rounded-xl text-xs text-[#16402C] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#16402C]"
              />
            </div>
            <span className="text-[11px] text-gray-500 italic">
              (উভয় তারিখই অন্তর্ভুক্ত থাকে — কোনো রেকর্ড বাদ পড়ে না)
            </span>
          </div>
        )}
      </div>

      {/* Report Section Tabs (Hidden during print) */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-print">
        {[
          { id: 'financial', label: 'আর্থিক বিবরণী', icon: DollarSign, count: financialReport.summary.filteredRecords.length },
          { id: 'milk', label: 'দুধ সংগ্রহ ও বিক্রয়', icon: Milk, count: milkReport.distinctDaysCount },
          { id: 'health', label: 'গাভীর স্বাস্থ্য ও সেবা', icon: Stethoscope, count: healthReport.totalHealthEvents },
          { id: 'employees', label: 'কর্মী হাজিরা ও বেতন', icon: Users, count: employeeReport.totalActiveEmployees },
          { id: 'biogas', label: 'বায়োগ্যাস ও তদারকি', icon: Flame, count: biogasReport.recordDaysCount },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ReportTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs md:text-sm whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#16402C] text-white shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-[#FAF7F0] border border-[#EAE2D0]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#E5B842]' : 'text-gray-500'}`} />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                isActive ? 'bg-white/20 text-white' : 'bg-[#FAF7F0] text-gray-600 border border-[#E8DFC9]'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Printable Sheet View */}
      <div className="bg-white rounded-3xl border border-[#EAE2D0] p-6 md:p-8 shadow-xs space-y-6 printable-report">
        {/* Farm Letterhead Header (Always visible in sheet and print) */}
        <div className="border-b border-[#EAE2D0] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-center sm:text-left avoid-page-break">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#16402C]" />
              <h3 className="text-2xl font-bold text-[#16402C]">মুমিন এগ্রো (Mumin Agro)</h3>
            </div>
            <p className="text-sm font-semibold text-gray-700 mt-1">স্মার্ট ডেইরি ও বায়োগ্যাস খামার ব্যবস্থাপনা</p>
            <p className="text-xs text-gray-500 mt-0.5">মালিক: মুমিনুল ইসলাম • অবস্থান: খামার প্রাঙ্গণ</p>
          </div>
          <div className="sm:text-right">
            <span className="inline-block px-3.5 py-1.5 bg-[#FAF7F0] text-[#16402C] text-xs font-bold rounded-xl border border-[#E8DFC9]">
              প্রতিবেদনের সময়কাল: {dateRange.labelBn}
            </span>
            <p className="text-[11px] text-gray-400 mt-1.5">
              প্রিন্ট / তৈরির তারিখ: {generatedDateBn}
            </p>
            {isDemoMode && (
              <span className="inline-block text-[10px] text-[#1B4D35] font-bold bg-[#EAF5EE] px-2 py-0.5 rounded border border-[#C5E3D0] mt-1">
                খামার ডেটাবেজ প্রতিবেদন
              </span>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 1. FINANCIAL REPORT TAB                                        */}
        {/* ============================================================== */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#F2ECE1] pb-2">
              <h4 className="font-bold text-lg text-[#16402C]">আর্থিক লাভ-ক্ষতি ও ক্যাশফ্লো বিবরণী</h4>
              <span className="text-xs text-gray-500">মোট লেনদেন: {financialReport.summary.filteredRecords.length} টি</span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 avoid-page-break">
              <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0] metric-card">
                <span className="text-xs text-gray-500 block">মোট উপার্জিত আয়</span>
                <span className="text-xl md:text-2xl font-black text-[#16402C] mt-1 block">
                  ৳ {financialReport.summary.totalIncome.toLocaleString('en-US')}
                </span>
                <span className="text-[11px] text-[#2A7A50] mt-0.5 block">
                  {financialReport.summary.incomeRecordsCount}টি আয়ের ভুক্তি
                </span>
              </div>

              <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0] metric-card">
                <span className="text-xs text-gray-500 block">মোট পরিচালন ব্যয়</span>
                <span className="text-xl md:text-2xl font-black text-[#9E2A2B] mt-1 block">
                  ৳ {financialReport.summary.totalExpenses.toLocaleString('en-US')}
                </span>
                <span className="text-[11px] text-gray-500 mt-0.5 block">
                  {financialReport.summary.expenseRecordsCount}টি ব্যয়ের ভুক্তি
                </span>
              </div>

              <div className={`p-4 rounded-2xl border metric-card ${
                financialReport.summary.isSurplus
                  ? 'bg-[#EAF5EE] border-[#C5E3D0]'
                  : 'bg-[#FEF2F2] border-[#FECACA]'
              }`}>
                <span className="text-xs text-gray-600 block font-semibold">পরিচালন উদ্বৃত্ত / ঘাটতি</span>
                <span className={`text-xl md:text-2xl font-black mt-1 block ${
                  financialReport.summary.isSurplus ? 'text-[#1B4D35]' : 'text-[#991B1B]'
                }`}>
                  {financialReport.summary.netOperatingResult >= 0 ? '+' : ''}৳ {financialReport.summary.netOperatingResult.toLocaleString('en-US')}
                </span>
                <span className={`text-[11px] font-bold mt-0.5 block ${
                  financialReport.summary.isSurplus ? 'text-[#2A7A50]' : 'text-[#DC2626]'
                }`}>
                  {financialReport.summary.statusLabelBn}
                </span>
              </div>

              <div className="p-4 bg-[#FEF9E7] rounded-2xl border border-[#F7E2A9] metric-card">
                <span className="text-xs text-[#936709] block font-semibold">মুনাফার মার্জিন হার</span>
                <span className="text-xl md:text-2xl font-black text-[#805B00] mt-1 block">
                  {financialReport.summary.operatingMarginPct}%
                </span>
                <span className="text-[11px] text-[#936709] mt-0.5 block">
                  নেট মার্জিন = (উদ্বৃত্ত ÷ আয়) × ১০০
                </span>
              </div>
            </div>

            {/* Income & Expense Breakdown Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 avoid-page-break">
              {/* Income Breakdown */}
              <div className="border border-[#EAE2D0] rounded-2xl p-4 space-y-3">
                <h5 className="font-bold text-sm text-[#16402C] flex items-center justify-between pb-2 border-b border-[#F2ECE1]">
                  <span>আয়ের খাতসমূহ (Incomes)</span>
                  <span>টাকার পরিমাণ</span>
                </h5>
                {financialReport.summary.incomeCategoryBreakdown.length > 0 ? (
                  <div className="space-y-2 text-xs md:text-sm">
                    {financialReport.summary.incomeCategoryBreakdown.map((item) => (
                      <div key={item.category} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-none">
                        <span className="text-gray-700">{item.categoryLabelBn} ({item.count}টি)</span>
                        <span className="font-bold text-[#16402C]">৳ {item.totalAmount.toLocaleString('en-US')}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-sm">
                      <span>সর্বমোট আয়:</span>
                      <span className="text-[#16402C]">৳ {financialReport.summary.totalIncome.toLocaleString('en-US')}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 py-3 text-center">নির্বাচিত সময়ে কোনো আয়ের রেকর্ড নেই</p>
                )}
              </div>

              {/* Expense Breakdown */}
              <div className="border border-[#EAE2D0] rounded-2xl p-4 space-y-3">
                <h5 className="font-bold text-sm text-[#9E2A2B] flex items-center justify-between pb-2 border-b border-[#F2ECE1]">
                  <span>ব্যয়ের খাতসমূহ (Expenses)</span>
                  <span>টাকার পরিমাণ</span>
                </h5>
                {financialReport.summary.categoryBreakdown.length > 0 ? (
                  <div className="space-y-2 text-xs md:text-sm">
                    {financialReport.summary.categoryBreakdown.map((item) => (
                      <div key={item.category} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-none">
                        <span className="text-gray-700">{item.categoryLabelBn} ({item.count}টি)</span>
                        <span className="font-semibold text-gray-900">৳ {item.totalAmount.toLocaleString('en-US')}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-sm">
                      <span>সর্বমোট ব্যয়:</span>
                      <span className="text-[#9E2A2B]">৳ {financialReport.summary.totalExpenses.toLocaleString('en-US')}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 py-3 text-center">নির্বাচিত সময়ে কোনো ব্যয়ের রেকর্ড নেই</p>
                )}
              </div>
            </div>

            {/* Monthly Trend Table (Income vs Expense) */}
            {financialReport.monthlyTrend.length > 0 && (
              <div className="border border-[#EAE2D0] rounded-2xl overflow-hidden avoid-page-break">
                <div className="bg-[#FAF7F0] px-4 py-3 border-b border-[#EAE2D0] flex items-center justify-between">
                  <h5 className="font-bold text-sm text-[#16402C] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#16402C]" />
                    <span>মাসভিত্তিক আয় ও ব্যয়ের তুলনামূলক ট্রেন্ড</span>
                  </h5>
                  <span className="text-xs text-gray-500">মোট {financialReport.monthlyTrend.length} মাসের উপাত্ত</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs md:text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">মাস</th>
                        <th className="py-2.5 px-3 text-right">আয় (৳)</th>
                        <th className="py-2.5 px-3 text-right">ব্যয় (৳)</th>
                        <th className="py-2.5 px-3 text-right">নিট ফলাফল (৳)</th>
                        <th className="py-2.5 px-3 text-center">অবস্থা</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {financialReport.monthlyTrend.map((row) => (
                        <tr key={row.month} className="hover:bg-gray-50/50">
                          <td className="py-2.5 px-3 font-bold text-gray-800">{row.monthBn}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#16402C]">
                            ৳ {row.income.toLocaleString('en-US')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-[#9E2A2B]">
                            ৳ {row.expense.toLocaleString('en-US')}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-black ${
                            row.net >= 0 ? 'text-[#1B4D35]' : 'text-[#991B1B]'
                          }`}>
                            {row.net >= 0 ? '+' : ''}৳ {row.net.toLocaleString('en-US')}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              row.net >= 0
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                              {row.net >= 0 ? 'উদ্বৃত্ত' : 'ঘাটতি'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Payment Method Distribution */}
            <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0] avoid-page-break">
              <h5 className="font-bold text-xs text-gray-700 uppercase tracking-wider mb-3">
                পরিশোধ মাধ্যম অনুযায়ী বণ্টন (Payment Methods)
              </h5>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-[#EAE2D0]">
                  <span className="font-bold text-gray-800 block">ক্যাশ / নগদ</span>
                  <span className="text-[#16402C] font-semibold block mt-1">
                    আয়: ৳ {financialReport.summary.paymentMethodBreakdown.cash.income.toLocaleString('en-US')}
                  </span>
                  <span className="text-[#9E2A2B] font-semibold block">
                    ব্যয়: ৳ {financialReport.summary.paymentMethodBreakdown.cash.expense.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#EAE2D0]">
                  <span className="font-bold text-gray-800 block">বিকাশ (bKash)</span>
                  <span className="text-[#16402C] font-semibold block mt-1">
                    আয়: ৳ {financialReport.summary.paymentMethodBreakdown.bkash.income.toLocaleString('en-US')}
                  </span>
                  <span className="text-[#9E2A2B] font-semibold block">
                    ব্যয়: ৳ {financialReport.summary.paymentMethodBreakdown.bkash.expense.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#EAE2D0]">
                  <span className="font-bold text-gray-800 block">ব্যাংক অ্যাকাউন্ট</span>
                  <span className="text-[#16402C] font-semibold block mt-1">
                    আয়: ৳ {financialReport.summary.paymentMethodBreakdown.bank.income.toLocaleString('en-US')}
                  </span>
                  <span className="text-[#9E2A2B] font-semibold block">
                    ব্যয়: ৳ {financialReport.summary.paymentMethodBreakdown.bank.expense.toLocaleString('en-US')}
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction List Table */}
            <div className="border border-[#EAE2D0] rounded-2xl overflow-hidden avoid-page-break">
              <div className="bg-[#FAF7F0] px-4 py-3 border-b border-[#EAE2D0]">
                <h5 className="font-bold text-sm text-[#16402C]">
                  বিস্তারিত লেনদেন খতিয়ান ({financialReport.summary.filteredRecords.length} টি)
                </h5>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">তারিখ</th>
                      <th className="py-2.5 px-3">ধরন</th>
                      <th className="py-2.5 px-3">খাত</th>
                      <th className="py-2.5 px-3">বিবরণ</th>
                      <th className="py-2.5 px-3 text-right">পরিমাণ (৳)</th>
                      <th className="py-2.5 px-3">মাধ্যম</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {financialReport.summary.filteredRecords.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="py-2 px-3 text-gray-600 whitespace-nowrap">{formatBanglaDate(item.date)}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            item.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {item.type === 'income' ? 'আয়' : 'ব্যয়'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-700 font-medium whitespace-nowrap">{item.categoryLabelBn || item.category}</td>
                        <td className="py-2 px-3 text-gray-800">{item.title}</td>
                        <td className={`py-2 px-3 text-right font-bold whitespace-nowrap ${
                          item.type === 'income' ? 'text-[#16402C]' : 'text-[#9E2A2B]'
                        }`}>
                          {item.type === 'income' ? '+' : '-'}৳ {item.amount.toLocaleString('en-US')}
                        </td>
                        <td className="py-2 px-3 text-gray-500 text-xs whitespace-nowrap">
                          {item.paymentMethod === 'bkash' ? 'বিকাশ' : item.paymentMethod === 'bank' ? 'ব্যাংক' : 'নগদ'}
                        </td>
                      </tr>
                    ))}
                    {financialReport.summary.filteredRecords.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400">
                          <Info className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                          <span>নির্বাচিত সময়সীমার মধ্যে কোনো আর্থিক লেনদেনের রেকর্ড পাওয়া যায়নি।</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. MILK PRODUCTION & SALES TAB                                 */}
        {/* ============================================================== */}
        {activeTab === 'milk' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#F2ECE1] pb-2">
              <h4 className="font-bold text-lg text-[#16402C]">দুধ উৎপাদন, বিক্রয় ও ব্যবহার বিবরণী</h4>
              <span className="text-xs text-gray-500">মোট রেকর্ডকৃত দিন: {milkReport.distinctDaysCount} দিন</span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 avoid-page-break">
              <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0] metric-card">
                <span className="text-xs text-gray-500 block">মোট সংগৃহীত দুধ</span>
                <span className="text-xl md:text-2xl font-black text-[#16402C] mt-1 block">
                  {milkReport.totalCollectedLiters} <span className="text-xs font-normal">লিটার</span>
                </span>
                <span className="text-[11px] text-gray-500 mt-0.5 block">
                  সকাল: {milkReport.totalMorningLiters}L | বিকাল: {milkReport.totalEveningLiters}L
                </span>
              </div>

              <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0] metric-card">
                <span className="text-xs text-gray-500 block">দৈনিক গড় সংগ্রহ</span>
                <span className="text-xl md:text-2xl font-black text-[#16402C] mt-1 block">
                  {milkReport.averageDailyCollection} <span className="text-xs font-normal">লিটার</span>
                </span>
                <span className="text-[11px] text-gray-500 mt-0.5 block">
                  শুধুমাত্র রেকর্ডকৃত দিনের ভিত্তিতে
                </span>
              </div>

              <div className="p-4 bg-[#EAF5EE] rounded-2xl border border-[#C5E3D0] metric-card">
                <span className="text-xs text-[#1B4D35] block font-semibold">মোট বিক্রিত দুধ ও রাজস্ব</span>
                <span className="text-xl md:text-2xl font-black text-[#1B4D35] mt-1 block">
                  {milkReport.totalSoldLiters} <span className="text-xs font-normal">লিটার</span>
                </span>
                <span className="text-[11px] text-[#2A7A50] mt-0.5 block font-bold">
                  বিক্রয় আয়: ৳ {milkReport.totalRevenueTk.toLocaleString('en-US')}
                </span>
              </div>

              <div className="p-4 bg-[#FEF9E7] rounded-2xl border border-[#F7E2A9] metric-card">
                <span className="text-xs text-[#936709] block font-semibold">অবিক্রিত / বাছুরের খাদ্য</span>
                <span className="text-xl md:text-2xl font-black text-[#805B00] mt-1 block">
                  {milkReport.totalRetainedLiters} <span className="text-xs font-normal">লিটার</span>
                </span>
                <span className="text-[11px] text-[#936709] mt-0.5 block">
                  বাছুরের দুধ ও পারিবারিক ব্যবহার
                </span>
              </div>
            </div>

            {/* Monthly Trend Table (Milk) */}
            {milkReport.monthlyTrend.length > 0 && (
              <div className="border border-[#EAE2D0] rounded-2xl overflow-hidden avoid-page-break">
                <div className="bg-[#FAF7F0] px-4 py-3 border-b border-[#EAE2D0] flex items-center justify-between">
                  <h5 className="font-bold text-sm text-[#16402C] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#16402C]" />
                    <span>মাসভিত্তিক দুধ সংগ্রহ ও রাজস্ব ট্রেন্ড</span>
                  </h5>
                  <span className="text-xs text-gray-500">মোট {milkReport.monthlyTrend.length} মাসের খতিয়ান</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs md:text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">মাস</th>
                        <th className="py-2.5 px-3 text-right">সংগৃহীত দুধ (L)</th>
                        <th className="py-2.5 px-3 text-right">বিক্রিত দুধ (L)</th>
                        <th className="py-2.5 px-3 text-right">বিক্রয় আয় (৳)</th>
                        <th className="py-2.5 px-3 text-right">অবিক্রিত / বাছুর (L)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {milkReport.monthlyTrend.map((row) => (
                        <tr key={row.month} className="hover:bg-gray-50/50">
                          <td className="py-2.5 px-3 font-bold text-gray-800">{row.monthBn}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#16402C]">{row.collectedLiters} L</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-emerald-800">{row.soldLiters} L</td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#16402C]">
                            ৳ {row.revenueTk.toLocaleString('en-US')}
                          </td>
                          <td className="py-2.5 px-3 text-right text-amber-800">{row.retainedLiters} L</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Daily Milk Breakdown Table */}
            <div className="border border-[#EAE2D0] rounded-2xl overflow-hidden avoid-page-break">
              <div className="bg-[#FAF7F0] px-4 py-3 border-b border-[#EAE2D0]">
                <h5 className="font-bold text-sm text-[#16402C]">দৈনিক দুধ উৎপাদন ও বিক্রয় খতিয়ান</h5>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">তারিখ</th>
                      <th className="py-2.5 px-3 text-right">সকাল (L)</th>
                      <th className="py-2.5 px-3 text-right">বিকাল (L)</th>
                      <th className="py-2.5 px-3 text-right font-bold">মোট সংগ্রহ</th>
                      <th className="py-2.5 px-3 text-right">বিক্রি (L)</th>
                      <th className="py-2.5 px-3 text-right">বিক্রয় আয় (৳)</th>
                      <th className="py-2.5 px-3 text-right">ব্যবহার/অবিক্রিত</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {milkReport.dailyBreakdown.map((row) => (
                      <tr key={row.date} className="hover:bg-gray-50/50">
                        <td className="py-2 px-3 text-gray-700 font-medium whitespace-nowrap">{row.dateBn}</td>
                        <td className="py-2 px-3 text-right text-gray-600">{row.morningLiters}</td>
                        <td className="py-2 px-3 text-right text-gray-600">{row.eveningLiters}</td>
                        <td className="py-2 px-3 text-right font-bold text-[#16402C]">{row.totalLiters} L</td>
                        <td className="py-2 px-3 text-right font-semibold text-emerald-800">{row.soldLiters} L</td>
                        <td className="py-2 px-3 text-right font-bold text-[#16402C]">
                          {row.revenueTk > 0 ? `৳ ${row.revenueTk.toLocaleString('en-US')}` : '—'}
                        </td>
                        <td className="py-2 px-3 text-right text-amber-800">{row.retainedLiters} L</td>
                      </tr>
                    ))}
                    {milkReport.dailyBreakdown.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400">
                          <Info className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                          <span>নির্বাচিত সময়সীমার মধ্যে কোনো দুধ উৎপাদনের রেকর্ড পাওয়া যায়নি।</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Individual Cow Breakdown */}
            {milkReport.cowBreakdown.length > 0 && (
              <div className="border border-[#EAE2D0] rounded-2xl overflow-hidden avoid-page-break">
                <div className="bg-[#FAF7F0] px-4 py-3 border-b border-[#EAE2D0] flex items-center justify-between">
                  <h5 className="font-bold text-sm text-[#16402C]">গাভীভিত্তিক প্রকৃত দুধ উৎপাদন পরিসংখ্যান</h5>
                  <span className="text-xs text-gray-500">প্রকৃত সংগৃহীত রেকর্ড থেকে গণনাকৃত</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs md:text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">গাভীর ট্যাগ</th>
                        <th className="py-2.5 px-3">গাভীর নাম</th>
                        <th className="py-2.5 px-3 text-right">মোট দুধ (L)</th>
                        <th className="py-2.5 px-3 text-right">সকাল (L)</th>
                        <th className="py-2.5 px-3 text-right">বিকাল (L)</th>
                        <th className="py-2.5 px-3 text-right">দৈনিক গড় (L)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {milkReport.cowBreakdown.map((cow) => (
                        <tr key={cow.cowId} className="hover:bg-gray-50/50">
                          <td className="py-2 px-3 font-bold text-gray-800">{cow.cowTag}</td>
                          <td className="py-2 px-3 text-gray-700">{cow.cowName}</td>
                          <td className="py-2 px-3 text-right font-bold text-[#16402C]">{cow.totalLiters} L</td>
                          <td className="py-2 px-3 text-right text-gray-600">{cow.morningLiters} L</td>
                          <td className="py-2 px-3 text-right text-gray-600">{cow.eveningLiters} L</td>
                          <td className="py-2 px-3 text-right font-semibold text-emerald-800">{cow.dailyAvgLiters} L</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. COW HEALTH & VETERINARY TAB                                 */}
        {/* ============================================================== */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#F2ECE1] pb-2 gap-2">
              <h4 className="font-bold text-lg text-[#16402C]">গাভীর স্বাস্থ্য, টিকাদান ও চিকিৎসা প্রতিবেদন</h4>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">মোট সক্রিয়: {healthReport.totalActiveCows} টি</span>
                {healthReport.totalArchivedCows > 0 && (
                  <span className="text-gray-400">| সংরক্ষিত/বিক্রিত: {healthReport.totalArchivedCows} টি</span>
                )}
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 avoid-page-break">
              <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0] metric-card">
                <span className="text-xs text-gray-500 block">মোট স্বাস্থ্য ইভেন্ট</span>
                <span className="text-xl md:text-2xl font-black text-[#16402C] mt-1 block">
                  {healthReport.totalHealthEvents} <span className="text-xs font-normal">টি</span>
                </span>
                <span className="text-[11px] text-gray-500 mt-0.5 block">
                  টিকা: {healthReport.vaccinationsCount} | চিকিৎসা: {healthReport.treatmentsCount}
                </span>
              </div>

              <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0] metric-card">
                <span className="text-xs text-gray-500 block">মোট চিকিৎসা ও ঔষধ খরচ</span>
                <span className="text-xl md:text-2xl font-black text-[#9E2A2B] mt-1 block">
                  ৳ {healthReport.totalHealthCostTk.toLocaleString('en-US')}
                </span>
                <span className="text-[11px] text-gray-500 mt-0.5 block">
                  ডাক্তার ফি ও ঔষধ বাবদ প্রকৃত ব্যয়
                </span>
              </div>

              <div className="p-4 bg-red-50 rounded-2xl border border-red-200 metric-card">
                <span className="text-xs text-red-700 block font-semibold">মেয়াদোত্তীর্ণ অনুস্মারক</span>
                <span className="text-xl md:text-2xl font-black text-red-700 mt-1 block">
                  {healthReport.overdueRemindersCount} <span className="text-xs font-normal">টি</span>
                </span>
                <span className="text-[11px] text-red-600 mt-0.5 block font-bold">
                  জরুরি ব্যবস্থা গ্রহণ আবশ্যক
                </span>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 metric-card">
                <span className="text-xs text-emerald-800 block font-semibold">আসন্ন স্বাস্থ্য ফলো-আপ</span>
                <span className="text-xl md:text-2xl font-black text-emerald-800 mt-1 block">
                  {healthReport.upcomingRemindersCount} <span className="text-xs font-normal">টি</span>
                </span>
                <span className="text-[11px] text-emerald-700 mt-0.5 block font-bold">
                  টিকা ও কৃমিনাশক শিডিউল
                </span>
              </div>
            </div>

            {/* Cow Status Distribution Badges */}
            <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0] avoid-page-break">
              <h5 className="font-bold text-xs text-gray-700 uppercase tracking-wider mb-2">
                গাভী ও বাছুরের বর্তমান অবস্থা বণ্টন (Herd Status)
              </h5>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1 bg-white border border-[#EAE2D0] rounded-xl text-[#16402C] font-semibold">
                  দুধ দিচ্ছে: {healthReport.cowsByStatus.milking || 0}টি
                </span>
                <span className="px-3 py-1 bg-white border border-[#EAE2D0] rounded-xl text-amber-800 font-semibold">
                  গাভীন: {healthReport.cowsByStatus.pregnant || 0}টি
                </span>
                <span className="px-3 py-1 bg-white border border-[#EAE2D0] rounded-xl text-blue-800 font-semibold">
                  বাছুর: {healthReport.cowsByStatus.calf || 0}টি
                </span>
                <span className="px-3 py-1 bg-white border border-[#EAE2D0] rounded-xl text-gray-700 font-semibold">
                  দুধ দিচ্ছে না: {healthReport.cowsByStatus.dry || 0}টি
                </span>
                <span className="px-3 py-1 bg-white border border-[#EAE2D0] rounded-xl text-red-700 font-semibold">
                  অসুস্থ: {healthReport.cowsByStatus.sick || 0}টি
                </span>
                <span className="px-3 py-1 bg-white border border-[#EAE2D0] rounded-xl text-purple-700 font-semibold">
                  বিক্রি হয়েছে: {healthReport.cowsByStatus.sold || 0}টি
                </span>
              </div>
            </div>

            {/* Cow Filter Dropdown (Hidden during print) */}
            <div className="flex items-center justify-between gap-3 no-print p-3 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0] text-xs">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#16402C]" />
                <span className="font-bold text-gray-700">নির্দিষ্ট গাভীর স্বাস্থ্য খতিয়ান ফিল্টার:</span>
              </div>
              <select
                value={selectedCowFilter}
                onChange={(e) => setSelectedCowFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#D5CBB5] bg-white font-bold text-gray-800 outline-hidden focus:ring-2 focus:ring-[#16402C]"
              >
                <option value="all">সকল গাভীর তথ্য ({healthReport.eventsList.length}টি ইভেন্ট)</option>
                {cows.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.tagNumber} ({c.name}) {c.isArchived ? '[সংরক্ষিত]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Health Events List Table */}
            <div className="border border-[#EAE2D0] rounded-2xl overflow-hidden avoid-page-break">
              <div className="bg-[#FAF7F0] px-4 py-3 border-b border-[#EAE2D0] flex items-center justify-between">
                <h5 className="font-bold text-sm text-[#16402C]">
                  স্বাস্থ্য ইভেন্ট ও চিকিৎসা খতিয়ান ({displayedHealthEvents.length} টি)
                </h5>
                <span className="text-[11px] text-gray-500">চিকিৎসকের প্রেসক্রিপশন ও মালিকের রেকর্ড ভিত্তিক</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">তারিখ</th>
                      <th className="py-2.5 px-3">গাভীর ট্যাগ</th>
                      <th className="py-2.5 px-3">ইভেন্ট</th>
                      <th className="py-2.5 px-3">টিকা / চিকিৎসা</th>
                      <th className="py-2.5 px-3">ডাক্তার</th>
                      <th className="py-2.5 px-3 text-right">খরচ (৳)</th>
                      <th className="py-2.5 px-3">পরবর্তী তারিখ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayedHealthEvents.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50/50">
                        <td className="py-2 px-3 text-gray-600 whitespace-nowrap">{e.eventDateBn}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="font-bold text-gray-900">{e.cowTag}</span>
                          <span className="text-xs text-gray-500 block">{e.cowName}</span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800">
                            {e.eventTypeBn}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-800 font-medium">{e.treatmentName}</td>
                        <td className="py-2 px-3 text-gray-600 text-xs">{e.doctorName || '—'}</td>
                        <td className="py-2 px-3 text-right font-bold text-[#9E2A2B]">
                          {e.cost > 0 ? `৳ ${e.cost.toLocaleString('en-US')}` : 'বিনামূল্যে'}
                        </td>
                        <td className="py-2 px-3 text-gray-600 text-xs whitespace-nowrap">
                          {e.nextDueDate ? formatBanglaDate(e.nextDueDate) : '—'}
                        </td>
                      </tr>
                    ))}
                    {displayedHealthEvents.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400">
                          <Info className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                          <span>নির্বাচিত সময়সীমায় কোনো স্বাস্থ্য ও চিকিৎসা রেকর্ড পাওয়া যায়নি।</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 4. EMPLOYEES, ATTENDANCE & PAYROLL TAB                         */}
        {/* ============================================================== */}
        {activeTab === 'employees' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#F2ECE1] pb-2">
              <h4 className="font-bold text-lg text-[#16402C]">কর্মী হাজিরা, দায়িত্ব ও বেতন বিবরণী</h4>
              <span className="text-xs text-gray-500">
                সক্রিয়: {employeeReport.totalActiveEmployees} জন | সংরক্ষিত: {employeeReport.totalArchivedEmployees} জন
              </span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 avoid-page-break">
              <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0] metric-card">
                <span className="text-xs text-gray-500 block">মোট উপস্থিতির দিন</span>
                <span className="text-xl md:text-2xl font-black text-[#16402C] mt-1 block">
                  {employeeReport.totalPresentDays} <span className="text-xs font-normal">দিন</span>
                </span>
                <span className="text-[11px] text-[#2A7A50] mt-0.5 block">
                  অনুপস্থিত: {employeeReport.totalAbsentDays} | ছুটি: {employeeReport.totalLeaveDays}
                </span>
              </div>

              <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0] metric-card">
                <span className="text-xs text-gray-500 block">রেকর্ডকৃত হাজিরার ভুক্তি</span>
                <span className="text-xl md:text-2xl font-black text-[#16402C] mt-1 block">
                  {employeeReport.totalRecordedDays} <span className="text-xs font-normal">টি</span>
                </span>
                <span className="text-[11px] text-gray-500 mt-0.5 block">
                  রেকর্ডবিহীন দিন অনুপস্থিত গণ্য করা হয়নি
                </span>
              </div>

              <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0] metric-card">
                <span className="text-xs text-gray-500 block">মাসিক নির্ধারিত বেতন</span>
                <span className="text-xl md:text-2xl font-black text-gray-800 mt-1 block">
                  ৳ {employeeReport.totalConfiguredSalaryTk.toLocaleString('en-US')}
                </span>
                <span className="text-[11px] text-gray-500 mt-0.5 block">
                  সক্রিয় কর্মীদের মাসিক চুক্তি
                </span>
              </div>

              <div className="p-4 bg-[#EAF5EE] rounded-2xl border border-[#C5E3D0] metric-card">
                <span className="text-xs text-[#1B4D35] block font-semibold">প্রকৃত পরিশোধিত বেতন</span>
                <span className="text-xl md:text-2xl font-black text-[#1B4D35] mt-1 block">
                  ৳ {employeeReport.totalPaidSalaryTk.toLocaleString('en-US')}
                </span>
                <span className="text-[11px] text-[#2A7A50] mt-0.5 block font-bold">
                  আর্থিক খাতায় সংরক্ষিত বেতন
                </span>
              </div>
            </div>

            {/* Attendance & Payroll Table */}
            <div className="border border-[#EAE2D0] rounded-2xl overflow-hidden avoid-page-break">
              <div className="bg-[#FAF7F0] px-4 py-3 border-b border-[#EAE2D0] flex items-center justify-between">
                <h5 className="font-bold text-sm text-[#16402C]">কর্মীভিত্তিক হাজিরা, দায়িত্ব ও বেতন খতিয়ান</h5>
                <span className="text-xs text-gray-500">অনুপস্থিতি ও রেকর্ডবিহীন দিন সুস্পষ্টভাবে পৃথক</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">কর্মচারীর নাম</th>
                      <th className="py-2.5 px-3">পদবি</th>
                      <th className="py-2.5 px-3 text-right">চুক্তি (৳)</th>
                      <th className="py-2.5 px-3 text-center">উপস্থিত</th>
                      <th className="py-2.5 px-3 text-center">অনুপস্থিত</th>
                      <th className="py-2.5 px-3 text-center">ছুটি</th>
                      <th className="py-2.5 px-3 text-right">হাজিরা হার</th>
                      <th className="py-2.5 px-3 text-center">দায়িত্ব / কাজ</th>
                      <th className="py-2.5 px-3">বেতন অবস্থা</th>
                      <th className="py-2.5 px-3 text-right">পরিশোধিত (৳)</th>
                      <th className="py-2.5 px-3 text-right">বকেয়া (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {employeeReport.employeeSummaries.map((emp) => (
                      <tr key={emp.employeeId} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-3 font-bold text-gray-900">{emp.name}</td>
                        <td className="py-2.5 px-3 text-gray-600 text-xs">{emp.role}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-gray-800">
                          ৳ {emp.salaryMonthly.toLocaleString('en-US')}
                        </td>
                        <td className="py-2.5 px-3 text-center text-emerald-800 font-bold">{emp.presentDays}</td>
                        <td className="py-2.5 px-3 text-center text-red-700 font-bold">{emp.absentDays}</td>
                        <td className="py-2.5 px-3 text-center text-amber-700 font-bold">{emp.leaveDays}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#16402C]">
                          {emp.attendanceRate}%
                        </td>
                        <td className="py-2.5 px-3 text-center text-xs whitespace-nowrap">
                          <span className="font-semibold text-gray-700">
                            মোট {emp.assignedTasksCount} (সম্পন্ন {emp.completedTasksCount})
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            emp.payrollStatus.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : emp.payrollStatus.status === 'partial'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {emp.payrollStatus.statusBn}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#16402C]">
                          ৳ {emp.payrollStatus.paidAmount.toLocaleString('en-US')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-red-700">
                          ৳ {emp.payrollStatus.dueAmount.toLocaleString('en-US')}
                        </td>
                      </tr>
                    ))}
                    {employeeReport.employeeSummaries.length === 0 && (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-gray-400">
                          <Info className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                          <span>কোনো কর্মচারীর তথ্য তালিকায় নেই।</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Monthly Attendance Trends */}
            {employeeReport.monthlyAttendanceTrends.length > 0 && (
              <div className="border border-[#EAE2D0] rounded-2xl overflow-hidden avoid-page-break">
                <div className="bg-[#FAF7F0] px-4 py-3 border-b border-[#EAE2D0]">
                  <h5 className="font-bold text-sm text-[#16402C]">মাসভিত্তিক সমষ্টিগত উপস্থিতি প্রবণতা</h5>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs md:text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">মাস</th>
                        <th className="py-2.5 px-3 text-center">উপস্থিতির সংখ্যা</th>
                        <th className="py-2.5 px-3 text-center">অনুপস্থিতি</th>
                        <th className="py-2.5 px-3 text-center">ছুটি</th>
                        <th className="py-2.5 px-3 text-right">মোট রেকর্ড</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {employeeReport.monthlyAttendanceTrends.map((trend) => (
                        <tr key={trend.month} className="hover:bg-gray-50/50">
                          <td className="py-2.5 px-3 font-bold text-gray-800">{trend.monthBn}</td>
                          <td className="py-2.5 px-3 text-center text-emerald-800 font-bold">{trend.presentDays} দিন</td>
                          <td className="py-2.5 px-3 text-center text-red-700 font-bold">{trend.absentDays} দিন</td>
                          <td className="py-2.5 px-3 text-center text-amber-700 font-bold">{trend.leaveDays} দিন</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-gray-700">{trend.totalRecordedDays} টি ভুক্তি</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 5. BIOGAS & MAINTENANCE TAB                                    */}
        {/* ============================================================== */}
        {activeTab === 'biogas' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#F2ECE1] pb-2">
              <h4 className="font-bold text-lg text-[#16402C]">বায়োগ্যাস প্ল্যান্ট দৈনিক ইনপুট ও নিরাপত্তা তদারকি</h4>
              <span className="text-xs text-gray-500">মোট রেকর্ডকৃত দিন: {biogasReport.recordDaysCount} দিন</span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 avoid-page-break">
              <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0] metric-card">
                <span className="text-xs text-gray-500 block">মোট গোবর ইনপুট</span>
                <span className="text-xl md:text-2xl font-black text-[#16402C] mt-1 block">
                  {biogasReport.totalDungKg} <span className="text-xs font-normal">কেজি</span>
                </span>
                <span className="text-[11px] text-gray-500 mt-0.5 block">
                  দৈনিক গড়: {biogasReport.avgDailyDungKg} কেজি
                </span>
              </div>

              <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0] metric-card">
                <span className="text-xs text-gray-500 block">মোট পানি ইনপুট</span>
                <span className="text-xl md:text-2xl font-black text-[#16402C] mt-1 block">
                  {biogasReport.totalWaterLiters} <span className="text-xs font-normal">লিটার</span>
                </span>
                <span className="text-[11px] text-gray-500 mt-0.5 block">
                  দৈনিক গড়: {biogasReport.avgDailyWaterLiters} লিটার
                </span>
              </div>

              <div className="p-4 bg-[#EAF5EE] rounded-2xl border border-[#C5E3D0] metric-card">
                <span className="text-xs text-[#1B4D35] block font-semibold">চুলা চলার মোট সময়</span>
                <span className="text-xl md:text-2xl font-black text-[#1B4D35] mt-1 block">
                  {biogasReport.totalBurnHours} <span className="text-xs font-normal">ঘণ্টা</span>
                </span>
                <span className="text-[11px] text-[#2A7A50] mt-0.5 block font-bold">
                  দৈনিক গড়: {biogasReport.avgDailyBurnHours} ঘণ্টা
                </span>
              </div>

              <div className="p-4 bg-[#FEF9E7] rounded-2xl border border-[#F7E2A9] metric-card">
                <span className="text-xs text-[#936709] block font-semibold">মোট উৎপাদিত জৈব সার</span>
                <span className="text-xl md:text-2xl font-black text-[#805B00] mt-1 block">
                  {biogasReport.totalSlurryBags} <span className="text-xs font-normal">বস্তা</span>
                </span>
                <span className="text-[11px] text-[#936709] mt-0.5 block font-bold">
                  দৈনিক গড়: {biogasReport.avgDailySlurryBags} বস্তা
                </span>
              </div>
            </div>

            {/* Inspections Status Card */}
            <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0] flex flex-col md:flex-row md:items-center justify-between gap-4 avoid-page-break">
              <div>
                <h5 className="font-bold text-sm text-[#16402C]">অপারেশনাল ৫-দফা নিরাপত্তা পর্যবেক্ষণ</h5>
                <p className="text-xs text-gray-600 mt-0.5">
                  সম্পন্ন পরিদর্শন: {biogasReport.inspectionsCompletedCount}টি | সতর্কতামূলক ইস্যু সনাক্ত: {biogasReport.inspectionsIssuesCount}টি | আসন্ন তদারকি: {biogasReport.upcomingMaintenanceCount}টি
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 max-w-lg flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">জরুরি নিরাপত্তা গাইডলাইন:</span>
                  গ্যাস লিকেজ বা কোনো অস্বাভাবিক চাপ সন্দেহে নিজে প্রেসার ভালভ মেরামত করবেন না। অবিলম্বে খোলা জায়গা নিশ্চিত করুন, আগুনের উৎস ও ম্যাচলাইট থেকে দূরে থাকুন এবং দক্ষ বায়োগ্যাস টেকনিশিয়ানকে খবর দিন।
                </div>
              </div>
            </div>

            {/* Monthly Trend Table (Biogas) */}
            {biogasReport.monthlyTrend.length > 0 && (
              <div className="border border-[#EAE2D0] rounded-2xl overflow-hidden avoid-page-break">
                <div className="bg-[#FAF7F0] px-4 py-3 border-b border-[#EAE2D0]">
                  <h5 className="font-bold text-sm text-[#16402C]">মাসভিত্তিক বায়োগ্যাস প্ল্যান্ট ইনপুট ও উৎপাদন ট্রেন্ড</h5>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs md:text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">মাস</th>
                        <th className="py-2.5 px-3 text-right">গোবর (কেজি)</th>
                        <th className="py-2.5 px-3 text-right">পানি (L)</th>
                        <th className="py-2.5 px-3 text-right">চুলা ব্যবহার (ঘণ্টা)</th>
                        <th className="py-2.5 px-3 text-right">সার/স্লারি (বস্তা)</th>
                        <th className="py-2.5 px-3 text-right">রেকর্ডকৃত দিন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {biogasReport.monthlyTrend.map((row) => (
                        <tr key={row.month} className="hover:bg-gray-50/50">
                          <td className="py-2.5 px-3 font-bold text-gray-800">{row.monthBn}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#16402C]">{row.dungKg} কেজি</td>
                          <td className="py-2.5 px-3 text-right text-gray-600">{row.waterLiters} L</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-emerald-800">{row.burnHours} ঘণ্টা</td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#805B00]">{row.slurryBags} বস্তা</td>
                          <td className="py-2.5 px-3 text-right text-gray-500">{row.recordDaysCount} দিন</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Biogas Logs Table */}
            <div className="border border-[#EAE2D0] rounded-2xl overflow-hidden avoid-page-break">
              <div className="bg-[#FAF7F0] px-4 py-3 border-b border-[#EAE2D0]">
                <h5 className="font-bold text-sm text-[#16402C]">বায়োগ্যাস প্ল্যান্টের দৈনিক লগ খতিয়ান</h5>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">তারিখ</th>
                      <th className="py-2.5 px-3 text-right">গোবর (কেজি)</th>
                      <th className="py-2.5 px-3 text-right">পানি (লিটার)</th>
                      <th className="py-2.5 px-3 text-right">চুলা ব্যবহার (ঘণ্টা)</th>
                      <th className="py-2.5 px-3 text-right">সার/স্লারি (বস্তা)</th>
                      <th className="py-2.5 px-3">দায়িত্বপ্রাপ্ত কর্মী</th>
                      <th className="py-2.5 px-3">মন্তব্য / অবস্থা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {biogasReport.logsList.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/50">
                        <td className="py-2 px-3 text-gray-700 font-medium whitespace-nowrap">{formatBanglaDate(log.date)}</td>
                        <td className="py-2 px-3 text-right font-bold text-[#16402C]">{log.dungInputKg} কেজি</td>
                        <td className="py-2 px-3 text-right text-gray-600">{log.waterInputLiters} L</td>
                        <td className="py-2 px-3 text-right font-semibold text-emerald-800">{log.burnHoursToday} ঘণ্টা</td>
                        <td className="py-2 px-3 text-right font-bold text-[#805B00]">{log.slurryProducedBags} বস্তা</td>
                        <td className="py-2 px-3 text-gray-600 text-xs">{log.recordedBy || 'খামার কর্মী'}</td>
                        <td className="py-2 px-3 text-gray-600 text-xs">{log.notes || log.statusBn}</td>
                      </tr>
                    ))}
                    {biogasReport.logsList.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400">
                          <Info className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                          <span>নির্বাচিত সময়সীমায় কোনো বায়োগ্যাস দৈনিক লগের তথ্য পাওয়া যায়নি।</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Printable Verification Footer */}
        <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0] text-xs text-gray-600 space-y-1 avoid-page-break">
          <p className="font-bold text-sm text-[#16402C]">খামার পরিচালকের সত্যায়ন নোট:</p>
          <p>
            • এই বিবরণীর সমস্ত উপাত্ত সংরক্ষিত লেনদেন, দুধের প্রকৃত পরিমাপ এবং কর্মচারীদের কার্যতালিকা থেকে সরাসরি সংকলিত।<br />
            • কোনো ধরনের অনুমান বা ডুপ্লিকেট গণনা ছাড়া এই রিপোর্টটি প্রস্তুত করা হয়েছে।
          </p>
          <div className="pt-4 flex justify-between items-center text-[11px] text-gray-500">
            <span>প্রস্তুতকারক: মুমিন এগ্রো ব্যবস্থাপনা সফটওয়্যার</span>
            <span>স্বাক্ষর: _________________________ (খামার পরিচালক)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
