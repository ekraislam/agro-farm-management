import type { 
  FinancialRecord, 
  TransactionType, 
  ExpenseCategory, 
  IncomeCategory 
} from '../types/farm';

export type FinancialFilterPeriod = 'today' | 'month' | 'year' | 'all' | 'custom';

export interface CustomDateRange {
  startDate: string; // ISO 'YYYY-MM-DD' or Bengali date string
  endDate: string;   // ISO 'YYYY-MM-DD' or Bengali date string
}

export interface CategoryBreakdownItem {
  category: string;
  categoryLabelBn: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface PaymentMethodBreakdown {
  cash: { income: number; expense: number; count: number };
  bkash: { income: number; expense: number; count: number };
  bank: { income: number; expense: number; count: number };
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netOperatingResult: number;
  isSurplus: boolean;
  statusLabelBn: string;
  operatingMarginPct: number;
  filteredRecords: FinancialRecord[];
  incomeRecordsCount: number;
  expenseRecordsCount: number;
  categoryBreakdown: CategoryBreakdownItem[];       // Expenses breakdown
  incomeCategoryBreakdown: CategoryBreakdownItem[]; // Income breakdown
  paymentMethodBreakdown: PaymentMethodBreakdown;
  disclaimerBn: string;
}

// ------------------------------------------------------------------------------
// 1. Monetary Rounding Helper (prevents JS floating-point imprecision)
// ------------------------------------------------------------------------------
export const roundMoney = (amount: number): number => {
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
};

// ------------------------------------------------------------------------------
// 2. Bengali & ISO Date Parsing Utilities
// ------------------------------------------------------------------------------
const BANGLA_DIGITS_MAP: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

const ENGLISH_TO_BANGLA_DIGITS: Record<string, string> = {
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
  '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',
};

const BANGLA_MONTHS: Record<string, number> = {
  'জানুয়ারি': 0, 'জানুয়ারি': 0,
  'ফেব্রুয়ারি': 1, 'ফেব্রুয়ারি': 1,
  'মার্চ': 2,
  'এপ্রিল': 3,
  'মে': 4,
  'জুন': 5,
  'জুলাই': 6,
  'আগস্ট': 7,
  'সেপ্টেম্বর': 8,
  'অক্টোবর': 9,
  'নভেম্বর': 10,
  'ডিসেম্বর': 11,
};

const MONTH_NAMES_BN = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export const banglaToEnglishDigits = (str: string): string => {
  return str.replace(/[০-৯]/g, (digit) => BANGLA_DIGITS_MAP[digit] || digit);
};

export const englishToBanglaDigits = (str: string | number): string => {
  return String(str).replace(/[0-9]/g, (digit) => ENGLISH_TO_BANGLA_DIGITS[digit] || digit);
};

/**
 * Normalizes either ISO 'YYYY-MM-DD' or Bengali '১০ অক্টোবর ২০২৬' into an ISO 'YYYY-MM-DD' string.
 */
export const toIsoDateString = (dateInput: string | Date): string => {
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return new Date().toISOString().split('T')[0];
    const y = dateInput.getFullYear();
    const m = String(dateInput.getMonth() + 1).padStart(2, '0');
    const d = String(dateInput.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const trimmed = dateInput.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Check for Bengali date e.g. "১০ অক্টোবর ২০২৬"
  const enStr = banglaToEnglishDigits(trimmed);
  const parts = enStr.split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const monthName = parts[1];
    const year = parseInt(parts[2], 10);

    const monthIndex = BANGLA_MONTHS[monthName];
    if (monthIndex !== undefined && !isNaN(day) && !isNaN(year)) {
      const m = String(monthIndex + 1).padStart(2, '0');
      const d = String(day).padStart(2, '0');
      return `${year}-${m}-${d}`;
    }
  }

  // Fallback to Date parser
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Default to today
  return new Date().toISOString().split('T')[0];
};

/**
 * Formats a Date or date string to readable Bengali format e.g. "১০ অক্টোবর ২০২৬".
 */
export const formatBanglaDate = (dateInput: string | Date): string => {
  const iso = toIsoDateString(dateInput);
  const [yearStr, monthStr, dayStr] = iso.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  const bnDay = englishToBanglaDigits(day);
  const bnMonth = MONTH_NAMES_BN[month] || '';
  const bnYear = englishToBanglaDigits(year);

  return `${bnDay} ${bnMonth} ${bnYear}`;
};

// ------------------------------------------------------------------------------
// 3. Category Labels Mapping
// ------------------------------------------------------------------------------
export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'feed', label: 'পশুখাদ্য' },
  { value: 'medicine', label: 'পশুচিকিৎসা ও ঔষধ' },
  { value: 'salary', label: 'কর্মচারীদের বেতন' },
  { value: 'utility', label: 'বিদ্যুৎ ও পানি বিল' },
  { value: 'maintenance', label: 'খামার রক্ষণাবেক্ষণ' },
  { value: 'biogas_maintenance', label: 'বায়োগ্যাস প্ল্যান্ট মেরামত' },
  { value: 'transport', label: 'পরিবহন ও যাতায়াত' },
  { value: 'other', label: 'অন্যান্য খরচ' },
];

