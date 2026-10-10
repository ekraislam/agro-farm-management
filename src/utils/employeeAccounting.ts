import type { 
  Employee, 
  AttendanceRecord, 
  MonthlyAttendanceSummary, 
  PayrollStatus, 
  FinancialRecord,
  AttendanceStatus 
} from '../types/farm';
import { roundMoney } from './accounting';

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, { bn: string; badgeClass: string; dotClass: string }> = {
  present: {
    bn: 'উপস্থিত',
    badgeClass: 'bg-[#EAF5EE] text-[#1B4D35] border-[#C5E3D0]',
    dotClass: 'bg-[#2A7A50]',
  },
  absent: {
    bn: 'অনুপস্থিত',
    badgeClass: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]',
    dotClass: 'bg-[#DC2626]',
  },
  leave: {
    bn: 'ছুটি',
    badgeClass: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
    dotClass: 'bg-[#D97706]',
  },
};

export interface EmployeeValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates employee input data.
 */
export function validateEmployee(
  emp: Partial<Employee>,
  existingEmployees: Employee[],
  currentId?: string
): EmployeeValidationResult {
  const errors: Record<string, string> = {};

  if (!emp.name || emp.name.trim().length === 0) {
    errors.name = 'কর্মচারীর নাম দেওয়া আবশ্যক।';
  }

  if (!emp.role || emp.role.trim().length === 0) {
    errors.role = 'পদবী বা নির্ধারিত দায়িত্ব উল্লেখ করুন।';
  }

  if (emp.salaryMonthly === undefined || emp.salaryMonthly === null || isNaN(emp.salaryMonthly)) {
    errors.salaryMonthly = 'মাসিক বেতনের পরিমাণ লিখুন।';
  } else if (emp.salaryMonthly < 0) {
    errors.salaryMonthly = 'বেতন ঋণাত্মক (নেগেটিভ) হতে পারে না।';
  }

  // Check duplicate employee name if adding new
  const duplicate = existingEmployees.find(
    (e) => (!currentId || e.id !== currentId) && e.name.trim().toLowerCase() === (emp.name || '').trim().toLowerCase()
  );
  if (duplicate) {
    errors.name = 'এই নামের একজন কর্মী ইতিমধ্যে তালিকায় রয়েছে।';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates daily attendance entry.
 */
export function validateAttendance(record: Partial<AttendanceRecord>): { isValid: boolean; error?: string } {
  if (!record.employeeId) {
    return { isValid: false, error: 'কর্মচারী নির্বাচন করা আবশ্যক।' };
  }
  if (!record.date) {
    return { isValid: false, error: 'উপস্থিতির তারিখ নির্ধারণ করুন।' };
  }
  if (!record.status || !['present', 'absent', 'leave'].includes(record.status)) {
    return { isValid: false, error: 'উপস্থিতি স্ট্যাটাস (উপস্থিত / অনুপস্থিত / ছুটি) নির্ধারণ করুন।' };
  }
  return { isValid: true };
}

/**
 * Normalizes date to YYYY-MM prefix for month filtering
 */
export function extractYearMonth(dateStr: string): string {
  if (!dateStr) return '';
  // Check ISO format YYYY-MM-DD
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}`;
  }
  // Fallback for Bengali date strings like "১০ অক্টোবর ২০২৬" -> "2026-10"
  if (dateStr.includes('অক্টোবর') || dateStr.includes('October')) {
    const yearMatch = dateStr.match(/(\d{4})/);
    const yr = yearMatch ? yearMatch[1] : (dateStr.includes('২০২৬') ? '2026' : '');
    return yr ? `${yr}-10` : '';
  }
  return dateStr.slice(0, 7);
}

/**
 * Calculates monthly attendance summary for an employee.
 */
export function calculateMonthlyAttendance(
  attendanceRecords: AttendanceRecord[],
  employeeId: string,
  targetMonth: string // e.g. "2026-10"
): MonthlyAttendanceSummary {
  const filtered = attendanceRecords.filter((r) => {
    if (r.employeeId !== employeeId) return false;
    const rMonth = extractYearMonth(r.date);
    return rMonth === targetMonth || (r.date && r.date.includes(targetMonth));
  });

  const presentDays = filtered.filter((r) => r.status === 'present').length;
  const absentDays = filtered.filter((r) => r.status === 'absent').length;
  const leaveDays = filtered.filter((r) => r.status === 'leave').length;
  const totalRecordedDays = filtered.length;
  const attendanceRatePercent = totalRecordedDays > 0 ? Math.round((presentDays / totalRecordedDays) * 100) : 0;

  return {
    employeeId,
    month: targetMonth,
    presentDays,
    absentDays,
    leaveDays,
    totalRecordedDays,
    attendanceRatePercent,
  };
}

/**
 * Calculates payroll status for an employee for a specific period.
 * Strict rule: configured salary NEVER creates an expense;
 * Only explicit confirmed transactions create paid amounts.
 */
export function calculatePayrollStatus(
  employee: Employee,
  financialRecords: FinancialRecord[],
  targetPeriod: string // e.g. "2026-10" or "অক্টোবর ২০২৬"
): PayrollStatus {
  // Find salary payment expenses for this employee and period
  const payments = financialRecords.filter((tx) => {
    if (tx.type !== 'expense' || tx.category !== 'salary') return false;
    
    // Check direct employee reference
    const matchesEmp = tx.relatedEmployeeId === employee.id || 
      (tx.title && tx.title.includes(employee.name));
    if (!matchesEmp) return false;

    // Check period match
    if (tx.salaryPeriod) {
      return tx.salaryPeriod === targetPeriod || tx.salaryPeriod.includes(targetPeriod);
    }
    // Fallback: check transaction date
    const txMonth = extractYearMonth(tx.date);
    return txMonth === targetPeriod || (tx.date && tx.date.includes(targetPeriod));
  });

  const paidAmount = roundMoney(payments.reduce((sum, p) => sum + p.amount, 0));
  const dueAmount = roundMoney(Math.max(0, employee.salaryMonthly - paidAmount));

  let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
  let statusBn = 'বকেয়া';

  if (paidAmount >= employee.salaryMonthly && employee.salaryMonthly > 0) {
    status = 'paid';
    statusBn = 'পরিশোধিত';
  } else if (paidAmount > 0) {
    status = 'partial';
    statusBn = 'আংশিক পরিশোধিত';
  } else {
    status = 'unpaid';
    statusBn = 'বকেয়া';
  }

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    monthlySalary: employee.salaryMonthly,
    salaryPeriod: targetPeriod,
    paidAmount,
    dueAmount,
    status,
    statusBn,
    payments,
  };
}

/**
 * Validates a new salary payment transaction to prevent duplicates and ensure validity.
 */
export function validateSalaryPayment(
  employee: Employee,
  amount: number,
  period: string,
  existingTransactions: FinancialRecord[],
  paymentDate: string
): { isValid: boolean; error?: string } {
  if (!employee || !employee.id) {
    return { isValid: false, error: 'কর্মচারী নির্বাচন করা আবশ্যক।' };
  }
  if (!amount || isNaN(amount) || amount <= 0) {
    return { isValid: false, error: 'পরিশোধের পরিমাণ অবশ্যই ০ টাকার বেশি হতে হবে।' };
  }
  if (!period || period.trim().length === 0) {
    return { isValid: false, error: 'বেতনের মাস/পিরিয়ড নির্বাচন করুন।' };
  }
  if (!paymentDate) {
    return { isValid: false, error: 'পরিশোধের তারিখ প্রদান করুন।' };
  }

  // Prevent exact duplicate payment (same employee, same period, same date, same amount)
  const isDuplicate = existingTransactions.some((tx) => {
    if (tx.type !== 'expense' || tx.category !== 'salary') return false;
    const sameEmp = tx.relatedEmployeeId === employee.id || tx.title.includes(employee.name);
    const samePeriod = tx.salaryPeriod === period;
    const sameDate = tx.date === paymentDate;
    const sameAmount = Math.abs(tx.amount - amount) < 0.01;
    return sameEmp && samePeriod && sameDate && sameAmount;
  });

  if (isDuplicate) {
    return { 
      isValid: false, 
      error: `এই তারিখে ${employee.name}-এর জন্য ${period} মেয়াদের একই পরিমাণ বেতনের লেনদেন ইতিমধ্যে সংরক্ষিত রয়েছে (ডুপ্লিকেট প্রতিরোধ)।` 
    };
  }

  return { isValid: true };
}
