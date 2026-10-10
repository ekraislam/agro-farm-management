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
  PayrollStatus,
} from '../types/farm';
import { 
  roundMoney, 
  toIsoDateString, 
  formatBanglaDate, 
  englishToBanglaDigits, 
  calculateFinancialSummary,
} from './accounting';
import type { FinancialSummary } from './accounting';
import { 
  calculateDailyFarmMilkProduction, 
} from './milkAccounting';
import { 
  calculatePayrollStatus, 
} from './employeeAccounting';

export type ReportDateRangeType = 
  | 'today' 
  | 'last7days' 
  | 'thisMonth' 
  | 'lastMonth' 
  | 'thisYear' 
  | 'allTime' 
  | 'custom';

export interface DateRangeResult {
  startDate: string; // ISO YYYY-MM-DD
  endDate: string;   // ISO YYYY-MM-DD
  labelBn: string;
}

/**
 * Calculates start and end ISO dates for standard report filtering periods.
 * All ranges have an explicitly inclusive endDate.
 */
export function getReportDateRange(
  period: ReportDateRangeType,
  customStart?: string,
  customEnd?: string,
  referenceDate?: Date
): DateRangeResult {
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  const todayIso = toIsoDateString(ref);

  switch (period) {
    case 'today':
      return {
        startDate: todayIso,
        endDate: todayIso,
        labelBn: `আজ (${formatBanglaDate(todayIso)})`,
      };

    case 'last7days': {
      const past7 = new Date(ref);
      past7.setDate(past7.getDate() - 6);
      const startIso = toIsoDateString(past7);
      return {
        startDate: startIso,
        endDate: todayIso,
        labelBn: `গত ৭ দিন (${formatBanglaDate(startIso)} থেকে ${formatBanglaDate(todayIso)})`,
      };
    }

    case 'thisMonth': {
      const y = ref.getFullYear();
      const m = ref.getMonth();
      const startOfMonth = new Date(y, m, 1);
      const endOfMonth = new Date(y, m + 1, 0); // Last day of current month
      const startIso = toIsoDateString(startOfMonth);
      const endIso = toIsoDateString(endOfMonth);
      return {
        startDate: startIso,
        endDate: endIso,
        labelBn: `চলতি মাস (${formatBanglaDate(startIso)} থেকে ${formatBanglaDate(endIso)})`,
      };
    }

    case 'lastMonth': {
      const y = ref.getFullYear();
      const m = ref.getMonth();
      const startOfLastMonth = new Date(y, m - 1, 1);
      const endOfLastMonth = new Date(y, m, 0);
      const startIso = toIsoDateString(startOfLastMonth);
      const endIso = toIsoDateString(endOfLastMonth);
      return {
        startDate: startIso,
        endDate: endIso,
        labelBn: `গত মাস (${formatBanglaDate(startIso)} থেকে ${formatBanglaDate(endIso)})`,
      };
    }

    case 'thisYear': {
      const y = ref.getFullYear();
      const startOfYear = `${y}-01-01`;
      const endOfYear = `${y}-12-31`;
      return {
        startDate: startOfYear,
        endDate: endOfYear,
        labelBn: `চলতি বছর (${englishToBanglaDigits(y)})`,
      };
    }

    case 'custom': {
      const startIso = customStart ? toIsoDateString(customStart) : todayIso;
      const endIso = customEnd ? toIsoDateString(customEnd) : todayIso;
      // Ensure start <= end
      const [finalStart, finalEnd] = startIso <= endIso ? [startIso, endIso] : [endIso, startIso];
      return {
        startDate: finalStart,
        endDate: finalEnd,
        labelBn: `${formatBanglaDate(finalStart)} থেকে ${formatBanglaDate(finalEnd)}`,
      };
    }

    case 'allTime':
    default:
      return {
        startDate: '2020-01-01',
        endDate: '2099-12-31',
        labelBn: 'সর্বমোট সময়কাল',
      };
  }
}

/**
 * Checks if a given date string falls within [startDate, endDate] inclusively.
 */
export function isDateInRange(dateInput: string | Date, startDate: string, endDate: string): boolean {
  if (!dateInput) return false;
  const targetIso = toIsoDateString(dateInput);
  return targetIso >= startDate && targetIso <= endDate;
}

// ------------------------------------------------------------------------------
// 1. Financial Report Analytics
// ------------------------------------------------------------------------------
export interface FinancialReportData {
  summary: FinancialSummary;
  dateRange: DateRangeResult;
  monthlyTrend: {
    month: string;
    monthBn: string;
    income: number;
    expense: number;
    net: number;
  }[];
}

