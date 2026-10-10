import { describe, it, expect } from 'vitest';
import { 
  roundMoney, 
  calculateFinancialSummary, 
  filterTransactionsByPeriod, 
  validateFinancialTransaction,
  toIsoDateString,
  formatBanglaDate
} from '../accounting';
import type { FinancialRecord } from '../../types/farm';

describe('Accounting & Financial Calculations (Phase 3)', () => {
  const sampleTransactions: FinancialRecord[] = [
    {
      id: 'tx-1',
      date: '2026-10-10',
      type: 'income',
      category: 'milk_sale',
      categoryLabelBn: 'দুধ বিক্রি',
      title: 'দুধ বিক্রি',
      amount: 5960.50,
      paymentMethod: 'cash',
      recordedBy: 'আব্বু',
    },
    {
      id: 'tx-2',
      date: '2026-10-10',
      type: 'income',
      category: 'slurry_sale',
      categoryLabelBn: 'জৈব সার বা স্লারি বিক্রি',
      title: 'স্লারি বিক্রি',
      amount: 2000.25,
      paymentMethod: 'bkash',
      recordedBy: 'করিম',
    },
    {
      id: 'tx-3',
      date: '2026-10-09',
      type: 'expense',
      category: 'feed',
      categoryLabelBn: 'পশুখাদ্য',
      title: 'ভুসি ক্রয়',
      amount: 3000.70,
      paymentMethod: 'cash',
      recordedBy: 'আব্বু',
    },
    {
      id: 'tx-4',
      date: '2026-09-15',
      type: 'expense',
      category: 'salary',
      categoryLabelBn: 'কর্মচারীদের বেতন',
      title: 'সেপ্টেম্বর বেতন',
      amount: 4000.00,
      paymentMethod: 'bank',
      recordedBy: 'আব্বু',
    },
  ];

  it('1. Income totals are calculated correctly without floating-point errors', () => {
    // 5960.50 + 2000.25 = 7960.75
    const summary = calculateFinancialSummary(sampleTransactions, 'all');
    expect(summary.totalIncome).toBe(7960.75);
    expect(summary.incomeRecordsCount).toBe(2);
  });

  it('2. Expense totals are calculated correctly', () => {
    // 3000.70 + 4000.00 = 7000.70
    const summary = calculateFinancialSummary(sampleTransactions, 'all');
    expect(summary.totalExpenses).toBe(7000.70);
    expect(summary.expenseRecordsCount).toBe(2);
  });

  it('3. Net result is calculated correctly (Income - Expense, never adding them)', () => {
    // 7960.75 - 7000.70 = 960.05
    const summary = calculateFinancialSummary(sampleTransactions, 'all');
    expect(summary.netOperatingResult).toBe(960.05);
    expect(summary.isSurplus).toBe(true);
    expect(summary.statusLabelBn).toContain('উদ্বৃত্ত');

    // Verify accounting rule: never calculate profit by adding income + expense
    expect(summary.netOperatingResult).not.toBe(summary.totalIncome + summary.totalExpenses);

    // Deficit test
    const deficitRecords: FinancialRecord[] = [
      {
        id: 'tx-d1',
        date: '2026-10-10',
        type: 'income',
        category: 'milk_sale',
        categoryLabelBn: 'দুধ বিক্রি',
        title: 'অল্প বিক্রি',
        amount: 1000,
        paymentMethod: 'cash',
        recordedBy: 'আব্বু',
      },
      {
        id: 'tx-d2',
        date: '2026-10-10',
        type: 'expense',
        category: 'feed',
        categoryLabelBn: 'পশুখাদ্য',
        title: 'ভারী খরচ',
        amount: 2500,
        paymentMethod: 'cash',
        recordedBy: 'আব্বু',
      },
    ];
    const deficitSummary = calculateFinancialSummary(deficitRecords, 'all');
    expect(deficitSummary.netOperatingResult).toBe(-1500);
    expect(deficitSummary.isSurplus).toBe(false);
    expect(deficitSummary.statusLabelBn).toContain('ঘাটতি');
  });

  it('4. Date filters exclude transactions outside the selected range', () => {
    const refDate = new Date('2026-10-10T12:00:00Z');

    // 'today' filter
    const todaySummary = calculateFinancialSummary(sampleTransactions, 'today', undefined, refDate);
    expect(todaySummary.filteredRecords.length).toBe(2);
    expect(todaySummary.totalIncome).toBe(7960.75);
    expect(todaySummary.totalExpenses).toBe(0);

    // 'month' filter (October 2026) -> should include tx-1, tx-2, tx-3 but exclude September tx-4
    const monthSummary = calculateFinancialSummary(sampleTransactions, 'month', undefined, refDate);
    expect(monthSummary.filteredRecords.length).toBe(3);
    expect(monthSummary.filteredRecords.some((r) => r.id === 'tx-4')).toBe(false);
    expect(monthSummary.totalExpenses).toBe(3000.70);

    // Custom date range filter
    const customFiltered = filterTransactionsByPeriod(sampleTransactions, 'custom', {
      startDate: '2026-09-01',
      endDate: '2026-09-30',
    });
    expect(customFiltered.length).toBe(1);
    expect(customFiltered[0].id).toBe('tx-4');
  });

  it('5. Editing and deleting a transaction updates the summaries correctly', () => {
    // Original list
    let records = [...sampleTransactions];
    let summary = calculateFinancialSummary(records, 'all');
    expect(summary.totalIncome).toBe(7960.75);

    // Edit tx-1 amount from 5960.50 to 6000.00
    records = records.map((r) => r.id === 'tx-1' ? { ...r, amount: 6000.00 } : r);
    summary = calculateFinancialSummary(records, 'all');
    expect(summary.totalIncome).toBe(8000.25);
    expect(summary.netOperatingResult).toBe(roundMoney(8000.25 - 7000.70));

    // Delete tx-2 (2000.25 income)
    records = records.filter((r) => r.id !== 'tx-2');
    summary = calculateFinancialSummary(records, 'all');
    expect(summary.totalIncome).toBe(6000.00);
    expect(summary.netOperatingResult).toBe(roundMoney(6000.00 - 7000.70));
    expect(summary.isSurplus).toBe(false); // now in deficit
  });

  it('6. Invalid or negative amounts are rejected by validation', () => {
    // Negative amount
    const invalidNegative = validateFinancialTransaction({
      title: 'ভুল খরচ',
      amount: -500,
      date: '2026-10-10',
      category: 'feed',
      paymentMethod: 'cash',
    });
    expect(invalidNegative.isValid).toBe(false);
    expect(invalidNegative.errors.amount).toBeDefined();

    // Zero amount
    const invalidZero = validateFinancialTransaction({
      title: 'শূন্য টাকা',
      amount: 0,
      date: '2026-10-10',
      category: 'feed',
      paymentMethod: 'cash',
    });
    expect(invalidZero.isValid).toBe(false);
    expect(invalidZero.errors.amount).toBeDefined();

    // Empty title
    const invalidTitle = validateFinancialTransaction({
      title: '',
      amount: 500,
      date: '2026-10-10',
      category: 'feed',
      paymentMethod: 'cash',
    });
    expect(invalidTitle.isValid).toBe(false);
    expect(invalidTitle.errors.title).toBeDefined();

    // Valid transaction
    const valid = validateFinancialTransaction({
      title: 'সঠিক খরচ',
      amount: 500,
      date: '2026-10-10',
      category: 'feed',
      paymentMethod: 'cash',
    });
    expect(valid.isValid).toBe(true);
    expect(Object.keys(valid.errors).length).toBe(0);
  });

  it('handles empty datasets safely without NaN or Division by Zero', () => {
    const emptySummary = calculateFinancialSummary([], 'all');
    expect(emptySummary.totalIncome).toBe(0);
    expect(emptySummary.totalExpenses).toBe(0);
    expect(emptySummary.netOperatingResult).toBe(0);
    expect(emptySummary.operatingMarginPct).toBe(0);
    expect(emptySummary.categoryBreakdown).toEqual([]);
    expect(emptySummary.incomeCategoryBreakdown).toEqual([]);
    expect(Number.isNaN(emptySummary.netOperatingResult)).toBe(false);
  });

  it('handles Bengali date conversions accurately', () => {
    const iso = toIsoDateString('১০ অক্টোবর ২০২৬');
    expect(iso).toBe('2026-10-10');

    const formatted = formatBanglaDate('2026-10-10');
    expect(formatted).toBe('১০ অক্টোবর ২০২৬');
  });
});
