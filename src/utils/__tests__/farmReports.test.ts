import { describe, it, expect } from 'vitest';
import {
  getReportDateRange,
  isDateInRange,
  generateFinancialReport,
  generateMilkReport,
  generateHealthReport,
  generateEmployeeReport,
  generateBiogasReport,
  exportFinancialCsv,
  buildCsvBlob,
} from '../farmReports';
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
} from '../../types/farm';
import { categorizeRemindersByUrgency, consolidateFarmReminders } from '../healthAccounting';

describe('Phase 6: Farm Reports & Analytics Suite', () => {
  const refDate = new Date('2026-10-10T12:00:00Z');

  // 1. Date Range Filtering & Boundary Conditions
  describe('1. Date Range & Period Filtering', () => {
    it('calculates "today" range accurately with inclusive bounds', () => {
      const range = getReportDateRange('today', undefined, undefined, refDate);
      expect(range.startDate).toBe('2026-10-10');
      expect(range.endDate).toBe('2026-10-10');
      expect(isDateInRange('2026-10-10', range.startDate, range.endDate)).toBe(true);
      expect(isDateInRange('2026-10-09', range.startDate, range.endDate)).toBe(false);
      expect(isDateInRange('2026-10-11', range.startDate, range.endDate)).toBe(false);
    });

    it('calculates "last7days" inclusively across the 7-day span', () => {
      const range = getReportDateRange('last7days', undefined, undefined, refDate);
      expect(range.startDate).toBe('2026-10-04');
      expect(range.endDate).toBe('2026-10-10');
      expect(isDateInRange('2026-10-04', range.startDate, range.endDate)).toBe(true);
      expect(isDateInRange('2026-10-07', range.startDate, range.endDate)).toBe(true);
      expect(isDateInRange('2026-10-10', range.startDate, range.endDate)).toBe(true);
      expect(isDateInRange('2026-10-03', range.startDate, range.endDate)).toBe(false);
    });

    it('calculates "thisMonth" from 1st to last day of the month', () => {
      const range = getReportDateRange('thisMonth', undefined, undefined, refDate);
      expect(range.startDate).toBe('2026-10-01');
      expect(range.endDate).toBe('2026-10-31');
      expect(isDateInRange('2026-10-01', range.startDate, range.endDate)).toBe(true);
      expect(isDateInRange('2026-10-31', range.startDate, range.endDate)).toBe(true);
      expect(isDateInRange('2026-09-30', range.startDate, range.endDate)).toBe(false);
    });

    it('calculates "lastMonth" covering the entire previous month (September 30 days)', () => {
      const range = getReportDateRange('lastMonth', undefined, undefined, refDate);
      expect(range.startDate).toBe('2026-09-01');
      expect(range.endDate).toBe('2026-09-30');
      expect(isDateInRange('2026-09-01', range.startDate, range.endDate)).toBe(true);
      expect(isDateInRange('2026-09-30', range.startDate, range.endDate)).toBe(true);
      expect(isDateInRange('2026-10-01', range.startDate, range.endDate)).toBe(false);
    });

    it('handles custom date range and auto-orders start and end if inverted', () => {
      const range = getReportDateRange('custom', '2026-10-15', '2026-10-05');
      expect(range.startDate).toBe('2026-10-05');
      expect(range.endDate).toBe('2026-10-15');
      expect(isDateInRange('2026-10-05', range.startDate, range.endDate)).toBe(true);
      expect(isDateInRange('2026-10-15', range.startDate, range.endDate)).toBe(true);
    });
  });

  // 2. Financial Reports & Operating Result Safeguards
  describe('2. Financial Reports & Accounting Safeguards', () => {
    const mockFinances: FinancialRecord[] = [
      {
        id: 'fin-1',
        date: '2026-10-08',
        type: 'income',
        category: 'milk_sale',
        categoryLabelBn: 'দুধ বিক্রি',
        title: 'দুধ বিক্রয়',
        amount: 5000,
        paymentMethod: 'cash',
        recordedBy: 'আব্বু',
      },
      {
        id: 'fin-2',
        date: '2026-10-09',
        type: 'income',
        category: 'slurry_sale',
        categoryLabelBn: 'জৈব সার বিক্রি',
        title: 'স্লারি সার বিক্রি',
        amount: 1500,
        paymentMethod: 'bkash',
        recordedBy: 'আব্বু',
      },
      {
        id: 'fin-3',
        date: '2026-10-09',
        type: 'expense',
        category: 'feed',
        categoryLabelBn: 'পশুখাদ্য',
        title: 'গম ভুসি ক্রয়',
        amount: 2500,
        paymentMethod: 'cash',
        recordedBy: 'আব্বু',
      },
      {
        id: 'fin-4',
        date: '2026-10-10',
        type: 'expense',
        category: 'salary',
        categoryLabelBn: 'কর্মচারীর বেতন',
        title: 'রহিম উদ্দিনের বেতন',
        amount: 3000,
        paymentMethod: 'cash',
        recordedBy: 'আব্বু',
        relatedEmployeeId: 'emp-1',
        salaryPeriod: '2026-10',
      },
    ];

    it('calculates total income, expenses, and net operating result correctly', () => {
      const dateRange = getReportDateRange('thisMonth', undefined, undefined, refDate);
      const report = generateFinancialReport(mockFinances, dateRange);

      expect(report.summary.totalIncome).toBe(6500); // 5000 + 1500
      expect(report.summary.totalExpenses).toBe(5500); // 2500 + 3000
      expect(report.summary.netOperatingResult).toBe(1000); // 6500 - 5500
      expect(report.summary.isSurplus).toBe(true);
      expect(report.summary.paymentMethodBreakdown.cash.income).toBe(5000);
      expect(report.summary.paymentMethodBreakdown.bkash.income).toBe(1500);
      expect(report.summary.paymentMethodBreakdown.cash.expense).toBe(5500);
    });

    it('handles empty periods safely with zero totals without NaN or crash', () => {
      const dateRange = getReportDateRange('custom', '2025-01-01', '2025-01-31');
      const report = generateFinancialReport(mockFinances, dateRange);

      expect(report.summary.totalIncome).toBe(0);
      expect(report.summary.totalExpenses).toBe(0);
      expect(report.summary.netOperatingResult).toBe(0);
      expect(report.summary.operatingMarginPct).toBe(0);
      expect(report.summary.filteredRecords.length).toBe(0);
    });
  });

  // 3. Milk Production & Sales Reports (No Double Counting)
  describe('3. Milk Production and Sales Reports', () => {
    const mockMilkRecords: MilkRecord[] = [
      // 2026-10-09: Farm-wide aggregate bulk tank record
      {
        id: 'm-agg-1',
        date: '2026-10-09',
        morningLiters: 40,
        eveningLiters: 30,
        totalLiters: 70,
        entryType: 'aggregate',
        isSold: true,
        soldLiters: 60,
        pricePerLiter: 80,
        totalAmount: 4800,
        recordedBy: 'আব্বু',
      },
      // 2026-10-09: Individual cow record on same date (breakdown only, must NOT be added to 70L)
      {
        id: 'm-ind-1',
        cowId: 'cow-1',
        date: '2026-10-09',
        morningLiters: 15,
        eveningLiters: 10,
        totalLiters: 25,
        entryType: 'individual',
        isSold: false,
        pricePerLiter: 80,
        totalAmount: 0,
        recordedBy: 'আব্বু',
      },
      // 2026-10-10: Only individual records
      {
        id: 'm-ind-2',
        cowId: 'cow-1',
        date: '2026-10-10',
        morningLiters: 14,
        eveningLiters: 11,
        totalLiters: 25,
        entryType: 'individual',
        isSold: true,
        soldLiters: 20,
        pricePerLiter: 80,
        totalAmount: 1600,
        recordedBy: 'আব্বু',
      },
      {
        id: 'm-ind-3',
        cowId: 'cow-2',
        date: '2026-10-10',
        morningLiters: 16,
        eveningLiters: 14,
        totalLiters: 30,
        entryType: 'individual',
        isSold: false,
        pricePerLiter: 80,
        totalAmount: 0,
        recordedBy: 'আব্বু',
      },
    ];

    const mockCows: Cow[] = [
      {
        id: 'cow-1',
        tagNumber: 'COW-001',
        name: 'শাপলা',
        breed: 'হলস্টাইন ফ্রিজিয়ান',
        ageYears: 4,
        isAgeEstimated: false,
        status: 'milking',
        statusLabelBn: 'দুধ দিচ্ছে',
        gender: 'female',
        dailyAvgMilkLiters: 25,
        lastMilkingLiters: 12.5,
        isArchived: false,
      },
      {
        id: 'cow-2',
        tagNumber: 'COW-002',
        name: 'পদ্মা',
        breed: 'শাহীওয়াল ক্রস',
        ageYears: 5,
        isAgeEstimated: false,
        status: 'milking',
        statusLabelBn: 'দুধ দিচ্ছে',
        gender: 'female',
        dailyAvgMilkLiters: 30,
        lastMilkingLiters: 15,
        isArchived: false,
      },
    ];

    it('prevents double-counting between aggregate and individual records on the same day', () => {
      const dateRange = getReportDateRange('thisMonth', undefined, undefined, refDate);
      const report = generateMilkReport(mockMilkRecords, mockCows, dateRange);

      // On 2026-10-09: aggregate total 70L (25L from cow-1 is NOT added)
      // On 2026-10-10: individual sum (25 + 30) = 55L
      // Total collected = 70 + 55 = 125L
      expect(report.totalCollectedLiters).toBe(125);
      expect(report.distinctDaysCount).toBe(2);
      expect(report.averageDailyCollection).toBe(62.5); // 125 / 2 days with records
    });

    it('accurately distinguishes collected milk, sold milk, and unsold/retained milk', () => {
      const dateRange = getReportDateRange('thisMonth', undefined, undefined, refDate);
      const report = generateMilkReport(mockMilkRecords, mockCows, dateRange);

      // Sold milk: 60L on 10-09 + 20L on 10-10 = 80L
      expect(report.totalSoldLiters).toBe(80);
      expect(report.totalRevenueTk).toBe(6400); // 4800 + 1600
      // Retained for household/calves: 125 - 80 = 45L
      expect(report.totalRetainedLiters).toBe(45);
    });

    it('summarizes cow-by-cow production when individual records exist', () => {
      const dateRange = getReportDateRange('thisMonth', undefined, undefined, refDate);
      const report = generateMilkReport(mockMilkRecords, mockCows, dateRange);

      const cow1Stats = report.cowBreakdown.find((c) => c.cowId === 'cow-1');
      expect(cow1Stats).toBeDefined();
      expect(cow1Stats?.totalLiters).toBe(50); // 25 + 25
      expect(cow1Stats?.recordCount).toBe(2);
    });
  });

  // 4. Cow Health & Veterinary Reports
  describe('4. Cow Health and Veterinary Reports', () => {
    const mockHealthRecords: HealthRecord[] = [
      {
        id: 'h-1',
        cowId: 'cow-1',
        cowTag: 'COW-001',
        eventType: 'vaccination',
        eventTypeLabelBn: 'টিকা প্রদান',
        eventDate: '2026-10-05',
        treatmentName: 'খুরারোগ (FMD) টিকা',
        doctorName: 'ডাঃ মোস্তাফিজুর রহমান',
        cost: 350,
      },
      {
        id: 'h-2',
        cowId: 'cow-2',
        cowTag: 'COW-002',
        eventType: 'treatment',
        eventTypeLabelBn: 'চিকিৎসা',
        eventDate: '2026-10-08',
        treatmentName: 'পেটের গ্যাস উপশম ও ভিটামিন',
        doctorName: 'ডাঃ আশরাফুল আলম',
        cost: 1200,
      },
    ];

    const mockCows: Cow[] = [
      {
        id: 'cow-1',
        tagNumber: 'COW-001',
        name: 'শাপলা',
        breed: 'হলস্টাইন',
        ageYears: 4,
        isAgeEstimated: false,
        status: 'milking',
        statusLabelBn: 'দুধ দিচ্ছে',
        gender: 'female',
        dailyAvgMilkLiters: 25,
        lastMilkingLiters: 12.5,
        isArchived: false,
      },
      {
        id: 'cow-2',
        tagNumber: 'COW-002',
        name: 'পদ্মা',
        breed: 'শাহীওয়াল',
        ageYears: 5,
        isAgeEstimated: false,
        status: 'dry',
        statusLabelBn: 'দুধ দিচ্ছে না',
        gender: 'female',
        dailyAvgMilkLiters: 0,
        lastMilkingLiters: 0,
        isArchived: false,
      },
      {
        id: 'cow-old',
        tagNumber: 'COW-OLD',
        name: 'বুড়ি',
        breed: 'দেশি',
        ageYears: 8,
        isAgeEstimated: true,
        status: 'sold',
        statusLabelBn: 'বিক্রি হয়েছে',
        gender: 'female',
        dailyAvgMilkLiters: 0,
        lastMilkingLiters: 0,
        isArchived: true,
        archivedAt: '2026-09-01',
      },
    ];

    const mockReminders: ReminderTask[] = [
      {
        id: 'rem-1',
        title: 'বুস্টার টিকা',
        description: 'এফএমডি বুস্টার',
        dueDate: '2026-10-01', // Overdue relative to 2026-10-10
        priority: 'high',
        priorityBn: 'উচ্চ',
        category: 'vaccine',
        completed: false,
      },
      {
        id: 'rem-2',
        title: 'কৃমিনাশক ডোজ',
        description: 'পরবর্তী কৃমিনাশক',
        dueDate: '2026-10-20', // Upcoming
        priority: 'medium',
        priorityBn: 'মাঝারি',
        category: 'vaccine',
        completed: false,
      },
    ];

    it('summarizes health events, costs, and distinguishes active vs archived cows', () => {
      const dateRange = getReportDateRange('thisMonth', undefined, undefined, refDate);
      const report = generateHealthReport(mockHealthRecords, mockCows, mockReminders, dateRange);

      expect(report.totalActiveCows).toBe(2);
      expect(report.cowsByStatus.milking).toBe(1);
      expect(report.cowsByStatus.dry).toBe(1);
      expect(report.cowsByStatus.sold).toBe(1); // Sold cow remains visible in status counts

      expect(report.totalHealthEvents).toBe(2);
      expect(report.totalHealthCostTk).toBe(1550); // 350 + 1200
      expect(report.vaccinationsCount).toBe(1);
      expect(report.treatmentsCount).toBe(1);
      expect(report.overdueRemindersCount).toBe(1);
      expect(report.upcomingRemindersCount).toBe(1);
    });
  });

  // 5. Employee, Attendance and Payroll Reports
  describe('5. Employee, Attendance & Payroll Reports', () => {
    const mockEmployees: Employee[] = [
      {
        id: 'emp-1',
        name: 'মো: রহিম উদ্দিন',
        role: 'প্রধান খামারি',
        phone: '01711000001',
        salaryMonthly: 12000,
        joiningDate: '2025-01-01',
        assignedDuties: ['দুধ দোয়ানো'],
        status: 'active',
        avatarInitials: 'RU',
        isArchived: false,
      },
      {
        id: 'emp-2',
        name: 'মো: কাসেম আলী',
        role: 'সহকারী খামারি',
        phone: '01811000002',
        salaryMonthly: 10000,
        joiningDate: '2025-03-01',
        assignedDuties: ['গোবর লোডিং'],
        status: 'active',
        avatarInitials: 'KA',
        isArchived: false,
      },
    ];

    const mockAttendance: AttendanceRecord[] = [
      {
        id: 'att-1',
        employeeId: 'emp-1',
        date: '2026-10-08',
        status: 'present',
        statusBn: 'উপস্থিত',
      },
      {
        id: 'att-2',
        employeeId: 'emp-1',
        date: '2026-10-09',
        status: 'present',
        statusBn: 'উপস্থিত',
      },
      {
        id: 'att-3',
        employeeId: 'emp-2',
        date: '2026-10-08',
        status: 'leave',
        statusBn: 'ছুটি',
      },
      {
        id: 'att-4',
        employeeId: 'emp-2',
        date: '2026-10-09',
        status: 'absent',
        statusBn: 'অনুপস্থিত',
      },
    ];

    const mockFinances: FinancialRecord[] = [
      {
        id: 'fin-sal-1',
        date: '2026-10-05',
        type: 'expense',
        category: 'salary',
        categoryLabelBn: 'কর্মচারীর বেতন',
        title: 'রহিম উদ্দিনের বেতন',
        amount: 8000, // Partial payment against 12000
        paymentMethod: 'cash',
        recordedBy: 'আব্বু',
        relatedEmployeeId: 'emp-1',
        salaryPeriod: '2026-10',
      },
    ];

    it('summarizes attendance without inferring unrecorded days as absence', () => {
      const dateRange = getReportDateRange('thisMonth', undefined, undefined, refDate);
      const report = generateEmployeeReport(mockEmployees, mockAttendance, mockFinances, dateRange);

      expect(report.totalActiveEmployees).toBe(2);
      expect(report.totalPresentDays).toBe(2);
      expect(report.totalAbsentDays).toBe(1);
      expect(report.totalLeaveDays).toBe(1);
      expect(report.totalRecordedDays).toBe(4); // Strictly the 4 recorded entries

      // emp-1 has 2 present days out of 2 records -> 100%
      const emp1Summary = report.employeeSummaries.find((e) => e.employeeId === 'emp-1');
      expect(emp1Summary?.presentDays).toBe(2);
      expect(emp1Summary?.attendanceRate).toBe(100);

      // emp-2 has 0 present days out of 2 records -> 0%
      const emp2Summary = report.employeeSummaries.find((e) => e.employeeId === 'emp-2');
      expect(emp2Summary?.absentDays).toBe(1);
      expect(emp2Summary?.leaveDays).toBe(1);
      expect(emp2Summary?.attendanceRate).toBe(0);
    });

    it('distinguishes configured monthly salary from actual recorded payments', () => {
      const dateRange = getReportDateRange('thisMonth', undefined, undefined, refDate);
      const report = generateEmployeeReport(mockEmployees, mockAttendance, mockFinances, dateRange);

      // Configured total for active employees: 12000 + 10000 = 22000
      expect(report.totalConfiguredSalaryTk).toBe(22000);
      // Actual paid recorded in financial transactions: 8000
      expect(report.totalPaidSalaryTk).toBe(8000);

      const emp1Summary = report.employeeSummaries.find((e) => e.employeeId === 'emp-1');
      expect(emp1Summary?.payrollStatus.status).toBe('partial');
      expect(emp1Summary?.payrollStatus.paidAmount).toBe(8000);
      expect(emp1Summary?.payrollStatus.dueAmount).toBe(4000); // 12000 - 8000
    });
  });

  // 6. Biogas & Maintenance Reports
  describe('6. Biogas and Maintenance Reports', () => {
    const mockLogs: BiogasDailyLog[] = [
      {
        id: 'bio-1',
        date: '2026-10-08',
        dungInputKg: 50,
        waterInputLiters: 50,
        burnHoursToday: 5.5,
        slurryProducedBags: 2,
        status: 'optimal',
        statusBn: 'স্বাভাবিক',
      },
      {
        id: 'bio-2',
        date: '2026-10-09',
        dungInputKg: 60,
        waterInputLiters: 60,
        burnHoursToday: 6.0,
        slurryProducedBags: 2,
        status: 'optimal',
        statusBn: 'স্বাভাবিক',
      },
    ];

    const mockInspections: BiogasInspectionItem[] = [
      {
        id: 'insp-1',
        date: '2026-10-08',
        itemKey: 'safety_valve',
        itemNameBn: 'সেফটি ভালভ পরীক্ষা',
        status: 'good',
        statusBn: 'স্বাভাবিক',
      },
      {
        id: 'insp-2',
        date: '2026-10-09',
        itemKey: 'pipes',
        itemNameBn: 'গ্যাস পাইপলাইন',
        status: 'needs_attention',
        statusBn: 'সতর্কতা প্রয়োজন',
      },
    ];

    it('calculates totals and averages over days with actual records', () => {
      const dateRange = getReportDateRange('thisMonth', undefined, undefined, refDate);
      const report = generateBiogasReport(mockLogs, mockInspections, dateRange);

      expect(report.recordDaysCount).toBe(2);
      expect(report.totalDungKg).toBe(110);
      expect(report.totalWaterLiters).toBe(110);
      expect(report.totalBurnHours).toBe(11.5);
      expect(report.totalSlurryBags).toBe(4);

      // Average divided strictly by 2 recorded days
      expect(report.avgDailyDungKg).toBe(55);
      expect(report.avgDailyWaterLiters).toBe(55);
      expect(report.avgDailyBurnHours).toBe(5.75);

      expect(report.inspectionsCompletedCount).toBe(2);
      expect(report.inspectionsIssuesCount).toBe(1);
    });
  });

  // 7. Smart Reminders Urgency Classification & Life Cycle
  describe('7. Smart Reminder Urgency & Status Lifecycle', () => {
    it('classifies tasks into overdue, dueToday, dueSoon, upcoming, and completed', () => {
      const tasks: ReminderTask[] = [
        {
          id: 't-1',
          title: 'টিকা ডোজ',
          description: '',
          dueDate: '2026-10-08', // Before Oct 10
          priority: 'high',
          priorityBn: 'উচ্চ',
          category: 'vaccine',
          completed: false,
        },
        {
          id: 't-2',
          title: 'আজকের কাজ',
          description: '',
          dueDate: '2026-10-10', // Exact today
          priority: 'medium',
          priorityBn: 'মাঝারি',
          category: 'biogas',
          completed: false,
        },
        {
          id: 't-3',
          title: 'আসন্ন কাজ',
          description: '',
          dueDate: '2026-10-14', // Within 7 days
          priority: 'medium',
          priorityBn: 'মাঝারি',
          category: 'feed',
          completed: false,
        },
        {
          id: 't-4',
          title: 'পরবর্তী কাজ',
          description: '',
          dueDate: '2026-10-25', // Beyond 7 days
          priority: 'low',
          priorityBn: 'সাধারণ',
          category: 'other',
          completed: false,
        },
        {
          id: 't-5',
          title: 'সম্পন্ন কাজ',
          description: '',
          dueDate: '2026-10-05',
          priority: 'high',
          priorityBn: 'উচ্চ',
          category: 'vaccine',
          completed: true,
          completedAt: '2026-10-06',
        },
      ];

      const categorized = categorizeRemindersByUrgency(tasks, refDate);
      expect(categorized.overdue.length).toBe(1);
      expect(categorized.overdue[0].id).toBe('t-1');
      expect(categorized.dueToday.length).toBe(1);
      expect(categorized.dueToday[0].id).toBe('t-2');
      expect(categorized.dueSoon.length).toBe(1);
      expect(categorized.dueSoon[0].id).toBe('t-3');
      expect(categorized.upcoming.length).toBe(1);
      expect(categorized.upcoming[0].id).toBe('t-4');
      expect(categorized.completed.length).toBe(1);
      expect(categorized.completed[0].id).toBe('t-5');
    });
  });

  // 8. CSV Export UTF-8 BOM Verification
  describe('8. CSV Export UTF-8 BOM Verification', () => {
    it('creates CSV blobs with UTF-8 BOM and correct mime type', async () => {
      const rows = [
        ['মুমিন এগ্রো', 'দুধ বিক্রয়', '৫০০০'],
        ['রহিম উদ্দিন', 'বেতন', '৮০০০'],
      ];

      const blob = buildCsvBlob(rows);
      expect(blob).toBeDefined();
      expect(blob.type).toBe('text/csv;charset=utf-8;');

      // Verify the UTF-8 BOM bytes: 0xEF, 0xBB, 0xBF
      const buffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      expect(bytes[0]).toBe(0xEF);
      expect(bytes[1]).toBe(0xBB);
      expect(bytes[2]).toBe(0xBF);

      const text = await blob.text();
      expect(text).toContain('মুমিন এগ্রো');
      expect(text).toContain('রহিম উদ্দিন');
    });

    it('safely handles non-browser environment in export helpers without throw', () => {
      expect(() => {
        exportFinancialCsv(
          [
            {
              id: 'fin-1',
              date: '2026-10-10',
              type: 'income',
              category: 'milk_sale',
              categoryLabelBn: 'দুধ বিক্রি',
              title: 'দুধ বিক্রয়',
              amount: 5000,
              paymentMethod: 'cash',
              recordedBy: 'আব্বু',
            },
          ],
          '2026-10-01 থেকে 2026-10-10'
        );
      }).not.toThrow();
    });

    it('ensures CSV exports strictly respect date range and filters', () => {
      const records: FinancialRecord[] = [
        {
          id: 'f-in',
          date: '2026-10-05',
          type: 'income',
          category: 'milk_sale',
          categoryLabelBn: 'দুধ বিক্রি',
          title: 'ইন-রেঞ্জ বিক্রয়',
          amount: 3000,
          paymentMethod: 'cash',
          recordedBy: 'আব্বু',
        },
        {
          id: 'f-out',
          date: '2026-09-01',
          type: 'income',
          category: 'milk_sale',
          categoryLabelBn: 'দুধ বিক্রি',
          title: 'আউট-অফ-রেঞ্জ বিক্রয়',
          amount: 4000,
          paymentMethod: 'cash',
          recordedBy: 'আব্বু',
        },
      ];

      const range = getReportDateRange('thisMonth', undefined, undefined, refDate);
      const filtered = records.filter((r) => isDateInRange(r.date, range.startDate, range.endDate));
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('f-in');
    });
  });

  // 9. Reminder Consolidation & Duplicate Prevention
  describe('9. Smart Reminder Consolidation & Duplicate Prevention', () => {
    const existingTasks: ReminderTask[] = [
      {
        id: 'task-manual-1',
        title: 'গোয়ালঘর জীবাণুনাশক স্প্রে',
        description: 'সকালের কাজ',
        dueDate: '2026-10-12',
        priority: 'medium',
        priorityBn: 'মাঝারি',
        category: 'worker',
        completed: false,
        assignedTo: 'রহিম উদ্দিন',
      },
      {
        id: 'task-linked-hr',
        title: 'গাভী-০১ এর বুস্টার টিকা',
        description: 'ইতিমধ্যে তৈরি কাজ',
        dueDate: '2026-10-15',
        priority: 'high',
        priorityBn: 'জরুরি',
        category: 'vaccine',
        completed: false,
        cowId: 'cow-1',
        relatedHealthRecordId: 'hr-existing-1',
        assignedTo: 'রহিম উদ্দিন',
      },
    ];

    const healthRecords: HealthRecord[] = [
      // 1. Has explicit task linked via relatedHealthRecordId (MUST NOT duplicate)
      {
        id: 'hr-existing-1',
        cowId: 'cow-1',
        cowTag: 'গাভী-০১',
        cowName: 'লালমনি',
        eventType: 'vaccination',
        eventTypeLabelBn: 'টিকা প্রদান',
        eventDate: '2026-09-15',
        nextDueDate: '2026-10-15',
        treatmentName: 'খুরারোগ বুস্টার',
        doctorName: 'ডা. আনিসুর',
        cost: 400,
      },
      // 2. Unlinked health record with nextDueDate (SHOULD synthesize reminder)
      {
        id: 'hr-new-1',
        cowId: 'cow-2',
        cowTag: 'গাভী-০২',
        cowName: 'শাপলা',
        eventType: 'deworming',
        eventTypeLabelBn: 'কৃমিনাশক',
        eventDate: '2026-09-20',
        nextDueDate: '2026-10-20',
        treatmentName: 'অ্যালবেনডাজল বোলাস',
        cost: 250,
      },
      // 3. Health record without nextDueDate (SHOULD NOT synthesize)
      {
        id: 'hr-no-due',
        cowId: 'cow-3',
        cowTag: 'গাভী-০৩',
        cowName: 'পদ্মা',
        eventType: 'treatment',
        eventTypeLabelBn: 'চিকিৎসা',
        eventDate: '2026-09-22',
        treatmentName: 'ক্যালসিয়াম টনিক',
        cost: 600,
      },
    ];

    const biogasInspections: BiogasInspectionItem[] = [
      // Inspection with nextInspectionDate (SHOULD synthesize reminder)
      {
        id: 'insp-1',
        date: '2026-10-08',
        itemKey: 'safety_valve',
        itemNameBn: 'সেফটি ভালভ ও প্রেসার রিলিজ',
        status: 'urgent',
        statusBn: 'জরুরি তদারকি',
        nextInspectionDate: '2026-10-18',
        inspectorName: 'করিম হাসান',
      },
      // Inspection without nextInspectionDate (SHOULD NOT synthesize)
      {
        id: 'insp-2',
        date: '2026-10-09',
        itemKey: 'inlet',
        itemNameBn: 'ইনলেট চেম্বার',
        status: 'good',
        statusBn: 'সঠিক',
      },
    ];

    it('synthesizes health and biogas reminders without duplicating existing tasks', () => {
      const consolidated = consolidateFarmReminders({
        tasks: existingTasks,
        healthRecords,
        biogasInspections,
      });

      // Original 2 tasks + 1 synthesized from hr-new-1 + 1 synthesized from insp-1 = 4 total
      expect(consolidated.length).toBe(4);

      // Verify no duplicate for hr-existing-1
      const hrExistingMatches = consolidated.filter(
        (t) => t.relatedHealthRecordId === 'hr-existing-1'
      );
      expect(hrExistingMatches.length).toBe(1);
      expect(hrExistingMatches[0].id).toBe('task-linked-hr');

      // Verify hr-new-1 synthesized with proper category, dueDate, and details
      const hrNewTask = consolidated.find((t) => t.relatedHealthRecordId === 'hr-new-1');
      expect(hrNewTask).toBeDefined();
      expect(hrNewTask?.dueDate).toBe('2026-10-20');
      expect(hrNewTask?.category).toBe('medicine');
      expect(hrNewTask?.title).toContain('গাভী-০২ (শাপলা)');

      // Verify insp-1 synthesized with urgent priority and biogas category
      const inspTask = consolidated.find((t) => t.id === 'auto-insp-insp-1');
      expect(inspTask).toBeDefined();
      expect(inspTask?.dueDate).toBe('2026-10-18');
      expect(inspTask?.category).toBe('biogas');
      expect(inspTask?.priority).toBe('high');
      expect(inspTask?.title).toContain('সেফটি ভালভ');
    });

    it('preserves health records history when a reminder is marked completed without creating medical records', () => {
      const consolidated = consolidateFarmReminders({
        tasks: existingTasks,
        healthRecords,
        biogasInspections,
      });

      const autoTask = consolidated.find((t) => t.relatedHealthRecordId === 'hr-new-1');
      expect(autoTask).toBeDefined();

      // Simulate marking the task as completed
      const completedTask: ReminderTask = {
        ...autoTask!,
        completed: true,
        completedAt: '2026-10-20',
      };

      // Underlying health record remains completely unchanged
      const originalHr = healthRecords.find((h) => h.id === 'hr-new-1');
      expect(originalHr).toBeDefined();
      expect(originalHr?.treatmentName).toBe('অ্যালবেনডাজল বোলাস');
      expect(originalHr?.cost).toBe(250);

      // Subsequent consolidation recognizes the completed task and does not recreate an uncompleted duplicate
      const nextConsolidated = consolidateFarmReminders({
        tasks: [...existingTasks, completedTask],
        healthRecords,
        biogasInspections,
      });

      const matches = nextConsolidated.filter((t) => t.relatedHealthRecordId === 'hr-new-1');
      expect(matches.length).toBe(1);
      expect(matches[0].completed).toBe(true);
    });
  });

  // 10. Monthly Trends and Multi-Month Aggregations
  describe('10. Monthly Trends for Financial, Milk & Biogas Reports', () => {
    it('computes monthly milk trends accurately without double counting', () => {
      const records: MilkRecord[] = [
        {
          id: 'm-sep-1',
          date: '2026-09-15',
          morningLiters: 30,
          eveningLiters: 20,
          totalLiters: 50,
          entryType: 'aggregate',
          isSold: true,
          soldLiters: 40,
          pricePerLiter: 80,
          totalAmount: 3200,
          recordedBy: 'আব্বু',
        },
        {
          id: 'm-oct-1',
          date: '2026-10-05',
          morningLiters: 35,
          eveningLiters: 25,
          totalLiters: 60,
          entryType: 'aggregate',
          isSold: true,
          soldLiters: 50,
          pricePerLiter: 80,
          totalAmount: 4000,
          recordedBy: 'আব্বু',
        },
      ];

      const range = getReportDateRange('allTime');
      const report = generateMilkReport(records, [], range);

      expect(report.monthlyTrend.length).toBe(2);
      expect(report.monthlyTrend[0].month).toBe('2026-09');
      expect(report.monthlyTrend[0].collectedLiters).toBe(50);
      expect(report.monthlyTrend[0].soldLiters).toBe(40);
      expect(report.monthlyTrend[0].revenueTk).toBe(3200);

      expect(report.monthlyTrend[1].month).toBe('2026-10');
      expect(report.monthlyTrend[1].collectedLiters).toBe(60);
      expect(report.monthlyTrend[1].soldLiters).toBe(50);
      expect(report.monthlyTrend[1].revenueTk).toBe(4000);
    });

    it('computes monthly biogas trends accurately across multiple months', () => {
      const logs: BiogasDailyLog[] = [
        {
          id: 'bg-sep',
          date: '2026-09-20',
          dungInputKg: 80,
          waterInputLiters: 80,
          burnHoursToday: 4.5,
          slurryProducedBags: 2,
          status: 'optimal',
          statusBn: 'স্বাভাবিক',
        },
        {
          id: 'bg-oct',
          date: '2026-10-02',
          dungInputKg: 90,
          waterInputLiters: 90,
          burnHoursToday: 5.0,
          slurryProducedBags: 3,
          status: 'optimal',
          statusBn: 'স্বাভাবিক',
        },
      ];

      const range = getReportDateRange('allTime');
      const report = generateBiogasReport(logs, [], range);

      expect(report.monthlyTrend.length).toBe(2);
      expect(report.monthlyTrend[0].month).toBe('2026-09');
      expect(report.monthlyTrend[0].dungKg).toBe(80);
      expect(report.monthlyTrend[1].month).toBe('2026-10');
      expect(report.monthlyTrend[1].dungKg).toBe(90);
    });
  });

  // 11. Archived Records Preservation
  describe('11. Preservation of Historical Archived Cows and Employees in Reports', () => {
    it('preserves health records and milk records of archived cows in historical reports', () => {
      const cows: Cow[] = [
        {
          id: 'cow-archived',
          tagNumber: 'COW-SOLD-99',
          name: 'রুপা',
          breed: 'দেশি',
          ageYears: 6,
          status: 'sold',
          statusLabelBn: 'বিক্রি হয়েছে',
          dailyAvgMilkLiters: 0,
          lastMilkingLiters: 0,
          isArchived: true,
          archivedAt: '2026-09-10',
        },
      ];

      const healthRecords: HealthRecord[] = [
        {
          id: 'hr-archived',
          cowId: 'cow-archived',
          cowTag: 'COW-SOLD-99',
          cowName: 'রুপা',
          eventType: 'treatment',
          eventTypeLabelBn: 'চিকিৎসা',
          eventDate: '2026-08-15',
          treatmentName: 'খুরা চিকিৎসা',
          cost: 500,
        },
      ];

      const range = getReportDateRange('allTime');
      const report = generateHealthReport(healthRecords, cows, [], range);

      expect(report.totalArchivedCows).toBe(1);
      expect(report.totalActiveCows).toBe(0);
      expect(report.eventsList.length).toBe(1);
      expect(report.eventsList[0].cowTag).toBe('COW-SOLD-99');
      expect(report.eventsList[0].cowName).toBe('রুপা');
      expect(report.totalHealthCostTk).toBe(500);
    });

    it('preserves historical attendance and payroll of archived employees in past reports', () => {
      const employees: Employee[] = [
        {
          id: 'emp-archived',
          name: 'সাবেক কর্মী',
          role: 'খামারি',
          phone: '01700000000',
          salaryMonthly: 8000,
          joiningDate: '2025-01-01',
          assignedDuties: [],
          status: 'inactive',
          avatarInitials: 'SK',
          isArchived: true,
          archivedAt: '2026-09-01',
        },
      ];

      const attendance: AttendanceRecord[] = [
        {
          id: 'att-past',
          employeeId: 'emp-archived',
          date: '2026-08-20',
          status: 'present',
          statusBn: 'উপস্থিত',
        },
      ];

      const range = getReportDateRange('allTime');
      const report = generateEmployeeReport(employees, attendance, [], range);

      expect(report.totalArchivedEmployees).toBe(1);
      expect(report.totalActiveEmployees).toBe(0);
      expect(report.totalPresentDays).toBe(1);
      expect(report.employeeSummaries[0].presentDays).toBe(1);
    });
  });

  // 12. Safe Zero-Value & Empty State Resilience
  describe('12. Safe Zero-Value & Empty State Resilience Across All Reports', () => {
    const emptyRange = getReportDateRange('custom', '2024-01-01', '2024-01-31');

    it('safely handles empty financial dataset without NaN or error', () => {
      const rep = generateFinancialReport([], emptyRange);
      expect(rep.summary.totalIncome).toBe(0);
      expect(rep.summary.totalExpenses).toBe(0);
      expect(rep.summary.netOperatingResult).toBe(0);
      expect(rep.summary.operatingMarginPct).toBe(0);
      expect(rep.monthlyTrend).toEqual([]);
    });

    it('safely handles empty milk dataset without NaN or error', () => {
      const rep = generateMilkReport([], [], emptyRange);
      expect(rep.totalCollectedLiters).toBe(0);
      expect(rep.totalSoldLiters).toBe(0);
      expect(rep.totalRevenueTk).toBe(0);
      expect(rep.averageDailyCollection).toBe(0);
      expect(rep.dailyBreakdown).toEqual([]);
      expect(rep.cowBreakdown).toEqual([]);
      expect(rep.monthlyTrend).toEqual([]);
    });

    it('safely handles empty health dataset without error', () => {
      const rep = generateHealthReport([], [], [], emptyRange);
      expect(rep.totalActiveCows).toBe(0);
      expect(rep.totalHealthEvents).toBe(0);
      expect(rep.totalHealthCostTk).toBe(0);
      expect(rep.eventsList).toEqual([]);
    });

    it('safely handles empty employee dataset without error', () => {
      const rep = generateEmployeeReport([], [], [], emptyRange);
      expect(rep.totalActiveEmployees).toBe(0);
      expect(rep.totalConfiguredSalaryTk).toBe(0);
      expect(rep.totalPaidSalaryTk).toBe(0);
      expect(rep.employeeSummaries).toEqual([]);
    });

    it('safely handles empty biogas dataset without error', () => {
      const rep = generateBiogasReport([], [], emptyRange);
      expect(rep.recordDaysCount).toBe(0);
      expect(rep.totalDungKg).toBe(0);
      expect(rep.avgDailyDungKg).toBe(0);
      expect(rep.logsList).toEqual([]);
      expect(rep.monthlyTrend).toEqual([]);
    });
  });
});