export const INCOME_CATEGORIES: { value: IncomeCategory; label: string }[] = [
  { value: 'milk_sale', label: 'দুধ বিক্রি' },
  { value: 'slurry_sale', label: 'জৈব সার বা স্লারি বিক্রি' },
  { value: 'cattle_sale', label: 'গরু বা বাছুর বিক্রি' },
  { value: 'other_income', label: 'অন্যান্য আয়' },
];

export const getCategoryLabelBn = (category: string, type: TransactionType): string => {
  if (type === 'income') {
    const found = INCOME_CATEGORIES.find((c) => c.value === category);
    if (found) return found.label;
    if (category === 'calf_sale') return 'গরু বা বাছুর বিক্রি';
    return 'অন্যান্য আয়';
  }
  const found = EXPENSE_CATEGORIES.find((c) => c.value === category);
  if (found) return found.label;
  if (category === 'biogas_parts') return 'বায়োগ্যাস প্ল্যান্ট মেরামত';
  return 'অন্যান্য খরচ';
};

// ------------------------------------------------------------------------------
// 4. Period Filtering Logic
// ------------------------------------------------------------------------------
export const filterTransactionsByPeriod = (
  records: FinancialRecord[],
  period: FinancialFilterPeriod = 'all',
  customRange?: CustomDateRange,
  referenceDate?: Date
): FinancialRecord[] => {
  if (period === 'all') return records;

  const now = referenceDate ? new Date(referenceDate) : new Date();
  const currentIso = toIsoDateString(now);
  const [currentYear, currentMonth] = currentIso.split('-');

  return records.filter((r) => {
    const recordIso = toIsoDateString(r.date);
    if (!recordIso) return false;

    switch (period) {
      case 'today':
        return recordIso === currentIso;

      case 'month': {
        const [rYear, rMonth] = recordIso.split('-');
        return rYear === currentYear && rMonth === currentMonth;
      }

      case 'year': {
        const [rYear] = recordIso.split('-');
        return rYear === currentYear;
      }

      case 'custom': {
        if (!customRange?.startDate && !customRange?.endDate) return true;
        const startIso = customRange.startDate ? toIsoDateString(customRange.startDate) : '1970-01-01';
        const endIso = customRange.endDate ? toIsoDateString(customRange.endDate) : '2099-12-31';
        return recordIso >= startIso && recordIso <= endIso;
      }

      default:
        return true;
    }
  });
};

