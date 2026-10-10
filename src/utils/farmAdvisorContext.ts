import type { 
  FinancialRecord, 
  MilkRecord, 
  Cow, 
  HealthRecord, 
  Employee, 
  AttendanceRecord, 
  BiogasDailyLog, 
  BiogasInspectionItem, 
  ReminderTask 
} from '../types/farm';
import type { FarmAdvisorContext } from '../types/aiAdvisor';
import { 
  getReportDateRange, 
  generateFinancialReport, 
  generateMilkReport, 
  generateHealthReport, 
  generateEmployeeReport, 
  generateBiogasReport 
} from './farmReports';
import type { ReportDateRangeType } from './farmReports';
import { consolidateFarmReminders } from './healthAccounting';
import { toIsoDateString } from './accounting';

interface BuildContextOptions {
  query: string;
  financialRecords: FinancialRecord[];
  milkRecords: MilkRecord[];
  cows: Cow[];
  healthRecords: HealthRecord[];
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  biogasLogs: BiogasDailyLog[];
  biogasInspections: BiogasInspectionItem[];
  reminders: ReminderTask[];
  userId?: string;
  isDemoMode?: boolean;
  referenceDate?: Date;
}

export function detectQueryTopic(query: string): FarmAdvisorContext['queryTopic'] {
  const q = query.toLowerCase();

  // Biogas first if biogas keywords are prominent
  if (
    q.includes('বায়োগ্যাস') ||
    q.includes('গোবর') ||
    q.includes('biogas') ||
    q.includes('dung') ||
    q.includes('slurry') ||
    q.includes('চুলা') ||
    q.includes('স্লারি') ||
    q.includes('gobor')
  ) {
    return 'biogas';
  }

  // Recommendations / Advice / Cost cutting
  if (
    q.includes('খরচ কমানো') ||
    q.includes('পরামর্শ') ||
    q.includes('সুযোগ') ||
    q.includes('উন্নতি') ||
    q.includes('advice') ||
    q.includes('recommend') ||
    q.includes('reduce cost') ||
    q.includes('shujog') ||
    q.includes('khoroch komano')
  ) {
    return 'recommendations';
  }

  // Employee / Staff / Attendance / Tasks
  if (
    q.includes('কর্মী') ||
    q.includes('কর্মচারী') ||
    q.includes('হাজিরা') ||
    q.includes('বেতন') ||
    q.includes('কাজ বাকি') ||
    q.includes('employee') ||
    q.includes('worker') ||
    q.includes('staff') ||
    q.includes('salary') ||
    q.includes('attendance') ||
    q.includes('beton') ||
    q.includes('hazira') ||
    q.includes('kormi')
  ) {
    return 'employee';
  }

  // Cow health / Veterinary / Vaccine
  if (
    q.includes('টিকা') ||
    q.includes('ভ্যাকসিন') ||
    q.includes('ডাক্তার') ||
    q.includes('চিকিৎসা') ||
    q.includes('রোগ') ||
    q.includes('অসুখ') ||
    q.includes('কৃমিনাশক') ||
    q.includes('vaccine') ||
    q.includes('vet') ||
    q.includes('treatment') ||
    q.includes('tika') ||
    q.includes('chikitsa')
  ) {
    return 'cow_health';
  }

  // Milk / Production
  if (
    q.includes('দুধ') ||
    q.includes('লিটার') ||
    q.includes('milk') ||
    q.includes('liter') ||
    q.includes('উৎপাদন') ||
    q.includes('দোহন') ||
    q.includes('dhoodh') ||
    q.includes('dudh')
  ) {
    return 'milk';
  }

  // Finance / Income / Expense / Profit
  if (
    q.includes('আয়') ||
    q.includes('খরচ') ||
    q.includes('লাভ') ||
    q.includes('লোকসান') ||
    q.includes('টাকা') ||
    q.includes('ব্যয়') ||
    q.includes('খাত') ||
    q.includes('income') ||
    q.includes('expense') ||
    q.includes('profit') ||
    q.includes('surplus') ||
    q.includes('cost') ||
    q.includes('taka') ||
    q.includes('khoroch') ||
    q.includes('aay')
  ) {
    return 'finance';
  }

  return 'general';
}