export function generateFinancialReport(
  records: FinancialRecord[],
  dateRange: DateRangeResult
): FinancialReportData {
  const summary = calculateFinancialSummary(records, 'custom', {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  // Monthly trend grouping across all records or within the selected range
  const monthMap = new Map<string, { income: number; expense: number }>();
  for (const r of summary.filteredRecords) {
    const iso = toIsoDateString(r.date);
    const yMonth = iso.slice(0, 7); // 'YYYY-MM'
    const cur = monthMap.get(yMonth) || { income: 0, expense: 0 };
    if (r.type === 'income') {
      cur.income = roundMoney(cur.income + r.amount);
    } else {
      cur.expense = roundMoney(cur.expense + r.amount);
    }
    monthMap.set(yMonth, cur);
  }

  const monthlyTrend = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => {
      const [y, m] = month.split('-');
      const monthNames = [
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
      ];
      const mIdx = parseInt(m, 10) - 1;
      const monthBn = `${monthNames[mIdx] || month} ${englishToBanglaDigits(y)}`;
      return {
        month,
        monthBn,
        income: data.income,
        expense: data.expense,
        net: roundMoney(data.income - data.expense),
      };
    });

  return {
    summary,
    dateRange,
    monthlyTrend,
  };
}

// ------------------------------------------------------------------------------
// 2. Milk Production & Sales Report Analytics
// ------------------------------------------------------------------------------
export interface DailyMilkBreakdownItem {
  date: string;
  dateBn: string;
  morningLiters: number;
  eveningLiters: number;
  totalLiters: number;
  soldLiters: number;
  revenueTk: number;
  retainedLiters: number;
  method: 'aggregate' | 'individual_sum';
}

export interface CowMilkSummaryItem {
  cowId: string;
  cowTag: string;
  cowName: string;
  totalLiters: number;
  morningLiters: number;
  eveningLiters: number;
  recordCount: number;
  dailyAvgLiters: number;
}

export interface MilkMonthlyTrendItem {
  month: string;
  monthBn: string;
  collectedLiters: number;
  soldLiters: number;
  revenueTk: number;
  retainedLiters: number;
}

export interface MilkReportData {
  dateRange: DateRangeResult;
  totalCollectedLiters: number;
  totalMorningLiters: number;
  totalEveningLiters: number;
  totalSoldLiters: number;
  totalRevenueTk: number;
  totalRetainedLiters: number;
  distinctDaysCount: number;
  averageDailyCollection: number;
  dailyBreakdown: DailyMilkBreakdownItem[];
  cowBreakdown: CowMilkSummaryItem[];
  monthlyTrend: MilkMonthlyTrendItem[];
}

export function generateMilkReport(
  records: MilkRecord[],
  cows: Cow[],
  dateRange: DateRangeResult
): MilkReportData {
  // Filter records within the date range
  const filteredRecords = records.filter((r) =>
    isDateInRange(r.date, dateRange.startDate, dateRange.endDate)
  );

  const distinctDates = Array.from(
    new Set(filteredRecords.map((r) => toIsoDateString(r.date)))
  ).sort((a, b) => b.localeCompare(a)); // Newest first

  let totalCollectedLiters = 0;
  let totalMorningLiters = 0;
  let totalEveningLiters = 0;
  let totalSoldLiters = 0;
  let totalRevenueTk = 0;

  const dailyBreakdown: DailyMilkBreakdownItem[] = [];

  for (const d of distinctDates) {
    // calculate daily production strictly without double-counting aggregate and cow records
    const dailyProd = calculateDailyFarmMilkProduction(filteredRecords, d);
    totalCollectedLiters = roundMoney(totalCollectedLiters + dailyProd.totalLiters);
    totalMorningLiters = roundMoney(totalMorningLiters + dailyProd.morningLiters);
    totalEveningLiters = roundMoney(totalEveningLiters + dailyProd.eveningLiters);

    // Sales on that date
    const dayRecords = filteredRecords.filter((r) => toIsoDateString(r.date) === d);
    const daySoldRecords = dayRecords.filter((r) => r.isSold && r.totalAmount > 0);
    const daySoldLiters = roundMoney(
      daySoldRecords.reduce((sum, r) => sum + (r.soldLiters ?? r.totalLiters), 0)
    );
    const dayRevenueTk = roundMoney(
      daySoldRecords.reduce((sum, r) => sum + r.totalAmount, 0)
    );

    totalSoldLiters = roundMoney(totalSoldLiters + daySoldLiters);
    totalRevenueTk = roundMoney(totalRevenueTk + dayRevenueTk);

    const retainedLiters = roundMoney(Math.max(0, dailyProd.totalLiters - daySoldLiters));

    dailyBreakdown.push({
      date: d,
      dateBn: formatBanglaDate(d),
      morningLiters: dailyProd.morningLiters,
      eveningLiters: dailyProd.eveningLiters,
      totalLiters: dailyProd.totalLiters,
      soldLiters: daySoldLiters,
      revenueTk: dayRevenueTk,
      retainedLiters,
      method: dailyProd.hasAggregate ? 'aggregate' : 'individual_sum',
    });
  }

  const distinctDaysCount = distinctDates.length;
  const averageDailyCollection =
    distinctDaysCount > 0 ? roundMoney(totalCollectedLiters / distinctDaysCount) : 0;
  const totalRetainedLiters = roundMoney(Math.max(0, totalCollectedLiters - totalSoldLiters));

  // Cow breakdown (from individual entries in the period)
  const cowMap = new Map<
    string,
    { morning: number; evening: number; total: number; count: number }
  >();

  for (const r of filteredRecords) {
    if (r.cowId && (r.entryType === 'individual' || r.cowId)) {
      const cur = cowMap.get(r.cowId) || { morning: 0, evening: 0, total: 0, count: 0 };
      cur.morning = roundMoney(cur.morning + r.morningLiters);
      cur.evening = roundMoney(cur.evening + r.eveningLiters);
      cur.total = roundMoney(cur.total + r.totalLiters);
      cur.count += 1;
      cowMap.set(r.cowId, cur);
    }
  }

  const cowBreakdown: CowMilkSummaryItem[] = Array.from(cowMap.entries()).map(
    ([cowId, data]) => {
      const cow = cows.find((c) => c.id === cowId);
      return {
        cowId,
        cowTag: cow?.tagNumber || cowId,
        cowName: cow?.name || 'অজ্ঞাত গাভী',
        totalLiters: data.total,
        morningLiters: data.morning,
        eveningLiters: data.evening,
        recordCount: data.count,
        dailyAvgLiters: data.count > 0 ? roundMoney(data.total / data.count) : 0,
      };
    }
  );

  // Monthly trend grouping (avoiding double counting via daily production per date)
  const monthGroupMap = new Map<
    string,
    { collected: number; sold: number; revenue: number }
  >();

  for (const dayItem of dailyBreakdown) {
    const yMonth = dayItem.date.slice(0, 7);
    const cur = monthGroupMap.get(yMonth) || { collected: 0, sold: 0, revenue: 0 };
    cur.collected = roundMoney(cur.collected + dayItem.totalLiters);
    cur.sold = roundMoney(cur.sold + dayItem.soldLiters);
    cur.revenue = roundMoney(cur.revenue + dayItem.revenueTk);
    monthGroupMap.set(yMonth, cur);
  }

  const monthNames = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const monthlyTrend: MilkMonthlyTrendItem[] = Array.from(monthGroupMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => {
      const [y, m] = month.split('-');
      const mIdx = parseInt(m, 10) - 1;
      const monthBn = `${monthNames[mIdx] || month} ${englishToBanglaDigits(y)}`;
      return {
        month,
        monthBn,
        collectedLiters: data.collected,
        soldLiters: data.sold,
        revenueTk: data.revenue,
        retainedLiters: roundMoney(Math.max(0, data.collected - data.sold)),
      };
    });

  return {
    dateRange,
    totalCollectedLiters,
    totalMorningLiters,
    totalEveningLiters,
    totalSoldLiters,
    totalRevenueTk,
    totalRetainedLiters,
    distinctDaysCount,
    averageDailyCollection,
    dailyBreakdown,
    cowBreakdown,
    monthlyTrend,
  };
}

// ------------------------------------------------------------------------------
// 3. Cow Health & Veterinary Report Analytics
// ------------------------------------------------------------------------------
export interface CowHealthSummaryItem {
  id: string;
  cowId: string;
  cowTag: string;
  cowName: string;
  eventDate: string;
  eventDateBn: string;
  eventType: string;
  eventTypeBn: string;
  treatmentName: string;
  doctorName?: string;
  notes?: string;
  cost: number;
  nextDueDate?: string;
}

export interface HealthReportData {
  dateRange: DateRangeResult;
  totalActiveCows: number;
  totalArchivedCows: number;
  cowsByStatus: Record<string, number>;
  totalHealthEvents: number;
  totalHealthCostTk: number;
  vaccinationsCount: number;
  treatmentsCount: number;
  vetVisitsCount: number;
  dewormingCount: number;
  eventsList: CowHealthSummaryItem[];
  overdueRemindersCount: number;
  upcomingRemindersCount: number;
}

export function generateHealthReport(
  healthRecords: HealthRecord[],
  cows: Cow[],
  reminders: ReminderTask[],
  dateRange: DateRangeResult
): HealthReportData {
  const activeCows = cows.filter((c) => !c.isArchived);
  const archivedCows = cows.filter((c) => c.isArchived);
  const cowsByStatus: Record<string, number> = {
    milking: 0,
    pregnant: 0,
    dry: 0,
    calf: 0,
    sick: 0,
    sold: 0,
    other: 0,
  };

  for (const c of cows) {
    cowsByStatus[c.status] = (cowsByStatus[c.status] || 0) + 1;
  }

  // Filter health records in date range - preserved for both active and archived cows!
  const filteredHealth = healthRecords.filter((h) =>
    isDateInRange(h.eventDate, dateRange.startDate, dateRange.endDate)
  );

  let totalCost = 0;
  let vaccinationsCount = 0;
  let treatmentsCount = 0;
  let vetVisitsCount = 0;
  let dewormingCount = 0;

  const eventLabelsBn: Record<string, string> = {
    vaccination: 'টিকা প্রদান',
    deworming: 'কৃমিনাশক',
    vet_consultation: 'ডাক্তার ভিজিট',
    treatment: 'চিকিৎসা ও ঔষধ',
    other: 'অন্যান্য স্বাস্থ্যসেবা',
  };

  const eventsList: CowHealthSummaryItem[] = filteredHealth.map((h) => {
    const cow = cows.find((c) => c.id === h.cowId);
    const cost = roundMoney(h.cost || 0);
    totalCost = roundMoney(totalCost + cost);

    if (h.eventType === 'vaccination') vaccinationsCount += 1;
    else if (h.eventType === 'deworming') dewormingCount += 1;
    else if (h.eventType === 'vet_consultation') vetVisitsCount += 1;
    else if (h.eventType === 'treatment') treatmentsCount += 1;

    return {
      id: h.id,
      cowId: h.cowId,
      cowTag: cow?.tagNumber || h.cowTag || 'ট্যাগ বিহীন',
      cowName: cow?.name || h.cowName || 'অজ্ঞাত গাভী',
      eventDate: h.eventDate,
      eventDateBn: formatBanglaDate(h.eventDate),
      eventType: h.eventType,
      eventTypeBn: eventLabelsBn[h.eventType] || h.eventType,
      treatmentName: h.treatmentName,
      doctorName: h.doctorName,
      notes: h.notes,
      cost,
      nextDueDate: h.nextDueDate,
    };
  });

  const todayIso = toIsoDateString(new Date());
  const healthReminders = reminders.filter(
    (r) => !r.completed && (r.category === 'vaccine' || r.category === 'vet' || r.category === 'medicine')
  );
  const overdueRemindersCount = healthReminders.filter(
    (r) => toIsoDateString(r.dueDate) < todayIso
  ).length;
  const upcomingRemindersCount = healthReminders.filter(
    (r) => toIsoDateString(r.dueDate) >= todayIso
  ).length;

  return {
    dateRange,
    totalActiveCows: activeCows.length,
    totalArchivedCows: archivedCows.length,
    cowsByStatus,
    totalHealthEvents: filteredHealth.length,
    totalHealthCostTk: totalCost,
    vaccinationsCount,
    treatmentsCount,
    vetVisitsCount,
    dewormingCount,
    eventsList,
    overdueRemindersCount,
    upcomingRemindersCount,
  };
}

// ------------------------------------------------------------------------------
// 4. Employee, Attendance & Payroll Report Analytics
// ------------------------------------------------------------------------------
export interface EmployeeAttendanceReportItem {
  employeeId: string;
  name: string;
  role: string;
  salaryMonthly: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  totalRecordedDays: number;
  attendanceRate: number;
  assignedTasksCount: number;
  completedTasksCount: number;
  pendingTasksCount: number;
  payrollStatus: PayrollStatus;
}

export interface EmployeeMonthlyAttendanceTrend {
  month: string;
  monthBn: string;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  totalRecordedDays: number;
}

export interface EmployeeReportData {
  dateRange: DateRangeResult;
  totalActiveEmployees: number;
  totalArchivedEmployees: number;
  totalPresentDays: number;
  totalAbsentDays: number;
  totalLeaveDays: number;
  totalRecordedDays: number;
  totalConfiguredSalaryTk: number;
  totalPaidSalaryTk: number;
  employeeSummaries: EmployeeAttendanceReportItem[];
  monthlyAttendanceTrends: EmployeeMonthlyAttendanceTrend[];
}

export function generateEmployeeReport(
  employees: Employee[],
  attendanceRecords: AttendanceRecord[],
  financialRecords: FinancialRecord[],
  dateRange: DateRangeResult,
  reminders: ReminderTask[] = []
): EmployeeReportData {
  const activeEmployees = employees.filter((e) => !e.isArchived);
  const archivedEmployees = employees.filter((e) => e.isArchived);

  // Filter attendance in range
  const filteredAttendance = attendanceRecords.filter((a) =>
    isDateInRange(a.date, dateRange.startDate, dateRange.endDate)
  );

  let totalPresent = 0;
  let totalAbsent = 0;
  let totalLeave = 0;

  for (const a of filteredAttendance) {
    if (a.status === 'present') totalPresent += 1;
    else if (a.status === 'absent') totalAbsent += 1;
    else if (a.status === 'leave') totalLeave += 1;
  }

  // Monthly or range salary payments
  const currentYearMonth = dateRange.startDate.slice(0, 7); // 'YYYY-MM'

  let totalConfiguredSalary = 0;
  let totalPaidSalary = 0;

  const employeeSummaries: EmployeeAttendanceReportItem[] = employees.map((emp) => {
    if (!emp.isArchived) {
      totalConfiguredSalary += emp.salaryMonthly;
    }

    const empAtt = filteredAttendance.filter((a) => a.employeeId === emp.id);
    const presentDays = empAtt.filter((a) => a.status === 'present').length;
    const absentDays = empAtt.filter((a) => a.status === 'absent').length;
    const leaveDays = empAtt.filter((a) => a.status === 'leave').length;
    const totalRecordedDays = empAtt.length;
    const attendanceRate =
      totalRecordedDays > 0 ? Math.round((presentDays / totalRecordedDays) * 100) : 0;

    const payroll = calculatePayrollStatus(emp, financialRecords, currentYearMonth);
    totalPaidSalary = roundMoney(totalPaidSalary + payroll.paidAmount);

    // Calculate assigned, completed, and pending tasks for this employee
    const empTasks = reminders.filter(
      (t) => t.assignedEmployeeId === emp.id || t.assignedTo === emp.name
    );
    const assignedTasksCount = empTasks.length;
    const completedTasksCount = empTasks.filter((t) => t.completed).length;
    const pendingTasksCount = empTasks.filter((t) => !t.completed).length;

    return {
      employeeId: emp.id,
      name: emp.name,
      role: emp.role,
      salaryMonthly: emp.salaryMonthly,
      presentDays,
      absentDays,
      leaveDays,
      totalRecordedDays,
      attendanceRate,
      assignedTasksCount,
      completedTasksCount,
      pendingTasksCount,
      payrollStatus: payroll,
    };
  });

  // Monthly attendance grouping
  const monthNames = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const monthAttMap = new Map<string, { present: number; absent: number; leave: number; total: number }>();
  for (const a of filteredAttendance) {
    const yMonth = toIsoDateString(a.date).slice(0, 7);
    const cur = monthAttMap.get(yMonth) || { present: 0, absent: 0, leave: 0, total: 0 };
    if (a.status === 'present') cur.present += 1;
    else if (a.status === 'absent') cur.absent += 1;
    else if (a.status === 'leave') cur.leave += 1;
    cur.total += 1;
    monthAttMap.set(yMonth, cur);
  }

  const monthlyAttendanceTrends: EmployeeMonthlyAttendanceTrend[] = Array.from(monthAttMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => {
      const [y, m] = month.split('-');
      const mIdx = parseInt(m, 10) - 1;
      const monthBn = `${monthNames[mIdx] || month} ${englishToBanglaDigits(y)}`;
      return {
        month,
        monthBn,
        presentDays: data.present,
        absentDays: data.absent,
        leaveDays: data.leave,
        totalRecordedDays: data.total,
      };
    });

  return {
    dateRange,
    totalActiveEmployees: activeEmployees.length,
    totalArchivedEmployees: archivedEmployees.length,
    totalPresentDays: totalPresent,
    totalAbsentDays: totalAbsent,
    totalLeaveDays: totalLeave,
    totalRecordedDays: filteredAttendance.length,
    totalConfiguredSalaryTk: totalConfiguredSalary,
    totalPaidSalaryTk: totalPaidSalary,
    employeeSummaries,
    monthlyAttendanceTrends,
  };
}

// ------------------------------------------------------------------------------
// 5. Biogas & Maintenance Report Analytics
// ------------------------------------------------------------------------------
export interface BiogasMonthlyTrendItem {
  month: string;
  monthBn: string;
  dungKg: number;
  waterLiters: number;
  burnHours: number;
  slurryBags: number;
  recordDaysCount: number;
}

export interface BiogasReportData {
  dateRange: DateRangeResult;
  totalDungKg: number;
  totalWaterLiters: number;
  totalBurnHours: number;
  totalSlurryBags: number;
  recordDaysCount: number;
  avgDailyDungKg: number;
  avgDailyWaterLiters: number;
  avgDailyBurnHours: number;
  avgDailySlurryBags: number;
  inspectionsCompletedCount: number;
  inspectionsIssuesCount: number;
  upcomingMaintenanceCount: number;
  overdueMaintenanceCount: number;
  monthlyTrend: BiogasMonthlyTrendItem[];
  logsList: BiogasDailyLog[];
  inspectionsList: BiogasInspectionItem[];
}

export function generateBiogasReport(
  logs: BiogasDailyLog[],
  inspections: BiogasInspectionItem[],
  dateRange: DateRangeResult,
  reminders: ReminderTask[] = []
): BiogasReportData {
  const filteredLogs = logs.filter((l) =>
    isDateInRange(l.date, dateRange.startDate, dateRange.endDate)
  );

  const filteredInspections = inspections.filter((i) =>
    isDateInRange(i.date, dateRange.startDate, dateRange.endDate)
  );

  const recordDaysCount = filteredLogs.length;

  let totalDung = 0;
  let totalWater = 0;
  let totalBurn = 0;
  let totalSlurry = 0;

  for (const l of filteredLogs) {
    totalDung = roundMoney(totalDung + l.dungInputKg);
    totalWater = roundMoney(totalWater + l.waterInputLiters);
    totalBurn = roundMoney(totalBurn + l.burnHoursToday);
    totalSlurry = roundMoney(totalSlurry + l.slurryProducedBags);
  }

  const avgDailyDungKg = recordDaysCount > 0 ? roundMoney(totalDung / recordDaysCount) : 0;
  const avgDailyWaterLiters = recordDaysCount > 0 ? roundMoney(totalWater / recordDaysCount) : 0;
  const avgDailyBurnHours = recordDaysCount > 0 ? roundMoney(totalBurn / recordDaysCount) : 0;
  const avgDailySlurryBags = recordDaysCount > 0 ? roundMoney(totalSlurry / recordDaysCount) : 0;

  const inspectionsCompletedCount = filteredInspections.length;
  const inspectionsIssuesCount = filteredInspections.filter(
    (i) => i.status === 'needs_attention' || i.status === 'urgent'
  ).length;

  // Monthly biogas trend
  const monthNames = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const monthBioMap = new Map<string, { dung: number; water: number; burn: number; slurry: number; days: number }>();
  for (const l of filteredLogs) {
    const yMonth = toIsoDateString(l.date).slice(0, 7);
    const cur = monthBioMap.get(yMonth) || { dung: 0, water: 0, burn: 0, slurry: 0, days: 0 };
    cur.dung = roundMoney(cur.dung + l.dungInputKg);
    cur.water = roundMoney(cur.water + l.waterInputLiters);
    cur.burn = roundMoney(cur.burn + l.burnHoursToday);
    cur.slurry = roundMoney(cur.slurry + l.slurryProducedBags);
    cur.days += 1;
    monthBioMap.set(yMonth, cur);
  }

  const monthlyTrend: BiogasMonthlyTrendItem[] = Array.from(monthBioMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => {
      const [y, m] = month.split('-');
      const mIdx = parseInt(m, 10) - 1;
      const monthBn = `${monthNames[mIdx] || month} ${englishToBanglaDigits(y)}`;
      return {
        month,
        monthBn,
        dungKg: data.dung,
        waterLiters: data.water,
        burnHours: data.burn,
        slurryBags: data.slurry,
        recordDaysCount: data.days,
      };
    });

  // Calculate upcoming and overdue biogas maintenance tasks
  const todayIso = toIsoDateString(new Date());
  const biogasTasks = reminders.filter((r) => !r.completed && r.category === 'biogas');
  
  // Also count inspections with future or overdue nextInspectionDate not already in tasks
  const overdueMaintenanceCount = biogasTasks.filter((t) => toIsoDateString(t.dueDate) < todayIso).length +
    inspections.filter((i) => {
      const nextDate = i.nextInspectionDate;
      if (!nextDate) return false;
      return (
        toIsoDateString(nextDate) < todayIso &&
        !biogasTasks.some((t) => toIsoDateString(t.dueDate) === toIsoDateString(nextDate))
      );
    }).length;

  const upcomingMaintenanceCount = biogasTasks.filter((t) => toIsoDateString(t.dueDate) >= todayIso).length +
    inspections.filter((i) => {
      const nextDate = i.nextInspectionDate;
      if (!nextDate) return false;
      return (
        toIsoDateString(nextDate) >= todayIso &&
        !biogasTasks.some((t) => toIsoDateString(t.dueDate) === toIsoDateString(nextDate))
      );
    }).length;

  return {
    dateRange,
    totalDungKg: totalDung,
    totalWaterLiters: totalWater,
    totalBurnHours: totalBurn,
    totalSlurryBags: totalSlurry,
    recordDaysCount,
    avgDailyDungKg,
    avgDailyWaterLiters,
    avgDailyBurnHours,
    avgDailySlurryBags,
    inspectionsCompletedCount,
    inspectionsIssuesCount,
    upcomingMaintenanceCount,
    overdueMaintenanceCount,
    monthlyTrend,
    logsList: filteredLogs,
    inspectionsList: filteredInspections,
  };
}

// ------------------------------------------------------------------------------
// 6. CSV Export Generator Utilities (UTF-8 BOM compliant)
// ------------------------------------------------------------------------------
function escapeCsvCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '""';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Triggers CSV file download in the browser with UTF-8 BOM (\uFEFF)
 * for seamless compatibility with Microsoft Excel, Google Sheets, and LibreOffice.
 */
/**
 * Generates a Blob with UTF-8 BOM (\uFEFF) for seamless Bengali CSV support in Excel and Sheets.
 */
export function buildCsvBlob(csvRows: string[][]): Blob {
  const csvContent = csvRows
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\r\n');
  return new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Triggers CSV file download in the browser with UTF-8 BOM (\uFEFF).
 */
export function downloadCsv(filename: string, csvRows: string[][]): void {
  const blob = buildCsvBlob(csvRows);
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportFinancialCsv(
  records: FinancialRecord[],
  rangeLabel: string
): void {
  const rows: string[][] = [
    ['মুমিন এগ্রো (Mumin Agro) — আর্থিক লেনদেন প্রতিবেদন'],
    ['প্রতিবেদনের সময়সীমা:', rangeLabel],
    ['তৈরির তারিখ:', new Date().toLocaleDateString('bn-BD')],
    [],
    ['তারিখ', 'লেনদেনের ধরন', 'খাত', 'বিবরণ', 'টাকার পরিমাণ (৳)', 'পরিশোধ মাধ্যম', 'নোট / রেফারেন্স']
  ];

  for (const r of records) {
    rows.push([
      r.date,
      r.type === 'income' ? 'আয়' : 'ব্যয়',
      r.categoryLabelBn || r.category,
      r.title,
      String(r.amount),
      r.paymentMethod === 'bkash' ? 'বিকাশ' : r.paymentMethod === 'bank' ? 'ব্যাংক' : 'ক্যাশ',
      r.notes || '',
    ]);
  }

  const cleanFilename = `mumin_agro_finance_${rangeLabel.replace(/[^a-zA-Z0-9_\u0980-\u09FF]/g, '_')}.csv`;
  downloadCsv(cleanFilename, rows);
}

export function exportMilkCsv(
  dailyBreakdown: DailyMilkBreakdownItem[],
  rangeLabel: string
): void {
  const rows: string[][] = [
    ['মুমিন এগ্রো (Mumin Agro) — দুধ উৎপাদন ও বিক্রয় প্রতিবেদন'],
    ['প্রতিবেদনের সময়সীমা:', rangeLabel],
    ['তৈরির তারিখ:', new Date().toLocaleDateString('bn-BD')],
    [],
    ['তারিখ', 'সকালের দুধ (লিটার)', 'বিকালের দুধ (লিটার)', 'মোট দুধ (লিটার)', 'বিক্রিত দুধ (লিটার)', 'বিক্রয় আয় (৳)', 'অবিক্রিত / ব্যবহৃত (লিটার)', 'হিসাব পদ্ধতি']
  ];

  for (const d of dailyBreakdown) {
    rows.push([
      d.date,
      String(d.morningLiters),
      String(d.eveningLiters),
      String(d.totalLiters),
      String(d.soldLiters),
      String(d.revenueTk),
      String(d.retainedLiters),
      d.method === 'aggregate' ? 'খামার বাল্ক সংগ্রহ' : 'গাভীভিত্তিক যোগফল',
    ]);
  }

  const cleanFilename = `mumin_agro_milk_${rangeLabel.replace(/[^a-zA-Z0-9_\u0980-\u09FF]/g, '_')}.csv`;
  downloadCsv(cleanFilename, rows);
}

export function exportHealthCsv(
  events: CowHealthSummaryItem[],
  rangeLabel: string
): void {
  const rows: string[][] = [
    ['মুমিন এগ্রো (Mumin Agro) — গাভীর স্বাস্থ্য ও চিকিৎসা প্রতিবেদন'],
    ['প্রতিবেদনের সময়সীমা:', rangeLabel],
    ['তৈরির তারিখ:', new Date().toLocaleDateString('bn-BD')],
    [],
    ['তারিখ', 'গাভীর ট্যাগ', 'গাভীর নাম', 'ইভেন্টের ধরন', 'টিকা / চিকিৎসার নাম', 'ডাক্তার', 'ঔষধ', 'খরচ (৳)', 'পরবর্তী সম্ভাব্য তারিখ']
  ];

  for (const e of events) {
    rows.push([
      e.eventDate,
      e.cowTag,
      e.cowName,
      e.eventTypeBn,
      e.treatmentName,
      e.doctorName || '',
      e.notes || '',
      String(e.cost),
      e.nextDueDate || '',
    ]);
  }

  const cleanFilename = `mumin_agro_health_${rangeLabel.replace(/[^a-zA-Z0-9_\u0980-\u09FF]/g, '_')}.csv`;
  downloadCsv(cleanFilename, rows);
}

export function exportEmployeeCsv(
  employees: EmployeeAttendanceReportItem[],
  rangeLabel: string
): void {
  const rows: string[][] = [
    ['মুমিন এগ্রো (Mumin Agro) — কর্মী হাজিরা ও বেতন প্রতিবেদন'],
    ['প্রতিবেদনের সময়সীমা:', rangeLabel],
    ['তৈরির তারিখ:', new Date().toLocaleDateString('bn-BD')],
    [],
    ['কর্মচারীর নাম', 'পদবি / দায়িত্ব', 'মাসিক নির্ধারিত বেতন (৳)', 'উপস্থিত দিন', 'অনুপস্থিত দিন', 'ছুটির দিন', 'মোট রেকর্ডকৃত দিন', 'হাজিরা হার (%)', 'বেতন স্ট্যাটাস', 'পরিশোধিত বেতন (৳)', 'বকেয়া বেতন (৳)']
  ];

  for (const e of employees) {
    rows.push([
      e.name,
      e.role,
      String(e.salaryMonthly),
      String(e.presentDays),
      String(e.absentDays),
      String(e.leaveDays),
      String(e.totalRecordedDays),
      `${e.attendanceRate}%`,
      e.payrollStatus.statusBn,
      String(e.payrollStatus.paidAmount),
      String(e.payrollStatus.dueAmount),
    ]);
  }

  const cleanFilename = `mumin_agro_employee_${rangeLabel.replace(/[^a-zA-Z0-9_\u0980-\u09FF]/g, '_')}.csv`;
  downloadCsv(cleanFilename, rows);
}

export function exportBiogasCsv(
  logs: BiogasDailyLog[],
  rangeLabel: string
): void {
  const rows: string[][] = [
    ['মুমিন এগ্রো (Mumin Agro) — বায়োগ্যাস প্ল্যান্ট দৈনিক লগ প্রতিবেদন'],
    ['প্রতিবেদনের সময়সীমা:', rangeLabel],
    ['তৈরির তারিখ:', new Date().toLocaleDateString('bn-BD')],
    [],
    ['তারিখ', 'গোবর ইনপুট (কেজি)', 'পানি ইনপুট (লিটার)', 'চুলা জ্বলার সময় (ঘণ্টা)', 'উৎপাদিত জৈব সার (বস্তা)', 'দায়িত্বপ্রাপ্ত কর্মী', 'মন্তব্য / অবস্থা']
  ];

  for (const l of logs) {
    rows.push([
      l.date,
      String(l.dungInputKg),
      String(l.waterInputLiters),
      String(l.burnHoursToday),
      String(l.slurryProducedBags),
      l.recordedBy || '',
      l.notes || l.statusBn,
    ]);
  }

  const cleanFilename = `mumin_agro_biogas_${rangeLabel.replace(/[^a-zA-Z0-9_\u0980-\u09FF]/g, '_')}.csv`;
  downloadCsv(cleanFilename, rows);
}