// ------------------------------------------------------------------------------
// 5. Accurate Financial Summary Calculation
// ------------------------------------------------------------------------------
export const calculateFinancialSummary = (
  records: FinancialRecord[],
  period: FinancialFilterPeriod = 'all',
  customRange?: CustomDateRange,
  referenceDate?: Date
): FinancialSummary => {
  const filtered = filterTransactionsByPeriod(records, period, customRange, referenceDate);

  let totalIncome = 0;
  let totalExpenses = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  const expenseCategoryMap = new Map<string, { count: number; totalAmount: number; label: string }>();
  const incomeCategoryMap = new Map<string, { count: number; totalAmount: number; label: string }>();

  const paymentBreakdown: PaymentMethodBreakdown = {
    cash: { income: 0, expense: 0, count: 0 },
    bkash: { income: 0, expense: 0, count: 0 },
    bank: { income: 0, expense: 0, count: 0 },
  };

  for (const item of filtered) {
    const amount = roundMoney(item.amount);
    const method = item.paymentMethod || 'cash';

    if (item.type === 'income') {
      totalIncome = roundMoney(totalIncome + amount);
      incomeCount += 1;

      // Group income by category
      const label = item.categoryLabelBn || getCategoryLabelBn(item.category, 'income');
      const prev = incomeCategoryMap.get(item.category) || { count: 0, totalAmount: 0, label };
      incomeCategoryMap.set(item.category, {
        count: prev.count + 1,
        totalAmount: roundMoney(prev.totalAmount + amount),
        label,
      });

      if (paymentBreakdown[method]) {
        paymentBreakdown[method].income = roundMoney(paymentBreakdown[method].income + amount);
        paymentBreakdown[method].count += 1;
      }
    } else if (item.type === 'expense') {
      totalExpenses = roundMoney(totalExpenses + amount);
      expenseCount += 1;

      // Group expense by category
      const label = item.categoryLabelBn || getCategoryLabelBn(item.category, 'expense');
      const prev = expenseCategoryMap.get(item.category) || { count: 0, totalAmount: 0, label };
      expenseCategoryMap.set(item.category, {
        count: prev.count + 1,
        totalAmount: roundMoney(prev.totalAmount + amount),
        label,
      });

      if (paymentBreakdown[method]) {
        paymentBreakdown[method].expense = roundMoney(paymentBreakdown[method].expense + amount);
        paymentBreakdown[method].count += 1;
      }
    }
  }

  // Net Operating Result = Total Income - Total Expenses (never add them)
  const netOperatingResult = roundMoney(totalIncome - totalExpenses);
  const isSurplus = netOperatingResult >= 0;
  const statusLabelBn = isSurplus ? 'পরিচালন উদ্বৃত্ত (লাভ)' : 'পরিচালন ঘাটতি (লোকসান)';

  const operatingMarginPct = totalIncome > 0
    ? roundMoney((netOperatingResult / totalIncome) * 100)
    : 0;

  // Build expense category breakdown items
  const categoryBreakdown: CategoryBreakdownItem[] = Array.from(expenseCategoryMap.entries())
    .map(([catKey, data]) => ({
      category: catKey,
      categoryLabelBn: data.label,
      count: data.count,
      totalAmount: data.totalAmount,
      percentage: totalExpenses > 0 ? roundMoney((data.totalAmount / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // Build income category breakdown items
  const incomeCategoryBreakdown: CategoryBreakdownItem[] = Array.from(incomeCategoryMap.entries())
    .map(([catKey, data]) => ({
      category: catKey,
      categoryLabelBn: data.label,
      count: data.count,
      totalAmount: data.totalAmount,
      percentage: totalIncome > 0 ? roundMoney((data.totalAmount / totalIncome) * 100) : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return {
    totalIncome,
    totalExpenses,
    netOperatingResult,
    isSurplus,
    statusLabelBn,
    operatingMarginPct,
    filteredRecords: filtered,
    incomeRecordsCount: incomeCount,
    expenseRecordsCount: expenseCount,
    categoryBreakdown,
    incomeCategoryBreakdown,
    paymentMethodBreakdown: paymentBreakdown,
    disclaimerBn: 'এটি নির্বাচিত মেয়াদের নিট পরিচালন উদ্বৃত্ত/ঘাটতি। প্রারম্ভিক নগদ তহবিল ও ক্যাশফ্লো হিসাব ব্যতীত এটিকে সমাপনী নগদ স্থিতি গণ্য করবেন না।',
  };
};

// ------------------------------------------------------------------------------
// 6. Transaction Form Validation
// ------------------------------------------------------------------------------
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateFinancialTransaction = (data: Partial<FinancialRecord>): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.title || data.title.trim() === '') {
    errors.title = 'অনুগ্রহ করে হিসাবের শিরোনাম বা বিবরণ লিখুন।';
  }

  const amt = Number(data.amount);
  if (isNaN(amt) || amt <= 0) {
    errors.amount = 'টাকার পরিমাণ শূন্য অপেক্ষা বেশি এবং সঠিক সংখ্যা হতে হবে।';
  }

  if (!data.date || data.date.trim() === '') {
    errors.date = 'লেনদেনের তারিখ প্রদান করা আবশ্যক।';
  }

  if (!data.category) {
    errors.category = 'লেনদেনের খাত (ক্যাটাগরি) নির্বাচন করুন।';
  }

  if (!data.paymentMethod || !['cash', 'bkash', 'bank'].includes(data.paymentMethod)) {
    errors.paymentMethod = 'সঠিক লেনদেন মাধ্যম (নগদ, বিকাশ, ব্যাংক) নির্বাচন করুন।';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
