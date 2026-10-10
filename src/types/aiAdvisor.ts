import type { NavigationTab } from './farm';

export interface EvidenceData {
  period?: string;
  categories?: string[];
  totalsOrCounts?: Record<string, number | string>;
  sourceDates?: string[];
  relevantView?: NavigationTab;
  relevantViewLabelBn?: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string; // ISO string
  evidence?: EvidenceData;
  safetyWarning?: {
    type: 'veterinary' | 'biogas_safety' | 'general';
    titleBn: string;
    messageBn: string;
  };
  suggestedAction?: {
    tab: NavigationTab;
    labelBn: string;
  };
  isError?: boolean;
  isDemoPreview?: boolean;
}

export interface FarmAdvisorContext {
  userId?: string;
  isDemoData: boolean;
  queryTopic: 'finance' | 'milk' | 'cow_health' | 'employee' | 'biogas' | 'recommendations' | 'general';
  targetPeriodLabelBn: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  
  // Scoped Summaries (No PII, no raw unneeded notes)
  financialSummary?: {
    totalIncome: number;
    totalExpenses: number;
    netOperatingResult: number;
    isSurplus: boolean;
    incomeByCategory: Record<string, number>;
    expenseByCategory: Record<string, number>;
    highestExpenseCategory?: {
      category: string;
      categoryBn: string;
      amount: number;
    };
    hasRecordedMilkSales: boolean;
  };

  milkSummary?: {
    totalCollectedLiters: number;
    morningLiters: number;
    eveningLiters: number;
    totalSoldLiters: number;
    totalRevenueTk: number;
    totalRetainedLiters: number;
    distinctDaysCount: number;
    averageDailyLiters: number;
    previousPeriodComparison?: {
      previousTotalLiters: number;
      differenceLiters: number;
      percentageChange: number;
      trend: 'up' | 'down' | 'equal';
    };
  };

  healthSummary?: {
    totalActiveCows: number;
    totalArchivedCows: number;
    cowsByStatus: Record<string, number>;
    upcomingVaccines: {
      cowTag: string;
      cowName?: string;
      vaccineName: string;
      dueDate: string;
      isOverdue: boolean;
    }[];
    recentTreatmentsCount: number;
    totalHealthCostTk: number;
  };

  employeeSummary?: {
    activeEmployeesCount: number;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    pendingTasks: {
      employeeName?: string;
      taskTitle: string;
      dueDate: string;
      priorityBn: string;
      isOverdue: boolean;
    }[];
    totalConfiguredSalaryTk: number;
    totalPaidSalaryTk: number;
  };

  biogasSummary?: {
    recordDaysCount: number;
    totalDungKg: number;
    totalWaterLiters: number;
    totalBurnHours: number;
    totalSlurryBags: number;
    avgDailyDungKg: number;
    recentInspectionIssuesCount: number;
    overdueMaintenanceCount: number;
  };

  // Safety & Guard Flags
  isVeterinaryInquiry: boolean;
  isBiogasDangerInquiry: boolean;
  isUntrustedContentDetected: boolean;
  missingDataNotes?: string[];
}

export interface AiAdvisorQueryResult {
  success: boolean;
  answer: string;
  evidence?: EvidenceData;
  safetyWarning?: {
    type: 'veterinary' | 'biogas_safety' | 'general';
    titleBn: string;
    messageBn: string;
  };
  suggestedAction?: {
    tab: NavigationTab;
    labelBn: string;
  };
  error?: string;
  isDemoPreview?: boolean;
}
