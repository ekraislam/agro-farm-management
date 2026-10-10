import { useState, useMemo } from 'react';
import { 
  Receipt, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Search,
  Edit2,
  Trash2,
  Link as LinkIcon,
  PieChart,
  CreditCard,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import type { FinancialRecord, TransactionType } from '../../types/farm';
import { 
  calculateFinancialSummary, 
  formatBanglaDate,
  type FinancialFilterPeriod, 
  type CustomDateRange 
} from '../../utils/accounting';
import { IncomeExpenseChart } from '../common/Charts';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';

interface FinanceViewProps {
  records: FinancialRecord[];
  onOpenAddExpense: () => void;
  onEditTransaction: (record: FinancialRecord) => void;
  onDeleteTransaction: (recordId: string) => Promise<{ success: boolean; error?: string } | void> | void;
}

export const FinanceView = ({
  records,
  onOpenAddExpense,
  onEditTransaction,
  onDeleteTransaction,
}: FinanceViewProps) => {
  const [period, setPeriod] = useState<FinancialFilterPeriod>('month');
  const [customRange, setCustomRange] = useState<CustomDateRange>({
    startDate: '',
    endDate: '',
  });
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [recordToDelete, setRecordToDelete] = useState<FinancialRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Accurate financial summary from saved records within the selected date range
  const summary = useMemo(() => {
    return calculateFinancialSummary(records, period, customRange);
  }, [records, period, customRange]);

  // Secondary filter for search and type on the period-filtered records
  const displayRecords = useMemo(() => {
    return summary.filteredRecords.filter((record) => {
      const matchesType = typeFilter === 'all' || record.type === typeFilter;
      if (!matchesType) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        record.title.toLowerCase().includes(q) ||
        record.categoryLabelBn.toLowerCase().includes(q) ||
        (record.notes && record.notes.toLowerCase().includes(q)) ||
        record.recordedBy.toLowerCase().includes(q) ||
        String(record.amount).includes(q)
      );
    });
  }, [summary.filteredRecords, typeFilter, searchQuery]);

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await onDeleteTransaction(recordToDelete.id);
      setIsDeleting(false);
      if (res && !res.success) {
        setDeleteError(res.error || 'রেকর্ডটি মুছে ফেলা যায়নি।');
        return;
      }
      setRecordToDelete(null);
    } catch (err) {
      setIsDeleting(false);
      setDeleteError(err instanceof Error ? err.message : 'মুছে ফেলা ব্যর্থ হয়েছে।');
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      {/* Top Banner & Primary Action */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-[#EAE2D0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#16402C]/10 text-[#16402C]">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#16402C]">খামারের আয় ও ব্যয় ব্যবস্থাপনা</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              পশুখাদ্য, চিকিৎসা, কর্মচারী বেতন, এবং দুধ ও জৈব সার বিক্রির নির্ভুল হিসাব
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAddExpense}
          className="self-start sm:self-auto px-5 py-3 rounded-2xl bg-[#16402C] hover:bg-[#123323] text-white font-bold text-sm shadow-xs flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 text-[#E5B842]" />
          <span>নতুন লেনদেন যোগ করুন</span>
        </button>
      </div>

      {deleteError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* Date Range Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#EAE2D0] shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-[#16402C]">
            <Calendar className="w-4 h-4 text-[#E5B842]" />
            <span>সময়কাল নির্বাচন:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                period === 'today'
                  ? 'bg-[#16402C] text-white shadow-xs'
                  : 'bg-[#FAF7F0] text-gray-600 hover:bg-[#F2ECE1]'
              }`}
            >
              আজ
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                period === 'month'
                  ? 'bg-[#16402C] text-white shadow-xs'
                  : 'bg-[#FAF7F0] text-gray-600 hover:bg-[#F2ECE1]'
              }`}
            >
              চলতি মাস
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                period === 'year'
                  ? 'bg-[#16402C] text-white shadow-xs'
                  : 'bg-[#FAF7F0] text-gray-600 hover:bg-[#F2ECE1]'
              }`}
            >
              চলতি বছর
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                period === 'all'
                  ? 'bg-[#16402C] text-white shadow-xs'
                  : 'bg-[#FAF7F0] text-gray-600 hover:bg-[#F2ECE1]'
              }`}
            >
              সকল সময়
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                period === 'custom'
                  ? 'bg-[#16402C] text-white shadow-xs'
                  : 'bg-[#FAF7F0] text-gray-600 hover:bg-[#F2ECE1]'
              }`}
            >
              কাস্টম তারিখ
            </button>
          </div>
        </div>

        {/* Custom Date Input Pickers */}
        {period === 'custom' && (
          <div className="pt-3 border-t border-[#F2ECE1] grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                শুরুর তারিখ
              </label>
              <input
                type="date"
                value={customRange.startDate}
                onChange={(e) =>
                  setCustomRange({ ...customRange, startDate: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:border-[#16402C] outline-hidden bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                শেষের তারিখ
              </label>
              <input
                type="date"
                value={customRange.endDate}
                onChange={(e) =>
                  setCustomRange({ ...customRange, endDate: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:border-[#16402C] outline-hidden bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3 Core Financial Summary Cards (Accurate Accounting) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {/* Total Income */}
        <div className="bg-[#FAF7F0] rounded-2xl p-4 border border-[#EAE2D0] flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-semibold text-gray-600">মোট অর্জিত আয়</p>
            <p className="text-2xl font-bold text-[#16402C] mt-1">
              ৳ {summary.totalIncome.toLocaleString('en-US')}
            </p>
            <p className="text-[11px] text-[#2A7A50] mt-0.5 font-medium">
              দুধ ও অন্যান্য প্রাপ্তি ({summary.incomeRecordsCount}টি এন্ট্রি)
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#EAF5EE] text-[#1B4D35] border border-[#C5E3D0]">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-[#FAF7F0] rounded-2xl p-4 border border-[#EAE2D0] flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-semibold text-gray-600">মোট পরিশোধিত ব্যয়</p>
            <p className="text-2xl font-bold text-[#9E2A2B] mt-1">
              ৳ {summary.totalExpenses.toLocaleString('en-US')}
            </p>
            <p className="text-[11px] text-[#9E2A2B] mt-0.5 font-medium">
              খাদ্য, বেতন, চিকিৎসা ({summary.expenseRecordsCount}টি এন্ট্রি)
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#FDF2F2] text-[#9E2A2B] border border-[#F8C8C8]">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        {/* Net Operating Result */}
        <div className="bg-[#FAF7F0] rounded-2xl p-4 border border-[#EAE2D0] flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-semibold text-gray-600">নিট পরিচালন ফলাফল</p>
            <p className={`text-2xl font-bold mt-1 ${
              summary.isSurplus ? 'text-[#16402C]' : 'text-[#9E2A2B]'
            }`}>
              {summary.isSurplus ? '+' : ''}৳ {summary.netOperatingResult.toLocaleString('en-US')}
            </p>
            <p className={`text-[11px] mt-0.5 font-bold ${
              summary.isSurplus ? 'text-[#2A7A50]' : 'text-[#9E2A2B]'
            }`}>
              {summary.statusLabelBn}
            </p>
          </div>
          <div className={`p-3 rounded-xl border ${
            summary.isSurplus
              ? 'bg-[#EAF5EE] text-[#1B4D35] border-[#C5E3D0]'
              : 'bg-[#FDF2F2] text-[#9E2A2B] border-[#F8C8C8]'
          }`}>
            {summary.isSurplus ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
          </div>
        </div>
      </div>

      {/* Accounting Clarification Note */}
      <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-amber-900 text-xs">
        <HelpCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
        <p>
          <strong>হিসাবরক্ষণ জ্ঞাতব্য:</strong> {summary.disclaimerBn}
        </p>
      </div>

      {/* Chart & Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Income vs Expense Chart */}
        <IncomeExpenseChart
          monthIncome={summary.totalIncome}
          monthExpenses={summary.totalExpenses}
          estimatedProfit={summary.netOperatingResult}
        />

        {/* Expense Category Breakdown & Payment Method Breakdown */}
        <div className="space-y-4">
          {/* Category-wise Expense Breakdown */}
          <div className="bg-white rounded-2xl p-4 md:p-6 border border-[#EBE4D5] shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-[#F2ECE1]">
              <div className="p-1.5 rounded-lg bg-[#9E2A2B]/10 text-[#9E2A2B]">
                <PieChart className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-[#16402C]">খাতভিত্তিক খরচের পর্যালোচনা</h3>
            </div>

            {summary.categoryBreakdown.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">
                নির্বাচিত সময়কালে কোনো খরচের হিসাব নেই।
              </p>
            ) : (
              <div className="space-y-3 mt-3">
                {summary.categoryBreakdown.map((item) => (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-700">
                        {item.categoryLabelBn} ({item.count}টি)
                      </span>
                      <span className="font-bold text-gray-900">
                        ৳ {item.totalAmount.toLocaleString('en-US')}{' '}
                        <span className="text-gray-400 font-normal">({item.percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="bg-[#9E2A2B] h-full rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-white rounded-2xl p-4 md:p-6 border border-[#EBE4D5] shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-[#F2ECE1]">
              <div className="p-1.5 rounded-lg bg-[#16402C]/10 text-[#16402C]">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-[#16402C]">লেনদেন মাধ্যমের সারসংক্ষেপ</h3>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-1">
              <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#EAE2D0] text-center">
                <span className="text-xs font-bold text-gray-700 block">নগদ (Cash)</span>
                <span className="text-xs text-[#16402C] font-extrabold block mt-1">
                  +৳ {summary.paymentMethodBreakdown.cash.income.toLocaleString('en-US')}
                </span>
                <span className="text-xs text-[#9E2A2B] font-extrabold block mt-0.5">
                  -৳ {summary.paymentMethodBreakdown.cash.expense.toLocaleString('en-US')}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#EAE2D0] text-center">
                <span className="text-xs font-bold text-gray-700 block">বিকাশ (bKash)</span>
                <span className="text-xs text-[#16402C] font-extrabold block mt-1">
                  +৳ {summary.paymentMethodBreakdown.bkash.income.toLocaleString('en-US')}
                </span>
                <span className="text-xs text-[#9E2A2B] font-extrabold block mt-0.5">
                  -৳ {summary.paymentMethodBreakdown.bkash.expense.toLocaleString('en-US')}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#EAE2D0] text-center">
                <span className="text-xs font-bold text-gray-700 block">ব্যাংক (Bank)</span>
                <span className="text-xs text-[#16402C] font-extrabold block mt-1">
                  +৳ {summary.paymentMethodBreakdown.bank.income.toLocaleString('en-US')}
                </span>
                <span className="text-xs text-[#9E2A2B] font-extrabold block mt-0.5">
                  -৳ {summary.paymentMethodBreakdown.bank.expense.toLocaleString('en-US')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction List Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-[#EAE2D0] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="বিবরণ, খাত বা ব্যক্তির নাম খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs focus:border-[#16402C] outline-hidden bg-white"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 w-full md:w-auto justify-end">
          <span className="text-xs font-bold text-gray-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> ধরন:
          </span>
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              typeFilter === 'all'
                ? 'bg-[#16402C] text-white shadow-xs'
                : 'bg-[#FAF7F0] text-gray-600 hover:bg-[#F2ECE1]'
            }`}
          >
            সকল ({summary.filteredRecords.length})
          </button>
          <button
            onClick={() => setTypeFilter('income')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              typeFilter === 'income'
                ? 'bg-[#2A7A50] text-white shadow-xs'
                : 'bg-[#FAF7F0] text-gray-600 hover:bg-[#F2ECE1]'
            }`}
          >
            শুধু আয় ({summary.incomeRecordsCount})
          </button>
          <button
            onClick={() => setTypeFilter('expense')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              typeFilter === 'expense'
                ? 'bg-[#9E2A2B] text-white shadow-xs'
                : 'bg-[#FAF7F0] text-gray-600 hover:bg-[#F2ECE1]'
            }`}
          >
            শুধু খরচ ({summary.expenseRecordsCount})
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-3xl border border-[#EAE2D0] shadow-xs divide-y divide-[#F4EFE2] overflow-hidden">
        {displayRecords.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF7F0] text-gray-400 flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-800">কোনো লেনদেন পাওয়া যায়নি</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchQuery
                ? 'আপনার খোঁজের সাথে মেলে এমন কোনো রেকর্ড নেই।'
                : 'নির্বাচিত মেয়াদে কোনো আর্থিক লেনদেন লিপিবদ্ধ করা হয়নি। নতুন হিসাব যোগ করতে উপরের বোতাম চাপুন।'}
            </p>
          </div>
        ) : (
          displayRecords.map((item) => {
            const isIncome = item.type === 'income';

            return (
              <div
                key={item.id}
                className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF7F0]/50 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-2xl shrink-0 ${
                      isIncome
                        ? 'bg-[#EAF5EE] text-[#1B4D35] border border-[#C5E3D0]'
                        : 'bg-[#FDF2F2] text-[#9E2A2B] border border-[#F8C8C8]'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm md:text-base text-gray-900">
                        {item.title}
                      </h4>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#FAF7F0] text-gray-600 border border-[#E8DFC9] font-medium">
                        {item.categoryLabelBn}
                      </span>
                      {item.relatedMilkRecordId && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold flex items-center gap-1">
                          <LinkIcon className="w-3 h-3" /> দুধ বিক্রয় হতে সংযুক্ত
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                      <span>তারিখ: {formatBanglaDate(item.date)}</span>
                      <span>•</span>
                      <span>
                        মাধ্যম:{' '}
                        {item.paymentMethod === 'cash'
                          ? 'নগদ'
                          : item.paymentMethod === 'bkash'
                          ? 'বিকাশ'
                          : 'ব্যাংক'}
                      </span>
                      <span>•</span>
                      <span>হিসাবকারী: {item.recordedBy}</span>
                      {item.notes && (
                        <>
                          <span>•</span>
                          <span className="italic text-gray-600">"{item.notes}"</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <div className="text-left sm:text-right">
                    <span
                      className={`text-base md:text-lg font-bold block ${
                        isIncome ? 'text-[#16402C]' : 'text-[#9E2A2B]'
                      }`}
                    >
                      {isIncome ? '+' : '-'} ৳{item.amount.toLocaleString('en-US')}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {isIncome ? 'প্রাপ্ত আয়' : 'পরিশোধিত ব্যয়'}
                    </span>
                  </div>

                  {/* Edit and Delete Actions */}
                  <div className="flex items-center gap-1 pl-2">
                    <button
                      onClick={() => onEditTransaction(item)}
                      title="সম্পাদনা করুন"
                      className="p-2 rounded-xl text-gray-500 hover:text-[#16402C] hover:bg-gray-100 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setRecordToDelete(item)}
                      title="মুছে ফেলুন"
                      className="p-2 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(recordToDelete)}
        onClose={() => setRecordToDelete(null)}
        onConfirm={handleDeleteConfirm}
        record={recordToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};
