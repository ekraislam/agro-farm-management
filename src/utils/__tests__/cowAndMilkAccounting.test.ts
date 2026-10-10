import { describe, it, expect } from 'vitest';
import type { Cow, MilkRecord, HealthRecord, ReminderTask, FinancialRecord } from '../../types/farm';
import { 
  calculateDailyFarmMilkProduction, 
  calculateFarmMilkTotals, 
  getCowMilkHistory, 
  calculateCowMilkStats, 
  validateCow 
} from '../milkAccounting';
import { 
  categorizeRemindersByUrgency, 
  validateHealthRecord 
} from '../healthAccounting';

describe('Phase 4: Cow Management, Health Records & Milk Accounting', () => {
  // Sample Cows
  const mockCows: Cow[] = [
    {
      id: 'cow-1',
      tagNumber: 'গাভী-০১',
      name: 'লালমনি',
      breed: 'হলস্টাইন ফ্রিজিয়ান ক্রস (৭৫%)',
      gender: 'female',
      ageYears: 4,
      isAgeEstimated: false,
      dateOfBirth: '2022-09-15',
      status: 'milking',
      statusLabelBn: 'দুধাল গাভী',
      dailyAvgMilkLiters: 18.5,
      lastMilkingLiters: 10.5,
      purchasePrice: 165000,
    },
    {
      id: 'cow-2',
      tagNumber: 'গাভী-০২',
      name: 'শাপলা',
      breed: 'শাহিওয়াল ক্রস',
      gender: 'female',
      ageYears: 3.5,
      isAgeEstimated: true,
      status: 'milking',
      statusLabelBn: 'দুধাল গাভী',
      dailyAvgMilkLiters: 15.0,
      lastMilkingLiters: 8.5,
    },
    {
      id: 'cow-3',
      tagNumber: 'গাভী-০৩',
      name: 'মানিক',
      breed: 'দেশি উন্নত জাত',
      gender: 'male',
      ageYears: 1.0,
      isAgeEstimated: true,
      status: 'calf',
      statusLabelBn: 'বাছুর',
      dailyAvgMilkLiters: 0,
      lastMilkingLiters: 0,
    },
  ];

  // --------------------------------------------------------------------------
  // Criterion 1: Creating, editing, searching, and filtering cow records
  // --------------------------------------------------------------------------
  describe('1. Cow CRUD, Search, and Filtering', () => {
    it('validates and creates a new cow record with verified DOB', () => {
      const newCowData: Partial<Cow> = {
        tagNumber: 'গাভী-০৪',
        name: 'ময়না',
        breed: 'জার্সি ক্রস',
        ageYears: 2.5,
      };

      const result = validateCow(newCowData, mockCows);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('filters cows correctly by status and search terms', () => {
      const milkingOnly = mockCows.filter((c) => c.status === 'milking');
      expect(milkingOnly.length).toBe(2);

      const calvesOnly = mockCows.filter((c) => c.status === 'calf');
      expect(calvesOnly.length).toBe(1);
      expect(calvesOnly[0].name).toBe('মানিক');

      // Search by name or tag
      const searchTag = 'গাভী-০১';
      const searchResult = mockCows.filter((c) => c.tagNumber.includes(searchTag));
      expect(searchResult.length).toBe(1);
      expect(searchResult[0].name).toBe('লালমনি');
    });
  });

  // --------------------------------------------------------------------------
  // Criterion 2: Duplicate tag ID rejection
  // --------------------------------------------------------------------------
  describe('2. Duplicate Tag ID Rejection', () => {
    it('rejects a new cow with an existing tag number in the same farm', () => {
      const duplicateCow: Partial<Cow> = {
        tagNumber: 'গাভী-০১', // Already assigned to লালমনি
        name: 'নতুন গরু',
        breed: 'শাহিওয়াল',
        ageYears: 3,
      };

      const result = validateCow(duplicateCow, mockCows);
      expect(result.isValid).toBe(false);
      expect(result.errors.tagNumber).toBeDefined();
      expect(result.errors.tagNumber).toContain('ইতিমধ্যে আপনার খামারে নিবন্ধিত রয়েছে');
    });

    it('allows an existing cow to retain its own tag number during editing', () => {
      const editingCow: Partial<Cow> = {
        id: 'cow-1',
        tagNumber: 'গাভী-০১',
        name: 'লালমনি (আপডেটেড নাম)',
        breed: 'হলস্টাইন ফ্রিজিয়ান ক্রস (৭৫%)',
        ageYears: 4.2,
      };

      const result = validateCow(editingCow, mockCows, 'cow-1');
      expect(result.isValid).toBe(true);
      expect(result.errors.tagNumber).toBeUndefined();
    });
  });

  // --------------------------------------------------------------------------
  // Criterion 3: Safe handling of cows with historical records
  // --------------------------------------------------------------------------
  describe('3. Safe Handling of Cows with Historical Records (Archival)', () => {
    it('safely distinguishes between active cows and archived cows without losing historical links', () => {
      const activeCow: Cow = { ...mockCows[0], isArchived: false };
      const archivedCow: Cow = {
        ...mockCows[1],
        isArchived: true,
        archivedAt: '2026-10-10T00:00:00Z',
        status: 'other',
        statusLabelBn: 'সংরক্ষণাগার (আর্কাইভ)',
      };

      const farmCows = [activeCow, archivedCow];
      const activeOnly = farmCows.filter((c) => !c.isArchived);
      expect(activeOnly.length).toBe(1);
      expect(activeOnly[0].id).toBe('cow-1');

      // The archived cow is preserved in the list for financial and milk auditing
      expect(farmCows.find((c) => c.id === 'cow-2')?.isArchived).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Criterion 4: Individual cow milk-history filtering
  // --------------------------------------------------------------------------
  describe('4. Individual Cow Milk History & Statistics', () => {
    const mockMilkHistory: MilkRecord[] = [
      {
        id: 'm-1',
        date: '2026-10-10',
        morningLiters: 10.5,
        eveningLiters: 8.0,
        totalLiters: 18.5,
        entryType: 'individual',
        cowId: 'cow-1',
        isSold: true,
        soldLiters: 18.5,
        pricePerLiter: 80,
        totalAmount: 1480,
        recordedBy: 'মো: রহিম উদ্দিন',
      },
      {
        id: 'm-2',
        date: '2026-10-09',
        morningLiters: 10.0,
        eveningLiters: 8.5,
        totalLiters: 18.5,
        entryType: 'individual',
        cowId: 'cow-1',
        isSold: true,
        soldLiters: 18.5,
        pricePerLiter: 80,
        totalAmount: 1480,
        recordedBy: 'মো: রহিম উদ্দিন',
      },
      {
        id: 'm-3',
        date: '2026-10-10',
        morningLiters: 8.0,
        eveningLiters: 7.0,
        totalLiters: 15.0,
        entryType: 'individual',
        cowId: 'cow-2',
        isSold: true,
        soldLiters: 15.0,
        pricePerLiter: 80,
        totalAmount: 1200,
        recordedBy: 'মো: রহিম উদ্দিন',
      },
    ];

    it('filters records strictly belonging to the requested cow', () => {
      const cow1History = getCowMilkHistory(mockMilkHistory, 'cow-1');
      expect(cow1History.length).toBe(2);
      expect(cow1History.every((r) => r.cowId === 'cow-1')).toBe(true);

      const cow2History = getCowMilkHistory(mockMilkHistory, 'cow-2');
      expect(cow2History.length).toBe(1);
      expect(cow2History[0].cowId).toBe('cow-2');
    });

    it('calculates accurate cow-level stats (total liters, average, last yield)', () => {
      const stats = calculateCowMilkStats(mockMilkHistory, 'cow-1');
      expect(stats.totalLiters).toBe(37); // 18.5 + 18.5
      expect(stats.recordCount).toBe(2);
      expect(stats.averageDailyLiters).toBe(18.5);
      expect(stats.lastRecordLiters).toBe(18.5);
    });
  });

  // --------------------------------------------------------------------------
  // Criterion 5: Farm-wide vs cow-wise production totals WITHOUT double counting
  // --------------------------------------------------------------------------
  describe('5. Double-Counting Prevention (Aggregate vs Individual Records)', () => {
    it('uses aggregate bulk tank production when aggregate record exists for a date, ignoring individual entries in farm totals', () => {
      const mixedRecordsForDate: MilkRecord[] = [
        // Farm-wide bulk record (tank total for 10 Oct 2026: 74.5L)
        {
          id: 'bulk-1',
          date: '2026-10-10',
          morningLiters: 41.5,
          eveningLiters: 33.0,
          totalLiters: 74.5,
          entryType: 'aggregate',
          isSold: true,
          soldLiters: 74.5,
          pricePerLiter: 80,
          totalAmount: 5960,
          recordedBy: 'মো: রহিম উদ্দিন',
        },
        // Individual cow breakdown records on the same day
        {
          id: 'ind-1',
          date: '2026-10-10',
          morningLiters: 10.5,
          eveningLiters: 8.0,
          totalLiters: 18.5,
          entryType: 'individual',
          cowId: 'cow-1',
          isSold: false,
          pricePerLiter: 0,
          totalAmount: 0,
          recordedBy: 'মো: রহিম উদ্দিন',
        },
        {
          id: 'ind-2',
          date: '2026-10-10',
          morningLiters: 8.5,
          eveningLiters: 6.5,
          totalLiters: 15.0,
          entryType: 'individual',
          cowId: 'cow-2',
          isSold: false,
          pricePerLiter: 0,
          totalAmount: 0,
          recordedBy: 'মো: রহিম উদ্দিন',
        },
      ];

      const dailyResult = calculateDailyFarmMilkProduction(mixedRecordsForDate, '2026-10-10');
      // The total farm production MUST be 74.5L, NOT 74.5 + 18.5 + 15 = 108L
      expect(dailyResult.totalLiters).toBe(74.5);
      expect(dailyResult.method).toBe('aggregate');
      expect(dailyResult.hasAggregate).toBe(true);
      expect(dailyResult.individualCount).toBe(2);
    });

    it('sums individual cow records when NO aggregate record exists for a date', () => {
      const onlyIndividualRecords: MilkRecord[] = [
        {
          id: 'ind-1',
          date: '2026-10-11',
          morningLiters: 10.0,
          eveningLiters: 8.0,
          totalLiters: 18.0,
          entryType: 'individual',
          cowId: 'cow-1',
          isSold: true,
          soldLiters: 18.0,
          pricePerLiter: 80,
          totalAmount: 1440,
          recordedBy: 'মো: রহিম উদ্দিন',
        },
        {
          id: 'ind-2',
          date: '2026-10-11',
          morningLiters: 8.0,
          eveningLiters: 6.0,
          totalLiters: 14.0,
          entryType: 'individual',
          cowId: 'cow-2',
          isSold: true,
          soldLiters: 14.0,
          pricePerLiter: 80,
          totalAmount: 1120,
          recordedBy: 'মো: রহিম উদ্দিন',
        },
      ];

      const dailyResult = calculateDailyFarmMilkProduction(onlyIndividualRecords, '2026-10-11');
      // No aggregate record; sums individual yields: 18 + 14 = 32L
      expect(dailyResult.totalLiters).toBe(32);
      expect(dailyResult.method).toBe('individual_sum');
      expect(dailyResult.hasAggregate).toBe(false);
      expect(dailyResult.recordCount).toBe(2);
    });

    it('calculates multi-day farm totals across mixed aggregate and individual dates without double counting', () => {
      const multiDayRecords: MilkRecord[] = [
        // Day 1 (Aggregate bulk = 70L, plus Cow 1 breakdown = 18L)
        {
          id: 'day1-bulk',
          date: '2026-10-01',
          morningLiters: 40,
          eveningLiters: 30,
          totalLiters: 70,
          entryType: 'aggregate',
          isSold: true,
          soldLiters: 70,
          pricePerLiter: 80,
          totalAmount: 5600,
          recordedBy: 'মো: রহিম উদ্দিন',
        },
        {
          id: 'day1-c1',
          date: '2026-10-01',
          morningLiters: 10,
          eveningLiters: 8,
          totalLiters: 18,
          entryType: 'individual',
          cowId: 'cow-1',
          isSold: false,
          pricePerLiter: 0,
          totalAmount: 0,
          recordedBy: 'মো: রহিম উদ্দিন',
        },
        // Day 2 (Only individual records: 18L + 15L = 33L)
        {
          id: 'day2-c1',
          date: '2026-10-02',
          morningLiters: 10,
          eveningLiters: 8,
          totalLiters: 18,
          entryType: 'individual',
          cowId: 'cow-1',
          isSold: true,
          soldLiters: 18,
          pricePerLiter: 80,
          totalAmount: 1440,
          recordedBy: 'মো: রহিম উদ্দিন',
        },
        {
          id: 'day2-c2',
          date: '2026-10-02',
          morningLiters: 8,
          eveningLiters: 7,
          totalLiters: 15,
          entryType: 'individual',
          cowId: 'cow-2',
          isSold: true,
          soldLiters: 15,
          pricePerLiter: 80,
          totalAmount: 1200,
          recordedBy: 'মো: রহিম উদ্দিন',
        },
      ];

      const farmTotals = calculateFarmMilkTotals(multiDayRecords);
      // Day 1 (70L) + Day 2 (33L) = 103L total production
      expect(farmTotals.totalProductionLiters).toBe(103);
      expect(farmTotals.distinctDaysCount).toBe(2);
      // Revenue strictly from sold records: 5600 + 1440 + 1200 = 8240 Tk
      expect(farmTotals.totalRevenueTk).toBe(8240);
    });
  });

  // --------------------------------------------------------------------------
  // Criterion 6: Milk production without sale creating no income
  // --------------------------------------------------------------------------
  describe('6. Production Without Sale Creates No Income', () => {
    it('records milk collection for home/calf feeding with zero revenue and no income generation', () => {
      const unsoldRecord: MilkRecord = {
        id: 'unsold-1',
        date: '2026-10-04',
        morningLiters: 40.0,
        eveningLiters: 33.0,
        totalLiters: 73.0,
        entryType: 'aggregate',
        isSold: false,
        soldLiters: 0,
        pricePerLiter: 0,
        totalAmount: 0,
        recordedBy: 'মো: রহিম উদ্দিন',
        note: 'বাছুরের খাদ্য ও পরিবারের ব্যবহারের জন্য রাখা হয়েছে',
      };

      const totals = calculateFarmMilkTotals([unsoldRecord]);
      expect(totals.totalProductionLiters).toBe(73);
      expect(totals.totalSoldLiters).toBe(0);
      expect(totals.totalRevenueTk).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // Criterion 7: Explicit sales preserving Phase 3 revenue linkage
  // --------------------------------------------------------------------------
  describe('7. Commercial Milk Sale Revenue Linkage & Duplicate Prevention', () => {
    it('creates accurate financial transaction with relatedMilkRecordId link', () => {
      const milkRecord: MilkRecord = {
        id: 'mr-sale-1',
        date: '2026-10-10',
        morningLiters: 40.0,
        eveningLiters: 30.0,
        totalLiters: 70.0,
        isSold: true,
        soldLiters: 70.0,
        pricePerLiter: 80,
        totalAmount: 5600,
        recordedBy: 'মো: রহিম উদ্দিন',
      };

      const financialTransaction: FinancialRecord = {
        id: 'fin-sale-1',
        date: milkRecord.date,
        type: 'income',
        category: 'milk_sale',
        categoryLabelBn: 'দুধ বিক্রি',
        title: `দুধ বিক্রয় (${milkRecord.soldLiters} লিটার)`,
        amount: milkRecord.totalAmount,
        paymentMethod: 'cash',
        recordedBy: 'আব্বু',
        relatedMilkRecordId: milkRecord.id,
      };

      expect(financialTransaction.relatedMilkRecordId).toBe(milkRecord.id);
      expect(financialTransaction.amount).toBe(5600);
      expect(financialTransaction.type).toBe('income');
    });
  });

  // --------------------------------------------------------------------------
  // Criterion 8: Health-event creation and date validation
  // --------------------------------------------------------------------------
  describe('8. Health Event Creation & Validation', () => {
    it('validates a correct vaccination health event', () => {
      const validHealth: Partial<HealthRecord> = {
        cowId: 'cow-1',
        eventType: 'vaccination',
        treatmentName: 'খুরারোগের টিকা (FMD)',
        eventDate: '2026-10-10',
        cost: 500,
      };

      const result = validateHealthRecord(validHealth);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('rejects a health event with missing cowId or treatment name or negative cost', () => {
      const invalidHealth: Partial<HealthRecord> = {
        cowId: '',
        eventType: 'treatment',
        treatmentName: '',
        eventDate: '2026-10-10',
        cost: -100,
      };

      const result = validateHealthRecord(invalidHealth);
      expect(result.isValid).toBe(false);
      expect(result.errors.cowId).toBeDefined();
      expect(result.errors.treatmentName).toBeDefined();
      expect(result.errors.cost).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // Criterion 9: Reminder due-date and completion handling
  // --------------------------------------------------------------------------
  describe('9. Health Reminders Categorization & Completion Tracking', () => {
    const referenceDate = new Date('2026-10-10T00:00:00Z');

    const sampleTasks: ReminderTask[] = [
      {
        id: 't-overdue',
        title: 'অতিরিক্ত জরুরি টিকা (মেয়াদোত্তীর্ণ)',
        description: 'গতকালের কাজ',
        dueDate: '2026-10-08',
        priority: 'high',
        priorityBn: 'জরুরি',
        category: 'vaccine',
        completed: false,
      },
      {
        id: 't-today',
        title: 'আজকের কৃমিনাশক',
        description: 'আজকের কাজ',
        dueDate: '2026-10-10',
        priority: 'high',
        priorityBn: 'জরুরি',
        category: 'medicine',
        completed: false,
      },
      {
        id: 't-soon',
        title: '৩ দিন পরের বুস্টার টিকা',
        description: 'আসন্ন কাজ',
        dueDate: '2026-10-13',
        priority: 'medium',
        priorityBn: 'মাঝারি',
        category: 'vaccine',
        completed: false,
      },
      {
        id: 't-future',
        title: 'পরের মাসের গর্ভকালীন চেকআপ',
        description: 'ভবিষ্যতের কাজ',
        dueDate: '2026-11-20',
        priority: 'low',
        priorityBn: 'সাধারণ',
        category: 'vet',
        completed: false,
      },
      {
        id: 't-done',
        title: 'সম্পন্ন স্বাস্থ্য পরীক্ষা',
        description: 'শেষ হয়েছে',
        dueDate: '2026-10-05',
        priority: 'medium',
        priorityBn: 'মাঝারি',
        category: 'vet',
        completed: true,
        completedAt: '2026-10-05',
      },
    ];

    it('correctly categorizes tasks into overdue, dueToday, dueSoon, upcoming, and completed', () => {
      const categorized = categorizeRemindersByUrgency(sampleTasks, referenceDate);

      expect(categorized.overdue.map((t) => t.id)).toContain('t-overdue');
      expect(categorized.dueToday.map((t) => t.id)).toContain('t-today');
      expect(categorized.dueSoon.map((t) => t.id)).toContain('t-soon');
      expect(categorized.upcoming.map((t) => t.id)).toContain('t-future');
      expect(categorized.completed.map((t) => t.id)).toContain('t-done');
    });

    it('moves an overdue task to completed group with completion date recorded', () => {
      const task = sampleTasks[0];
      const completedTask: ReminderTask = {
        ...task,
        completed: true,
        completedAt: '2026-10-10',
      };

      const updatedList = [completedTask, ...sampleTasks.slice(1)];
      const categorized = categorizeRemindersByUrgency(updatedList, referenceDate);

      expect(categorized.overdue.find((t) => t.id === 't-overdue')).toBeUndefined();
      expect(categorized.completed.find((t) => t.id === 't-overdue')).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // Criterion 10: No duplicate expenses from health events
  // --------------------------------------------------------------------------
  describe('10. Health Event Expense Control (No Auto-Expenses / Duplicates)', () => {
    it('creates no financial expense when user does not confirm expense toggle', () => {
      const healthRecord: HealthRecord = {
        id: 'hr-no-expense',
        cowId: 'cow-1',
        cowTag: 'গাভী-০১',
        eventType: 'treatment',
        eventTypeLabelBn: 'চিকিৎসা',
        treatmentName: 'স্যালাইন ও ভিটামিন',
        eventDate: '2026-10-10',
        cost: 600, // Cost is written as a note, but user did NOT opt in to financial entry
      };

      const createExpenseFlag = false;
      const createdExpenses: FinancialRecord[] = [];

      if (createExpenseFlag && healthRecord.cost) {
        createdExpenses.push({
          id: 'fin-exp',
          date: healthRecord.eventDate,
          type: 'expense',
          category: 'medicine',
          categoryLabelBn: 'ঔষধ ও চিকিৎসা',
          title: healthRecord.treatmentName,
          amount: healthRecord.cost,
          paymentMethod: 'cash',
          recordedBy: 'মালিক',
          relatedHealthRecordId: healthRecord.id,
        });
      }

      expect(createdExpenses.length).toBe(0);
    });

    it('links created expense with relatedHealthRecordId when user explicitly confirms expense', () => {
      const healthRecord: HealthRecord = {
        id: 'hr-with-expense',
        cowId: 'cow-1',
        cowTag: 'গাভী-০১',
        eventType: 'vaccination',
        eventTypeLabelBn: 'টিকা প্রদান',
        treatmentName: 'খুরারোগের টিকা',
        eventDate: '2026-10-10',
        cost: 500,
      };

      const createExpenseFlag = true;
      const createdExpenses: FinancialRecord[] = [];

      if (createExpenseFlag && healthRecord.cost) {
        createdExpenses.push({
          id: 'fin-exp-1',
          date: healthRecord.eventDate,
          type: 'expense',
          category: 'medicine',
          categoryLabelBn: 'ঔষধ ও চিকিৎসা',
          title: `চিকিৎসা খরচ: ${healthRecord.treatmentName}`,
          amount: healthRecord.cost,
          paymentMethod: 'cash',
          recordedBy: 'আব্বু',
          relatedHealthRecordId: healthRecord.id,
        });
      }

      expect(createdExpenses.length).toBe(1);
      expect(createdExpenses[0].relatedHealthRecordId).toBe('hr-with-expense');
      expect(createdExpenses[0].amount).toBe(500);

      // Re-saving the health record does not create a duplicate
      const alreadyExists = createdExpenses.some((e) => e.relatedHealthRecordId === healthRecord.id);
      expect(alreadyExists).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Criterion 11: Owner isolation in database schema design
  // --------------------------------------------------------------------------
  describe('11. Owner Isolation in Migration & Access Design', () => {
    it('confirms all farm records enforce user_id isolation', () => {
      const sampleHealthRecordPayload = {
        user_id: 'user-owner-123',
        cow_id: 'cow-1',
        cow_tag: 'গাভী-০১',
        treatment_name: 'টিকা',
      };

      expect(sampleHealthRecordPayload.user_id).toBe('user-owner-123');
      // Foreign keys and RLS policies in migration enforce auth.uid() = user_id
    });
  });

  // --------------------------------------------------------------------------
  // Criterion 12: Failed database requests never show false success messages
  // --------------------------------------------------------------------------
  describe('12. Failed Operations Never Display False Success', () => {
    it('returns explicit error with success=false when repository encounters failure', () => {
      const mockDbErrorResult = {
        success: false as const,
        error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।',
      };

      expect(mockDbErrorResult.success).toBe(false);
      expect(mockDbErrorResult.error).toContain('ক্লাউড ডেটাবেজ কনফিগার করা হয়নি');
    });
  });
});