export function detectQueryPeriod(query: string): ReportDateRangeType {
  const q = query.toLowerCase();
  if (q.includes('গত মাস') || q.includes('previous month') || q.includes('last month') || q.includes('goto mash')) {
    return 'lastMonth';
  }
  if (q.includes('গত ৭ দিন') || q.includes('last 7 days') || q.includes('7 days') || q.includes('goto 7 din')) {
    return 'last7days';
  }
  if (q.includes('চলতি বছর') || q.includes('this year') || q.includes('বছর') || q.includes('cholti bochor')) {
    return 'thisYear';
  }
  if (q.includes('আজ') || q.includes('today') || q.includes('aaj')) {
    return 'today';
  }
  if (q.includes('সর্বমোট') || q.includes('সব সময়') || q.includes('all time')) {
    return 'allTime';
  }
  return 'thisMonth';
}

export function buildFarmAdvisorContext({
  query,
  financialRecords,
  milkRecords,
  cows,
  healthRecords,
  employees,
  attendanceRecords,
  biogasLogs,
  biogasInspections,
  reminders,
  userId,
  isDemoMode = false,
  referenceDate = new Date(),
}: BuildContextOptions): FarmAdvisorContext {
  const q = query.toLowerCase();

  // 1. Safety & Injection Detection
  const isVeterinaryInquiry = Boolean(
    q.includes('অসুখ') ||
    q.includes('রোগ') ||
    q.includes('জ্বর') ||
    q.includes('ক্ষুরা') ||
    q.includes('ডায়রিয়া') ||
    q.includes('ব্যথা') ||
    q.includes('ঔষধ কতটুকু') ||
    q.includes('ডোজ') ||
    q.includes('প্যারালাইসিস') ||
    q.includes('রক্ত') ||
    q.includes('sick') ||
    q.includes('disease') ||
    q.includes('fever') ||
    q.includes('symptom') ||
    q.includes('antibiotic') ||
    q.includes('dosage') ||
    q.includes('treatment advise') ||
    q.includes('osukh') ||
    q.includes('jor')
  );

  const isBiogasDangerInquiry = Boolean(
    q.includes('লিক') ||
    q.includes('গন্ধ') ||
    q.includes('আগুন') ||
    q.includes('বিস্ফোরণ') ||
    q.includes('চাপ বেশি') ||
    q.includes('ফেটে') ||
    q.includes('leak') ||
    q.includes('smell') ||
    q.includes('burst') ||
    q.includes('explosion') ||
    q.includes('danger') ||
    q.includes('gas leak')
  );

  const isUntrustedContentDetected = Boolean(
    q.includes('ignore previous instructions') ||
    q.includes('system prompt') ||
    q.includes('reveal secret') ||
    q.includes('api key') ||
    q.includes('password') ||
    q.includes('সকল ইউজারের') ||
    q.includes('অন্য ইউজারের') ||
    q.includes('গোপন তথ্য') ||
    q.includes('override instructions')
  );

  // 2. Identify Topic & Period
  const queryTopic = detectQueryTopic(query);
  const periodType = detectQueryPeriod(query);
  const dateRange = getReportDateRange(periodType, undefined, undefined, referenceDate);

  // Consolidate reminders strictly without duplication
  const consolidatedReminders = consolidateFarmReminders({
    tasks: reminders,
    healthRecords,
    biogasInspections,
    cows,
    employees,
  });

  const missingDataNotes: string[] = [];

  // 3. Assemble scoped contextual data based on topic
  let financialSummary: FarmAdvisorContext['financialSummary'];
  let milkSummary: FarmAdvisorContext['milkSummary'];
  let healthSummary: FarmAdvisorContext['healthSummary'];
  let employeeSummary: FarmAdvisorContext['employeeSummary'];
  let biogasSummary: FarmAdvisorContext['biogasSummary'];

  // Financial summary
  if (queryTopic === 'finance' || queryTopic === 'recommendations' || queryTopic === 'general') {
    const finReport = generateFinancialReport(financialRecords, dateRange);
    
    const incomeByCategory: Record<string, number> = {};
    for (const item of finReport.summary.incomeCategoryBreakdown) {
      incomeByCategory[item.category] = item.totalAmount;
    }

    const expenseByCategory: Record<string, number> = {};
    for (const item of finReport.summary.categoryBreakdown) {
      expenseByCategory[item.category] = item.totalAmount;
    }

    // categoryBreakdown is sorted descending by totalAmount in accounting
    const highestItem = finReport.summary.categoryBreakdown[0];
    const highestExpenseCategory = highestItem && highestItem.totalAmount > 0 ? {
      category: highestItem.category,
      categoryBn: highestItem.categoryLabelBn || highestItem.category,
      amount: highestItem.totalAmount,
    } : undefined;

    const hasMilkSales = (incomeByCategory['milk_sale'] ?? 0) > 0;

    financialSummary = {
      totalIncome: finReport.summary.totalIncome,
      totalExpenses: finReport.summary.totalExpenses,
      netOperatingResult: finReport.summary.netOperatingResult,
      isSurplus: finReport.summary.isSurplus,
      incomeByCategory,
      expenseByCategory,
      highestExpenseCategory,
      hasRecordedMilkSales: hasMilkSales,
    };

    if (finReport.summary.filteredRecords.length === 0) {
      missingDataNotes.push(`${dateRange.labelBn}-এ কোনো আর্থিক লেনদেন রেকর্ড করা নেই`);
    }
  }

  // Milk summary
  if (queryTopic === 'milk' || queryTopic === 'recommendations' || queryTopic === 'general') {
    const milkReport = generateMilkReport(milkRecords, cows, dateRange);

    // Check if comparison with previous month was asked or needed
    let comparison: NonNullable<FarmAdvisorContext['milkSummary']>['previousPeriodComparison'] = undefined;
    if (q.includes('তুলনা') || q.includes('আগের') || q.includes('গত মাস') || q.includes('compare')) {
      const prevRange = getReportDateRange('lastMonth', undefined, undefined, referenceDate);
      const prevMilkReport = generateMilkReport(milkRecords, cows, prevRange);
      const diff = milkReport.totalCollectedLiters - prevMilkReport.totalCollectedLiters;
      const pct = prevMilkReport.totalCollectedLiters > 0
        ? Math.round((Math.abs(diff) / prevMilkReport.totalCollectedLiters) * 100)
        : 0;

      comparison = {
        previousTotalLiters: prevMilkReport.totalCollectedLiters,
        differenceLiters: Math.abs(diff),
        percentageChange: pct,
        trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'equal',
      };
    }

    milkSummary = {
      totalCollectedLiters: milkReport.totalCollectedLiters,
      morningLiters: milkReport.totalMorningLiters,
      eveningLiters: milkReport.totalEveningLiters,
      totalSoldLiters: milkReport.totalSoldLiters,
      totalRevenueTk: milkReport.totalRevenueTk,
      totalRetainedLiters: milkReport.totalRetainedLiters,
      distinctDaysCount: milkReport.distinctDaysCount,
      averageDailyLiters: milkReport.averageDailyCollection,
      previousPeriodComparison: comparison,
    };

    if (milkReport.distinctDaysCount === 0) {
      missingDataNotes.push(`${dateRange.labelBn}-এ কোনো দুধ উৎপাদনের রেকর্ড নেই`);
    }
  }

  // Cow Health summary
  if (queryTopic === 'cow_health' || queryTopic === 'recommendations' || queryTopic === 'general') {
    const healthReport = generateHealthReport(healthRecords, cows, consolidatedReminders, dateRange);
    
    // Gather upcoming and overdue vaccines (strictly without sensitive notes)
    const todayIso = referenceDate.toISOString().split('T')[0];
    const vaccineReminders = consolidatedReminders.filter(
      (r) => !r.completed && (r.category === 'vaccine' || r.category === 'medicine')
    );

    const upcomingVaccines = vaccineReminders.map((r) => {
      const targetCow = cows.find((c) => c.id === r.cowId);
      return {
        cowTag: targetCow ? targetCow.tagNumber : (r.title.match(/গাভী-[০-৯0-9]+/)?.[0] || 'গাভী'),
        cowName: targetCow?.name,
        vaccineName: r.title,
        dueDate: r.dueDate,
        isOverdue: toIsoDateString(r.dueDate) < todayIso,
      };
    });

    healthSummary = {
      totalActiveCows: healthReport.totalActiveCows,
      totalArchivedCows: healthReport.totalArchivedCows,
      cowsByStatus: healthReport.cowsByStatus,
      upcomingVaccines,
      recentTreatmentsCount: healthReport.treatmentsCount,
      totalHealthCostTk: healthReport.totalHealthCostTk,
    };
  }

  // Employee summary (Sanitized: NO phone numbers or PII)
  if (queryTopic === 'employee' || queryTopic === 'recommendations' || queryTopic === 'general') {
    const empReport = generateEmployeeReport(employees, attendanceRecords, financialRecords, dateRange, consolidatedReminders);
    const todayIso = referenceDate.toISOString().split('T')[0];

    const pendingTasks = consolidatedReminders
      .filter((r) => !r.completed && (r.assignedEmployeeId || r.assignedTo))
      .map((r) => ({
        employeeName: r.assignedTo || 'নির্ধারিত কর্মী',
        taskTitle: r.title,
        dueDate: r.dueDate,
        priorityBn: r.priorityBn,
        isOverdue: toIsoDateString(r.dueDate) < todayIso,
      }));

    employeeSummary = {
      activeEmployeesCount: empReport.totalActiveEmployees,
      presentDays: empReport.totalPresentDays,
      absentDays: empReport.totalAbsentDays,
      leaveDays: empReport.totalLeaveDays,
      pendingTasks,
      totalConfiguredSalaryTk: empReport.totalConfiguredSalaryTk,
      totalPaidSalaryTk: empReport.totalPaidSalaryTk,
    };
  }

  // Biogas summary
  if (queryTopic === 'biogas' || queryTopic === 'recommendations' || queryTopic === 'general') {
    const bioReport = generateBiogasReport(biogasLogs, biogasInspections, dateRange, consolidatedReminders);

    biogasSummary = {
      recordDaysCount: bioReport.recordDaysCount,
      totalDungKg: bioReport.totalDungKg,
      totalWaterLiters: bioReport.totalWaterLiters,
      totalBurnHours: bioReport.totalBurnHours,
      totalSlurryBags: bioReport.totalSlurryBags,
      avgDailyDungKg: bioReport.avgDailyDungKg,
      recentInspectionIssuesCount: bioReport.inspectionsIssuesCount,
      overdueMaintenanceCount: bioReport.overdueMaintenanceCount,
    };

    if (bioReport.recordDaysCount === 0) {
      missingDataNotes.push(`${dateRange.labelBn}-এ কোনো বায়োগ্যাস ইনপুট বা লগ নেই`);
    }
  }

  return {
    userId,
    isDemoData: isDemoMode,
    queryTopic,
    targetPeriodLabelBn: dateRange.labelBn,
    dateRange: {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    },
    financialSummary,
    milkSummary,
    healthSummary,
    employeeSummary,
    biogasSummary,
    isVeterinaryInquiry,
    isBiogasDangerInquiry,
    isUntrustedContentDetected,
    missingDataNotes: missingDataNotes.length > 0 ? missingDataNotes : undefined,
  };
}
