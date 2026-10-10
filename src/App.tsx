import { useState, useEffect, useCallback, useMemo } from 'react';
import type { 
  NavigationTab, 
  Cow, 
  MilkRecord, 
  FinancialRecord, 
  Employee, 
  BiogasDailyLog, 
  BiogasInspectionItem,
  ReminderTask, 
  HealthRecord,
  AttendanceRecord,
  FarmSummary,
  FarmProfile
} from './types/farm';
import { 
  INITIAL_COWS, 
  INITIAL_MILK_RECORDS, 
  INITIAL_FINANCIAL_RECORDS, 
  INITIAL_EMPLOYEES, 
  INITIAL_BIOGAS_LOGS, 
  INITIAL_BIOGAS_INSPECTIONS,
  INITIAL_REMINDERS,
  INITIAL_HEALTH_RECORDS,
  INITIAL_ATTENDANCE_RECORDS
} from './data/demoData';

import { X, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { BottomNav } from './components/common/BottomNav';
import { Toast } from './components/common/Toast';
import type { ToastMessage } from './components/common/Toast';
import { ConfigStatusBanner } from './components/common/ConfigStatusBanner';

import { AddMilkModal } from './components/modals/AddMilkModal';
import { AddExpenseModal } from './components/modals/AddExpenseModal';
import { AddCowModal } from './components/modals/AddCowModal';
import { AddTaskModal } from './components/modals/AddTaskModal';
import { AddHealthRecordModal } from './components/modals/AddHealthRecordModal';
import { AddEmployeeModal } from './components/modals/AddEmployeeModal';
import { RecordAttendanceModal } from './components/modals/RecordAttendanceModal';
import { RecordSalaryPaymentModal } from './components/modals/RecordSalaryPaymentModal';
import { FarmPinModal } from './components/auth/FarmPinModal';
import { SupabaseSetupModal } from './components/modals/SupabaseSetupModal';
import { InstallAppModal } from './components/modals/InstallAppModal';
import { usePWAInstall } from './hooks/usePWAInstall';

import { DashboardView } from './components/views/DashboardView';
import { CowsView } from './components/views/CowsView';
import { MilkRecordsView } from './components/views/MilkRecordsView';
import { FinanceView } from './components/views/FinanceView';
import { EmployeesView } from './components/views/EmployeesView';
import { BiogasView } from './components/views/BiogasView';
import { ReportsView } from './components/views/ReportsView';
import { RemindersView } from './components/views/RemindersView';
import { AdvisorView } from './components/views/AdvisorView';
import { SettingsView } from './components/views/SettingsView';

import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { farmRepository } from './services/farmRepository';
import { localFarmStorage } from './services/localFarmStorage';
import { generateId } from './utils/id';
import { calculateDailyFarmMilkProduction } from './utils/milkAccounting';
import { consolidateFarmReminders } from './utils/healthAccounting';

function FarmDashboard() {
  const { user, isConfigured, isDemoMode } = useAuth();
  const isLiveCloud = Boolean(isConfigured && user && !isDemoMode);

  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const { isInstalled, isModalOpen, setIsModalOpen, triggerInstall, deferredPrompt } = usePWAInstall();

  // Persistent Local Farm Storage (persists automatically across page reloads and browser restarts)
  const [demoCows, setDemoCows] = useState<Cow[]>(() => localFarmStorage.getCows());
  const [demoMilkRecords, setDemoMilkRecords] = useState<MilkRecord[]>(() => localFarmStorage.getMilkRecords());
  const [demoFinancialRecords, setDemoFinancialRecords] = useState<FinancialRecord[]>(() => localFarmStorage.getFinancialRecords());
  const [demoEmployees, setDemoEmployees] = useState<Employee[]>(() => localFarmStorage.getEmployees());
  const [demoBiogasLogs, setDemoBiogasLogs] = useState<BiogasDailyLog[]>(() => localFarmStorage.getBiogasLogs());
  const [demoReminders, setDemoReminders] = useState<ReminderTask[]>(() => localFarmStorage.getReminders());
  const [demoHealthRecords, setDemoHealthRecords] = useState<HealthRecord[]>(() => localFarmStorage.getHealthRecords());
  const [demoAttendance, setDemoAttendance] = useState<AttendanceRecord[]>(() => localFarmStorage.getAttendance());
  const [demoInspections, setDemoInspections] = useState<BiogasInspectionItem[]>(() => localFarmStorage.getInspections());
  const [farmProfile, setFarmProfile] = useState<FarmProfile>(() => localFarmStorage.getFarmProfile());

  // Phase 2, 4 & 5 Cloud Data (populated from Supabase when authenticated)
  const [cloudCows, setCloudCows] = useState<Cow[]>([]);
  const [cloudMilkRecords, setCloudMilkRecords] = useState<MilkRecord[]>([]);
  const [cloudFinancialRecords, setCloudFinancialRecords] = useState<FinancialRecord[]>([]);
  const [cloudEmployees, setCloudEmployees] = useState<Employee[]>([]);
  const [cloudBiogasLogs, setCloudBiogasLogs] = useState<BiogasDailyLog[]>([]);
  const [cloudReminders, setCloudReminders] = useState<ReminderTask[]>([]);
  const [cloudHealthRecords, setCloudHealthRecords] = useState<HealthRecord[]>([]);
  const [cloudAttendance, setCloudAttendance] = useState<AttendanceRecord[]>([]);
  const [cloudInspections, setCloudInspections] = useState<BiogasInspectionItem[]>([]);

  // Cloud synchronization status
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);

  // Modals state
  const [isAddMilkOpen, setIsAddMilkOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialRecord | null>(null);
  const [isAddCowOpen, setIsAddCowOpen] = useState(false);
  const [editingCow, setEditingCow] = useState<Cow | null>(null);
  const [isAddHealthOpen, setIsAddHealthOpen] = useState(false);
  const [selectedCowForRecord, setSelectedCowForRecord] = useState<Cow | null>(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [selectedEmployeeForTask, setSelectedEmployeeForTask] = useState<string | undefined>(undefined);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isRecordAttendanceOpen, setIsRecordAttendanceOpen] = useState(false);
  const [selectedEmployeeForAttendance, setSelectedEmployeeForAttendance] = useState<string | undefined>(undefined);
  const [isRecordSalaryPaymentOpen, setIsRecordSalaryPaymentOpen] = useState(false);
  const [selectedEmployeeForSalary, setSelectedEmployeeForSalary] = useState<string | undefined>(undefined);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (message: string, subtitle?: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({
      id: generateId('toast'),
      message,
      subtitle,
      type,
    });
  };

  // Fetch real records when owner logs in to cloud mode
  const fetchCloudData = useCallback(async (userId: string) => {
    setIsLoadingCloud(true);
    setCloudError(null);

    try {
      const [cowsRes, milkRes, finRes, empRes, taskRes, bioRes, healthRes, attRes, inspRes, profileRes] = await Promise.all([
        farmRepository.getCows(userId),
        farmRepository.getMilkRecords(userId),
        farmRepository.getFinancialTransactions(userId),
        farmRepository.getEmployees(userId),
        farmRepository.getTasks(userId),
        farmRepository.getBiogasLogs(userId),
        farmRepository.getHealthRecords(userId),
        farmRepository.getAttendance(userId),
        farmRepository.getBiogasInspections(userId),
        farmRepository.getFarmProfile(userId),
      ]);

      if (cowsRes.success && cowsRes.data) setCloudCows(cowsRes.data);
      if (milkRes.success && milkRes.data) setCloudMilkRecords(milkRes.data);
      if (finRes.success && finRes.data) setCloudFinancialRecords(finRes.data);
      if (empRes.success && empRes.data) setCloudEmployees(empRes.data);
      if (taskRes.success && taskRes.data) setCloudReminders(taskRes.data);
      if (bioRes.success && bioRes.data) setCloudBiogasLogs(bioRes.data);
      if (healthRes.success && healthRes.data) setCloudHealthRecords(healthRes.data);
      if (attRes.success && attRes.data) setCloudAttendance(attRes.data);
      if (inspRes.success && inspRes.data) setCloudInspections(inspRes.data);
      if (profileRes.success && profileRes.data) setFarmProfile(profileRes.data);

      const firstError = [cowsRes, milkRes, finRes, empRes, taskRes, bioRes, healthRes, attRes, inspRes, profileRes].find((r) => !r.success)?.error;
      if (firstError) {
        setCloudError(firstError);
      }
    } catch (err) {
      setCloudError(err instanceof Error ? err.message : 'ক্লাউড ডেটা লোড করতে সমস্যা হয়েছে');
    } finally {
      setIsLoadingCloud(false);
    }
  }, []);

  useEffect(() => {
    if (isLiveCloud && user?.id) {
      const uid = user.id;
      queueMicrotask(() => {
        void fetchCloudData(uid);
      });
    }
  }, [isLiveCloud, user?.id, fetchCloudData]);

  // Automatically persist local farm storage whenever records change
  useEffect(() => {
    localFarmStorage.saveCows(demoCows);
  }, [demoCows]);

  useEffect(() => {
    localFarmStorage.saveMilkRecords(demoMilkRecords);
  }, [demoMilkRecords]);

  useEffect(() => {
    localFarmStorage.saveFinancialRecords(demoFinancialRecords);
  }, [demoFinancialRecords]);

  useEffect(() => {
    localFarmStorage.saveEmployees(demoEmployees);
  }, [demoEmployees]);

  useEffect(() => {
    localFarmStorage.saveBiogasLogs(demoBiogasLogs);
  }, [demoBiogasLogs]);

  useEffect(() => {
    localFarmStorage.saveReminders(demoReminders);
  }, [demoReminders]);

  useEffect(() => {
    localFarmStorage.saveHealthRecords(demoHealthRecords);
  }, [demoHealthRecords]);

  useEffect(() => {
    localFarmStorage.saveAttendance(demoAttendance);
  }, [demoAttendance]);

  useEffect(() => {
    localFarmStorage.saveInspections(demoInspections);
  }, [demoInspections]);

  useEffect(() => {
    localFarmStorage.saveFarmProfile(farmProfile);
  }, [farmProfile]);

  // Active dataset based on whether live cloud or demo mode is active
  const cows = isLiveCloud ? cloudCows : demoCows;
  const milkRecords = isLiveCloud ? cloudMilkRecords : demoMilkRecords;
  const financialRecords = isLiveCloud ? cloudFinancialRecords : demoFinancialRecords;
  const employees = isLiveCloud ? cloudEmployees : demoEmployees;
  const biogasLogs = isLiveCloud ? cloudBiogasLogs : demoBiogasLogs;
  const reminders = isLiveCloud ? cloudReminders : demoReminders;
  const healthRecords = isLiveCloud ? cloudHealthRecords : demoHealthRecords;
  const attendanceRecords = isLiveCloud ? cloudAttendance : demoAttendance;
  const biogasInspections = isLiveCloud ? cloudInspections : demoInspections;

  const activeEmployeesCount = useMemo(() => {
    return employees.filter((e) => !e.isArchived && e.status === 'active').length;
  }, [employees]);

  // Dynamic summary computation (preserving active non-archived cows)
  const activeCows = cows.filter((c) => !c.isArchived);
  const milkingCows = activeCows.filter((c) => c.status === 'milking').length;
  const pregnantCows = activeCows.filter((c) => c.status === 'pregnant').length;
  const calvesCount = activeCows.filter((c) => c.status === 'calf').length;

  // Farm milk production without double-counting
  const latestDate = milkRecords[0]?.date || '১০ অক্টোবর ২০২৬';
  const todayProduction = calculateDailyFarmMilkProduction(milkRecords, latestDate);
  const yesterdayDate = milkRecords.find((r) => r.date !== latestDate)?.date;
  const yesterdayProduction = yesterdayDate
    ? calculateDailyFarmMilkProduction(milkRecords, yesterdayDate)
    : { totalLiters: 0 };

  const monthIncomeTk = financialRecords
    .filter((r) => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);

  const monthExpensesTk = financialRecords
    .filter((r) => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);

  const consolidatedReminders = useMemo(() => {
    return consolidateFarmReminders({
      tasks: reminders,
      healthRecords,
      biogasInspections,
      cows,
      employees,
    });
  }, [reminders, healthRecords, biogasInspections, cows, employees]);

  const pendingTasksCount = consolidatedReminders.filter((r) => !r.completed).length;

  const farmSummary: FarmSummary = {
    totalCows: activeCows.length,
    milkingCows,
    pregnantCows,
    calvesCount,
    todayMilkLiters: todayProduction.totalLiters,
    yesterdayMilkLiters: yesterdayProduction.totalLiters,
    todayIncomeTk: milkRecords[0]?.totalAmount || 0,
    monthIncomeTk,
    monthExpensesTk,
    estimatedMonthProfitTk: monthIncomeTk - monthExpensesTk,
    pendingTasksCount,
  };

  // Handlers with honest database operations & error preservation
  const handleAddMilkRecord = async (
    record: MilkRecord,
    paymentMethod: 'cash' | 'bkash' | 'bank' = 'cash'
  ): Promise<{ success: boolean; error?: string }> => {
    const isSold = Boolean(record.isSold && record.totalAmount > 0);
    const soldLiters = record.soldLiters ?? record.totalLiters;

    if (isLiveCloud && user) {
      // 1. Insert milk record to Supabase
      const milkRes = await farmRepository.addMilkRecord(user.id, record);
      if (!milkRes.success || !milkRes.data) {
        return { success: false, error: milkRes.error || 'দুধের হিসাব ক্লাউডে সংরক্ষণ ব্যর্থ হয়েছে।' };
      }

      setCloudMilkRecords([milkRes.data, ...cloudMilkRecords]);

      // 2. Only insert linked income transaction if milk was actually sold
      if (isSold) {
        const incomeRecord: FinancialRecord = {
          id: generateId('fin'),
          date: record.date,
          type: 'income',
          category: 'milk_sale',
          categoryLabelBn: 'দুধ বিক্রি',
          title: `দুধ বিক্রয় (${soldLiters} লিটার)`,
          amount: record.totalAmount,
          paymentMethod,
          recordedBy: record.recordedBy,
          notes: record.note,
          relatedMilkRecordId: milkRes.data.id,
        };

        const finRes = await farmRepository.addFinancialTransaction(user.id, incomeRecord);
        if (finRes.success && finRes.data) {
          setCloudFinancialRecords([finRes.data, ...cloudFinancialRecords]);
        }
        showToast(
          'দুধের হিসাব ও বিক্রয় আয় সফলভাবে ক্লাউডে সংরক্ষিত হয়েছে!',
          `${record.totalLiters} লিটার সংগৃহীত, ${soldLiters} লিটার বিক্রয় (৳ ${record.totalAmount.toLocaleString('en-US')})`
        );
      } else {
        showToast(
          'দুধ সংগ্রহের হিসাব সংরক্ষিত হয়েছে (বাণিজ্যিক বিক্রয় ছাড়া)',
          `${record.totalLiters} লিটার দুধ সংগৃহীত`
        );
      }

      return { success: true };
    }

    // Demo / Local Offline Mode: Local storage update
    setDemoMilkRecords([record, ...demoMilkRecords]);
    if (isSold) {
      const incomeRecord: FinancialRecord = {
        id: generateId('fin'),
        date: record.date,
        type: 'income',
        category: 'milk_sale',
        categoryLabelBn: 'দুধ বিক্রি',
        title: `দুধ বিক্রয় (${soldLiters} লিটার)`,
        amount: record.totalAmount,
        paymentMethod,
        recordedBy: record.recordedBy,
        notes: record.note,
        relatedMilkRecordId: record.id,
      };
      setDemoFinancialRecords([incomeRecord, ...demoFinancialRecords]);
      showToast(
        'দুধের নতুন হিসাব ও বিক্রয় আয় সফলভাবে সংরক্ষিত হয়েছে!',
        `${record.totalLiters} লিটার সংগৃহীত, ${soldLiters} লিটার বিক্রয় (৳ ${record.totalAmount.toLocaleString('en-US')})`
      );
    } else {
      showToast(
        'দুধ সংগ্রহের হিসাব সংরক্ষিত হয়েছে!',
        `${record.totalLiters} লিটার দুধ সংগৃহীত`
      );
    }
    return { success: true };
  };

  const handleAddTransaction = async (record: FinancialRecord): Promise<{ success: boolean; error?: string }> => {
    if (isLiveCloud && user) {
      const res = await farmRepository.addFinancialTransaction(user.id, record);
      if (!res.success) {
        return { success: false, error: res.error || 'আর্থিক লেনদেন ক্লাউডে সংরক্ষণ করা সম্ভব হয়নি।' };
      }

      setCloudFinancialRecords([res.data!, ...cloudFinancialRecords]);
      showToast(
        record.type === 'income' ? 'নতুন আয় ক্লাউডে সংরক্ষিত হয়েছে!' : 'নতুন খরচ ক্লাউডে সংরক্ষিত হয়েছে!',
        `${record.title} (৳ ${record.amount.toLocaleString('en-US')})`
      );
      return { success: true };
    }

    // Local Offline Mode
    setDemoFinancialRecords([record, ...demoFinancialRecords]);
    showToast(
      record.type === 'income' ? 'নতুন আয় সফলভাবে যুক্ত হয়েছে!' : 'নতুন খরচ সফলভাবে যুক্ত হয়েছে!',
      `${record.title} (৳ ${record.amount.toLocaleString('en-US')})`
    );
    return { success: true };
  };

  const handleUpdateTransaction = async (record: FinancialRecord): Promise<{ success: boolean; error?: string }> => {
    if (isLiveCloud && user) {
      const res = await farmRepository.updateFinancialTransaction(user.id, record);
      if (!res.success) {
        return { success: false, error: res.error || 'আর্থিক লেনদেন হালনাগাদ করা সম্ভব হয়নি।' };
      }

      setCloudFinancialRecords(cloudFinancialRecords.map((r) => (r.id === record.id ? res.data! : r)));
      showToast('লেনদেন সফলভাবে হালনাগাদ করা হয়েছে!', `${record.title} (৳ ${record.amount.toLocaleString('en-US')})`);
      return { success: true };
    }

    // Local Offline Mode
    setDemoFinancialRecords(demoFinancialRecords.map((r) => (r.id === record.id ? record : r)));
    showToast('লেনদেন সফলভাবে হালনাগাদ করা হয়েছে!', `${record.title} (৳ ${record.amount.toLocaleString('en-US')})`);
    return { success: true };
  };

  const handleDeleteTransaction = async (txId: string): Promise<{ success: boolean; error?: string }> => {
    if (isLiveCloud && user) {
      const res = await farmRepository.deleteFinancialTransaction(user.id, txId);
      if (!res.success) {
        return { success: false, error: res.error || 'লেনদেন মুছে ফেলা সম্ভব হয়নি।' };
      }

      setCloudFinancialRecords(cloudFinancialRecords.filter((r) => r.id !== txId));
      showToast('লেনদেন সফলভাবে মুছে ফেলা হয়েছে!');
      return { success: true };
    }

    // Local Offline Mode
    setDemoFinancialRecords(demoFinancialRecords.filter((r) => r.id !== txId));
    showToast('লেনদেন সফলভাবে মুছে ফেলা হয়েছে!');
    return { success: true };
  };

  const handleSaveCow = async (cow: Cow): Promise<{ success: boolean; error?: string }> => {
    const isExisting = cows.some((c) => c.id === cow.id);
    if (isLiveCloud && user) {
      if (isExisting) {
        const res = await farmRepository.updateCow(user.id, cow);
        if (!res.success) {
          return { success: false, error: res.error || 'গরুর তথ্য হালনাগাদ করা সম্ভব হয়নি।' };
        }
        setCloudCows(cloudCows.map((c) => (c.id === cow.id ? res.data! : c)));
        showToast('গরুর তথ্য সফলভাবে ক্লাউডে হালনাগাদ হয়েছে!', `${cow.tagNumber} — ${cow.name}`);
        return { success: true };
      } else {
        const res = await farmRepository.addCow(user.id, cow);
        if (!res.success) {
          return { success: false, error: res.error || 'গরুর তথ্য ক্লাউডে সংরক্ষণ করা সম্ভব হয়নি।' };
        }
        setCloudCows([res.data!, ...cloudCows]);
        showToast('নতুন গরু সফলভাবে ক্লাউডে তালিকাভুক্ত হয়েছে!', `${cow.tagNumber} — ${cow.name}`);
        return { success: true };
      }
    }

    // Local Offline Mode
    if (isExisting) {
      setDemoCows(demoCows.map((c) => (c.id === cow.id ? cow : c)));
      showToast('গরুর তথ্য সফলভাবে সংরক্ষিত হয়েছে!', `${cow.tagNumber} — ${cow.name}`);
    } else {
      setDemoCows([cow, ...demoCows]);
      showToast('নতুন গরু সফলভাবে তালিকাভুক্ত হয়েছে!', `${cow.tagNumber} — ${cow.name}`);
    }
    return { success: true };
  };

  const handleDeleteOrArchiveCow = async (
    cow: Cow
  ): Promise<{ success: boolean; error?: string; isArchived?: boolean }> => {
    if (isLiveCloud && user) {
      const res = await farmRepository.deleteOrArchiveCow(user.id, cow.id);
      if (!res.success) {
        return { success: false, error: res.error || 'অপারেশন ব্যর্থ হয়েছে।' };
      }
      if (res.data?.archived) {
        setCloudCows(
          cloudCows.map((c) => (c.id === cow.id ? { ...c, isArchived: true, status: 'other' as const } : c))
        );
        showToast('গরুটিকে নিরাপদভাবে আর্কাইভ করা হয়েছে!', 'অতীতের দুধ ও স্বাস্থ্য রেকর্ড সুরক্ষিত রাখা হয়েছে।');
        return { success: true, isArchived: true };
      } else {
        setCloudCows(cloudCows.filter((c) => c.id !== cow.id));
        showToast('গরুটি সফলভাবে মুছে ফেলা হয়েছে!');
        return { success: true, isArchived: false };
      }
    }

    // Demo Mode
    const hasHistory =
      milkRecords.some((r) => r.cowId === cow.id) || healthRecords.some((h) => h.cowId === cow.id);
    if (hasHistory) {
      setDemoCows(
        demoCows.map((c) =>
          c.id === cow.id
            ? { ...c, isArchived: true, status: 'other' as const, archivedAt: '১০ অক্টোবর ২০২৬' }
            : c
        )
      );
      showToast('গরুটিকে নিরাপদভাবে সংরক্ষণ করা হয়েছে!', 'অতীতের দুধ ও স্বাস্থ্য রেকর্ড সুরক্ষিত রাখা হয়েছে।');
      return { success: true, isArchived: true };
    } else {
      setDemoCows(demoCows.filter((c) => c.id !== cow.id));
      showToast('গরুটি সফলভাবে মুছে ফেলা হয়েছে!');
      return { success: true, isArchived: false };
    }
  };

  const handleAddHealthRecord = async (
    record: HealthRecord,
    createExpense: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    if (isLiveCloud && user) {
      const res = await farmRepository.addHealthRecord(user.id, record, createExpense);
      if (!res.success) {
        return { success: false, error: res.error || 'স্বাস্থ্য রেকর্ড ক্লাউডে সংরক্ষণ ব্যর্থ হয়েছে।' };
      }
      if (res.data?.healthRecord) setCloudHealthRecords([res.data.healthRecord, ...cloudHealthRecords]);
      if (res.data?.expenseRecord) setCloudFinancialRecords([res.data.expenseRecord, ...cloudFinancialRecords]);

      showToast(
        'স্বাস্থ্য রেকর্ড ক্লাউডে সংরক্ষিত হয়েছে!',
        createExpense && record.cost
          ? `${record.treatmentName} (খরচ: ৳ ${record.cost.toLocaleString('en-US')})`
          : record.treatmentName
      );
      return { success: true };
    }

    // Local Offline Mode
    setDemoHealthRecords([record, ...demoHealthRecords]);
    if (createExpense && record.cost && record.cost > 0) {
      const expenseRecord: FinancialRecord = {
        id: generateId('fin'),
        date: record.eventDate,
        type: 'expense',
        category: 'medicine',
        categoryLabelBn: 'ঔষধ ও চিকিৎসা',
        title: `${record.cowTag} (${record.cowName || 'গরু'}) - ${record.treatmentName}`,
        amount: record.cost,
        paymentMethod: 'cash',
        recordedBy: record.doctorName || 'খামার মালিক',
        notes: record.notes || 'স্বাস্থ্যসেবা ও চিকিৎসা খরচ',
        relatedHealthRecordId: record.id,
      };
      setDemoFinancialRecords([expenseRecord, ...demoFinancialRecords]);
    }

    if (record.nextDueDate) {
      const reminderTask: ReminderTask = {
        id: generateId('rem'),
        title: `${record.cowTag} (${record.cowName || ''}) এর ফলো-আপ / বুস্টার টিকা`,
        description: `${record.treatmentName} এর পরবর্তী ডোজ বা পর্যবেক্ষণ।`,
        dueDate: record.nextDueDate,
        priority: 'medium',
        priorityBn: 'মাঝারি',
        category: 'vaccine',
        completed: false,
        cowId: record.cowId,
        relatedHealthRecordId: record.id,
        assignedTo: employees[0]?.name || `${farmProfile.ownerName} (মালিক)`,
      };
      setDemoReminders([reminderTask, ...demoReminders]);
    }

    showToast(
      'স্বাস্থ্য রেকর্ড সফলভাবে যোগ করা হয়েছে!',
      createExpense && record.cost
        ? `${record.treatmentName} (খরচ: ৳ ${record.cost.toLocaleString('en-US')})`
        : record.treatmentName
    );
    return { success: true };
  };

  const handleAddTask = async (task: ReminderTask): Promise<{ success: boolean; error?: string }> => {
    if (isLiveCloud && user) {
      const res = await farmRepository.addTask(user.id, task);
      if (!res.success) {
        return { success: false, error: res.error || 'কাজ ক্লাউডে সংরক্ষণ করা সম্ভব হয়নি।' };
      }

      setCloudReminders([res.data!, ...cloudReminders]);
      showToast('নতুন কাজ ও অনুস্মারক ক্লাউডে সংরক্ষিত হয়েছে!', task.title);
      return { success: true };
    }

    // Local Offline Mode
    setDemoReminders([task, ...demoReminders]);
    showToast('নতুন কাজ ও অনুস্মারক সফলভাবে যোগ করা হয়েছে!', task.title);
    return { success: true };
  };

  const handleToggleTask = async (taskId: string, completionDate?: string) => {
    const todayIso = new Date().toISOString().split('T')[0];
    const targetDate = completionDate || (isLiveCloud ? todayIso : '১০ অক্টোবর ২০২৬');

    if (isLiveCloud && user) {
      const currentTask = cloudReminders.find((r) => r.id === taskId);
      if (currentTask) {
        const nextCompleted = !currentTask.completed;
        const res = await farmRepository.toggleTask(user.id, taskId, nextCompleted, targetDate);
        if (!res.success) {
          showToast('কাজের স্ট্যাটাস আপডেট ব্যর্থ হয়েছে', res.error, 'error');
          return;
        }

        setCloudReminders(
          cloudReminders.map((r) =>
            r.id === taskId
              ? {
                  ...r,
                  completed: nextCompleted,
                  completedAt: nextCompleted ? targetDate : undefined,
                }
              : r
          )
        );
        showToast(
          nextCompleted ? 'কাজটি সম্পন্ন হিসেবে চিহ্নিত করা হয়েছে!' : 'কাজটি পুনরায় পেন্ডিং তালিকায় রাখা হয়েছে',
          currentTask.title
        );
      } else {
        // Auto-generated consolidated reminder from health records or biogas inspection
        const autoTask = consolidatedReminders.find((r) => r.id === taskId);
        if (!autoTask) return;
        const newTask: ReminderTask = {
          ...autoTask,
          completed: true,
          completedAt: targetDate,
        };
        const res = await farmRepository.addTask(user.id, newTask);
        if (res.success && res.data) {
          setCloudReminders([res.data, ...cloudReminders]);
          showToast('অনুস্মারকটি সফলভাবে সম্পন্ন করা হয়েছে!', autoTask.title);
        } else {
          showToast('অনুস্মারক সংরক্ষণ করা সম্ভব হয়নি', res.error, 'error');
        }
      }
      return;
    }

    // Local Offline Mode
    const currentDemo = demoReminders.find((r) => r.id === taskId);
    if (currentDemo) {
      setDemoReminders(
        demoReminders.map((r) => {
          if (r.id === taskId) {
            const newState = !r.completed;
            showToast(
              newState ? 'কাজটি সম্পন্ন হিসেবে চিহ্নিত করা হয়েছে!' : 'কাজটি পুনরায় পেন্ডিং তালিকায় রাখা হয়েছে',
              r.title
            );
            return {
              ...r,
              completed: newState,
              completedAt: newState ? targetDate : undefined,
            };
          }
          return r;
        })
      );
    } else {
      // Auto-generated consolidated task in Local Mode
      const autoTask = consolidatedReminders.find((r) => r.id === taskId);
      if (autoTask) {
        const completedAuto: ReminderTask = {
          ...autoTask,
          completed: true,
          completedAt: targetDate,
        };
        setDemoReminders([completedAuto, ...demoReminders]);
        showToast('অনুস্মারকটি সফলভাবে সম্পন্ন করা হয়েছে!', autoTask.title);
      }
    }
  };

  const handleAddBiogasLog = async (log: BiogasDailyLog) => {
    if (isLiveCloud && user) {
      const res = await farmRepository.addBiogasLog(user.id, log);
      if (!res.success) {
        showToast('বায়োগ্যাস লগ সংরক্ষণ ব্যর্থ হয়েছে', res.error, 'error');
        return;
      }
      setCloudBiogasLogs([res.data!, ...cloudBiogasLogs]);
      showToast('বায়োগ্যাস দৈনিক লগ ক্লাউডে সংরক্ষিত হয়েছে!', `${log.dungInputKg} কেজি গোবর ইনপুট`);
      return;
    }

    // Local Offline Mode
    setDemoBiogasLogs([log, ...demoBiogasLogs]);
    showToast('বায়োগ্যাস দৈনিক লগ সংরক্ষিত হয়েছে!', `${log.dungInputKg} কেজি গোবর ইনপুট`);
  };

  const handleUpdateBiogasLog = async (log: BiogasDailyLog): Promise<{ success: boolean; error?: string }> => {
    if (isLiveCloud && user) {
      const res = await farmRepository.updateBiogasLog(user.id, log);
      if (!res.success) {
        showToast('বায়োগ্যাস লগ সংশোধন ব্যর্থ হয়েছে', res.error, 'error');
        return { success: false, error: res.error };
      }
      setCloudBiogasLogs(cloudBiogasLogs.map((l) => (l.id === log.id ? res.data! : l)));
      showToast('বায়োগ্যাস লগ ক্লাউডে সংশোধিত হয়েছে!', `${log.dungInputKg} কেজি গোবর ইনপুট`);
      return { success: true };
    }

    // Local Offline Mode
    setDemoBiogasLogs(demoBiogasLogs.map((l) => (l.id === log.id ? log : l)));
    showToast('বায়োগ্যাস লগ সংশোধন সম্পন্ন!', `${log.dungInputKg} কেজি গোবর ইনপুট`);
    return { success: true };
  };

  const handleDeleteBiogasLog = async (logId: string): Promise<{ success: boolean; error?: string }> => {
    if (isLiveCloud && user) {
      const res = await farmRepository.deleteBiogasLog(user.id, logId);
      if (!res.success) {
        showToast('বায়োগ্যাস লগ মুছে ফেলা যায়নি', res.error, 'error');
        return { success: false, error: res.error };
      }
      setCloudBiogasLogs(cloudBiogasLogs.filter((l) => l.id !== logId));
      showToast('বায়োগ্যাস লগ মুছে ফেলা হয়েছে');
      return { success: true };
    }

    // Local Offline Mode
    setDemoBiogasLogs(demoBiogasLogs.filter((l) => l.id !== logId));
    showToast('বায়োগ্যাস লগ মুছে ফেলা হয়েছে');
    return { success: true };
  };

  const handleAddBiogasInspection = async (item: BiogasInspectionItem): Promise<{ success: boolean; error?: string }> => {
    if (isLiveCloud && user) {
      const res = await farmRepository.addBiogasInspection(user.id, item);
      if (!res.success) {
        showToast('নিরাপত্তা পরিদর্শন সংরক্ষণ ব্যর্থ হয়েছে', res.error, 'error');
        return { success: false, error: res.error };
      }
      setCloudInspections([res.data!, ...cloudInspections]);
      showToast('নিরাপত্তা পরিদর্শন ক্লাউডে সংরক্ষিত হয়েছে!', item.itemNameBn);
      return { success: true };
    }

    // Local Offline Mode
    setDemoInspections([item, ...demoInspections]);
    showToast('নিরাপত্তা পরিদর্শন সম্পন্ন হয়েছে!', item.itemNameBn);
    return { success: true };
  };

  const handleSaveEmployee = async (emp: Employee): Promise<{ success: boolean; error?: string }> => {
    if (isLiveCloud && user) {
      const isExisting = cloudEmployees.some((e) => e.id === emp.id);
      if (isExisting) {
        const res = await farmRepository.updateEmployee(user.id, emp);
        if (!res.success) {
          return { success: false, error: res.error || 'কর্মচারীর তথ্য সংশোধন করা যায়নি।' };
        }
        setCloudEmployees(cloudEmployees.map((e) => (e.id === emp.id ? res.data! : e)));
        showToast('কর্মচারীর তথ্য ক্লাউডে হালনাগাদ করা হয়েছে!', emp.name);
        return { success: true };
      } else {
        const res = await farmRepository.addEmployee(user.id, emp);
        if (!res.success) {
          return { success: false, error: res.error || 'নতুন কর্মচারী নিবন্ধন করা যায়নি।' };
        }
        setCloudEmployees([...cloudEmployees, res.data!]);
        showToast('নতুন কর্মচারী ক্লাউডে সফলভাবে নিবন্ধিত হয়েছে!', emp.name);
        return { success: true };
      }
    }

    // Local Offline Mode
    const isExisting = demoEmployees.some((e) => e.id === emp.id);
    if (isExisting) {
      setDemoEmployees(demoEmployees.map((e) => (e.id === emp.id ? emp : e)));
      showToast('কর্মচারীর তথ্য সংশোধন করা হয়েছে!', emp.name);
    } else {
      setDemoEmployees([...demoEmployees, emp]);
      showToast('নতুন কর্মচারী যোগ করা হয়েছে!', emp.name);
    }
    return { success: true };
  };

  const handleDeleteOrArchiveEmployee = async (empId: string): Promise<void> => {
    if (isLiveCloud && user) {
      const res = await farmRepository.deleteOrArchiveEmployee(user.id, empId);
      if (!res.success) {
        showToast('কর্মচারী মুছতে বা আর্কাইভ করতে সমস্যা হয়েছে', res.error, 'error');
        return;
      }
      if (res.data?.archived) {
        setCloudEmployees(
          cloudEmployees.map((e) =>
            e.id === empId ? { ...e, isArchived: true, status: 'inactive' } : e
          )
        );
        showToast('কর্মচারীর রেকর্ড নিরাপদে সংরক্ষণ করা হয়েছে', 'অতীতের উপস্থিতি ও বেতন সংক্রান্ত হিসাব সুরক্ষিত রয়েছে');
      } else {
        setCloudEmployees(cloudEmployees.filter((e) => e.id !== empId));
        showToast('কর্মচারী স্থায়ীভাবে মুছে ফেলা হয়েছে');
      }
      return;
    }

    // Local Offline Mode
    const hasHistory =
      demoAttendance.some((a) => a.employeeId === empId) ||
      demoReminders.some((t) => t.assignedEmployeeId === empId) ||
      demoFinancialRecords.some((f) => f.relatedEmployeeId === empId);

    if (hasHistory) {
      setDemoEmployees(
        demoEmployees.map((e) =>
          e.id === empId ? { ...e, isArchived: true, status: 'inactive' } : e
        )
      );
      showToast('কর্মচারীর রেকর্ড নিরাপদে সংরক্ষণ করা হয়েছে', 'অতীতের উপস্থিতি ও বেতন সংক্রান্ত হিসাব সুরক্ষিত রয়েছে');
    } else {
      setDemoEmployees(demoEmployees.filter((e) => e.id !== empId));
      showToast('কর্মচারী মুছে ফেলা হয়েছে');
    }
  };

  const handleRecordAttendance = async (record: AttendanceRecord): Promise<{ success: boolean; error?: string }> => {
    if (isLiveCloud && user) {
      const res = await farmRepository.recordAttendance(user.id, record);
      if (!res.success) {
        return { success: false, error: res.error || 'উপস্থিতি সংরক্ষণ ব্যর্থ হয়েছে।' };
      }
      const exists = cloudAttendance.some((a) => a.employeeId === record.employeeId && a.date === record.date);
      if (exists) {
        setCloudAttendance(
          cloudAttendance.map((a) =>
            a.employeeId === record.employeeId && a.date === record.date ? res.data! : a
          )
        );
      } else {
        setCloudAttendance([res.data!, ...cloudAttendance]);
      }
      showToast('উপস্থিতি তথ্য ক্লাউডে সংরক্ষিত হয়েছে!', `${record.employeeName || ''} - ${record.statusBn}`);
      return { success: true };
    }

    // Local Offline Mode
    const exists = demoAttendance.some((a) => a.employeeId === record.employeeId && a.date === record.date);
    if (exists) {
      setDemoAttendance(
        demoAttendance.map((a) =>
          a.employeeId === record.employeeId && a.date === record.date ? record : a
        )
      );
    } else {
      setDemoAttendance([record, ...demoAttendance]);
    }
    showToast('উপস্থিতি রেকর্ড সংরক্ষিত হয়েছে!', `${record.employeeName || ''} - ${record.statusBn}`);
    return { success: true };
  };

  const handleRecordSalaryPayment = async (params: {
    employee: Employee;
    amount: number;
    paymentMethod: 'cash' | 'bkash' | 'bank';
    salaryPeriod: string;
    paymentDate: string;
    notes?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const { employee, amount, paymentMethod, salaryPeriod, paymentDate, notes } = params;
    if (isLiveCloud && user) {
      const res = await farmRepository.recordSalaryPayment(user.id, {
        employee,
        amount,
        paymentMethod,
        salaryPeriod,
        paymentDate,
        notes,
      });
      if (!res.success) {
        return { success: false, error: res.error || 'বেতন পরিশোধ সংরক্ষণ ব্যর্থ হয়েছে।' };
      }
      setCloudFinancialRecords([res.data!, ...cloudFinancialRecords]);
      showToast(
        'বেতন পরিশোধের আর্থিক হিসাব ক্লাউডে সংরক্ষিত হয়েছে!',
        `${employee.name} (${salaryPeriod}) ৳ ${amount.toLocaleString('en-US')}`
      );
      return { success: true };
    }

    // Local Offline Mode
    const newRecord: FinancialRecord = {
      id: generateId('fin'),
      date: paymentDate,
      type: 'expense',
      category: 'salary',
      categoryLabelBn: 'কর্মচারীর বেতন',
      title: `${employee.name} এর বেতন (${salaryPeriod})`,
      amount,
      paymentMethod,
      recordedBy: 'খামার মালিক',
      notes: notes || `${salaryPeriod} মাসের বেতন পরিশোধ`,
      relatedEmployeeId: employee.id,
      salaryPeriod,
    };

    setDemoFinancialRecords([newRecord, ...demoFinancialRecords]);
    showToast(
      'বেতন পরিশোধ সফলভাবে রেকর্ড হয়েছে!',
      `${employee.name} (৳ ${amount.toLocaleString('en-US')})`
    );
    return { success: true };
  };

  const handleResetDemoData = () => {
    if (isLiveCloud) {
      showToast('আপনি বর্তমানে ক্লাউড মোডে আছেন। নমুনা তথ্য রিসেট ক্লাউড ডেটাবেজকে প্রভাবিত করে না।', undefined, 'info');
      return;
    }
    localFarmStorage.clearToEmptyFarm();
    setDemoCows([]);
    setDemoMilkRecords([]);
    setDemoFinancialRecords([]);
    setDemoEmployees([]);
    setDemoBiogasLogs([]);
    setDemoReminders([]);
    setDemoHealthRecords([]);
    setDemoAttendance([]);
    setDemoInspections([]);
    showToast('খামারের সমস্ত ডেটা মুছে নতুন খামার প্রস্তুত করা হয়েছে!');
  };

  const handleLoadSampleData = () => {
    if (isLiveCloud) {
      showToast('আপনি বর্তমানে ক্লাউড মোডে আছেন।', undefined, 'info');
      return;
    }
    localFarmStorage.loadDemoData();
    setDemoCows(INITIAL_COWS);
    setDemoMilkRecords(INITIAL_MILK_RECORDS);
    setDemoFinancialRecords(INITIAL_FINANCIAL_RECORDS);
    setDemoEmployees(INITIAL_EMPLOYEES);
    setDemoBiogasLogs(INITIAL_BIOGAS_LOGS);
    setDemoReminders(INITIAL_REMINDERS);
    setDemoHealthRecords(INITIAL_HEALTH_RECORDS);
    setDemoAttendance(INITIAL_ATTENDANCE_RECORDS);
    setDemoInspections(INITIAL_BIOGAS_INSPECTIONS);
    showToast('পরীক্ষামূলক নমুনা তথ্য সফলভাবে লোড হয়েছে!');
  };

  const handleImportBackup = (jsonString: string): boolean => {
    const success = localFarmStorage.importBackup(jsonString);
    if (success) {
      setDemoCows(localFarmStorage.getCows());
      setDemoMilkRecords(localFarmStorage.getMilkRecords());
      setDemoFinancialRecords(localFarmStorage.getFinancialRecords());
      setDemoEmployees(localFarmStorage.getEmployees());
      setDemoBiogasLogs(localFarmStorage.getBiogasLogs());
      setDemoReminders(localFarmStorage.getReminders());
      setDemoHealthRecords(localFarmStorage.getHealthRecords());
      setDemoAttendance(localFarmStorage.getAttendance());
      setDemoInspections(localFarmStorage.getInspections());
      showToast('ব্যাকআপ সফলভাবে রিস্টোর করা হয়েছে!');
      return true;
    } else {
      showToast('ব্যাকআপ ফাইলটি সঠিক নয়!', undefined, 'error');
      return false;
    }
  };

  const handleUpdateFarmProfile = async (updated: FarmProfile) => {
    setFarmProfile(updated);
    localFarmStorage.saveFarmProfile(updated);
    if (isLiveCloud && user) {
      try {
        await farmRepository.updateFarmProfile(user.id, updated);
      } catch (e) {
        console.error('Failed to sync farm profile with cloud:', e);
      }
    }
    showToast('খামার সেটিংস ও মালিকানা তথ্য সফলভাবে সংরক্ষিত হয়েছে!');
  };

  return (
    <div className="min-h-screen bg-[#FBF9F4] text-[#1A281F] flex flex-col antialiased">
      {/* Toast Feedback */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Supabase Connection Status / Demo Mode Banner (Hidden during print) */}
      <div className="no-print">
        <ConfigStatusBanner
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenSetup={() => setIsSetupModalOpen(true)}
        />

        {/* Cloud Loading Banner */}
        {isLoadingCloud && (
          <div className="bg-[#EAF5EE] border-b border-[#C5E3D0] px-4 py-1.5 text-xs text-[#1B4D35] flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2A7A50]" />
            <span>ক্লাউড ডেটাবেজ থেকে খামারের রেকর্ড লোড হচ্ছে...</span>
          </div>
        )}

        {/* Cloud Error Alert */}
        {cloudError && isLiveCloud && (
          <div className="bg-[#FEF2F2] border-b border-[#FECACA] px-4 py-2 text-xs text-[#991B1B] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>{cloudError}</span>
            </div>
            <button
              onClick={() => user?.id && void fetchCloudData(user.id)}
              className="px-2.5 py-1 rounded-md bg-white border border-[#FECACA] text-xs font-bold flex items-center gap-1 hover:bg-gray-50 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              পুনরায় চেষ্টা করুন
            </button>
          </div>
        )}
      </div>

      {/* Main Container Layout */}
      <div className="flex flex-1 min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            currentTab={currentTab}
            onNavigate={(tab) => {
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            pendingTasksCount={pendingTasksCount}
            onOpenInstall={triggerInstall}
            ownerName={farmProfile.ownerName}
            activeEmployeesCount={activeEmployeesCount}
            farmName={farmProfile.farmName}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <Header
            currentTab={currentTab}
            onNavigate={(tab) => {
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAddMilk={() => {
              setSelectedCowForRecord(null);
              setIsAddMilkOpen(true);
            }}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
            onOpenAddCow={() => {
              setEditingCow(null);
              setIsAddCowOpen(true);
            }}
            onOpenAddTask={() => setIsAddTaskOpen(true)}
            pendingTasksCount={pendingTasksCount}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onOpenInstall={triggerInstall}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenSetup={() => setIsSetupModalOpen(true)}
            ownerName={farmProfile.ownerName}
            farmName={farmProfile.farmName}
          />

          {/* Page Content Body */}
          <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
            {currentTab === 'dashboard' && (
              <DashboardView
                summary={farmSummary}
                milkRecords={milkRecords}
                financialRecords={financialRecords}
                reminders={reminders}
                biogasLogs={biogasLogs}
                employees={employees}
                attendanceRecords={attendanceRecords}
                isLiveCloud={isLiveCloud}
                onNavigate={(tab: NavigationTab) => {
                  setCurrentTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenAddMilk={() => {
                  setSelectedCowForRecord(null);
                  setIsAddMilkOpen(true);
                }}
                onOpenAddExpense={() => setIsAddExpenseOpen(true)}
                onOpenAddCow={() => {
                  setEditingCow(null);
                  setIsAddCowOpen(true);
                }}
                onOpenAddTask={() => {
                  setSelectedEmployeeForTask(undefined);
                  setIsAddTaskOpen(true);
                }}
                onToggleTask={handleToggleTask}
                ownerName={farmProfile.ownerName}
                farmName={farmProfile.farmName}
              />
            )}

            {currentTab === 'cows' && (
              <CowsView
                cows={cows}
                milkRecords={milkRecords}
                healthRecords={healthRecords}
                onOpenAddCow={() => {
                  setEditingCow(null);
                  setIsAddCowOpen(true);
                }}
                onOpenEditCow={(cow) => {
                  setEditingCow(cow);
                  setIsAddCowOpen(true);
                }}
                onOpenAddMilk={(cow) => {
                  setSelectedCowForRecord(cow || null);
                  setIsAddMilkOpen(true);
                }}
                onOpenAddHealth={(cow) => {
                  setSelectedCowForRecord(cow || null);
                  setIsAddHealthOpen(true);
                }}
                onDeleteOrArchiveCow={handleDeleteOrArchiveCow}
              />
            )}

            {currentTab === 'milk' && (
              <MilkRecordsView
                records={milkRecords}
                onOpenAddMilk={() => {
                  setSelectedCowForRecord(null);
                  setIsAddMilkOpen(true);
                }}
              />
            )}

            {currentTab === 'finance' && (
              <FinanceView
                records={financialRecords}
                onOpenAddExpense={() => {
                  setEditingTransaction(null);
                  setIsAddExpenseOpen(true);
                }}
                onEditTransaction={(item) => {
                  setEditingTransaction(item);
                  setIsAddExpenseOpen(true);
                }}
                onDeleteTransaction={handleDeleteTransaction}
              />
            )}

            {currentTab === 'employees' && (
              <EmployeesView
                employees={employees}
                attendanceRecords={attendanceRecords}
                financialRecords={financialRecords}
                tasks={reminders}
                onOpenAddEmployee={() => {
                  setEditingEmployee(null);
                  setIsAddEmployeeOpen(true);
                }}
                onOpenEditEmployee={(emp) => {
                  setEditingEmployee(emp);
                  setIsAddEmployeeOpen(true);
                }}
                onOpenRecordAttendance={(empId) => {
                  setSelectedEmployeeForAttendance(empId);
                  setIsRecordAttendanceOpen(true);
                }}
                onOpenRecordSalaryPayment={(empId) => {
                  setSelectedEmployeeForSalary(empId);
                  setIsRecordSalaryPaymentOpen(true);
                }}
                onOpenAddTask={(empId) => {
                  setSelectedEmployeeForTask(empId);
                  setIsAddTaskOpen(true);
                }}
                onDeleteOrArchiveEmployee={handleDeleteOrArchiveEmployee}
                onToggleTask={handleToggleTask}
              />
            )}

            {currentTab === 'biogas' && (
              <BiogasView
                logs={biogasLogs}
                inspections={biogasInspections}
                employees={employees}
                onAddLog={handleAddBiogasLog}
                onUpdateLog={handleUpdateBiogasLog}
                onDeleteLog={handleDeleteBiogasLog}
                onAddInspection={handleAddBiogasInspection}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsView
                summary={farmSummary}
                milkRecords={milkRecords}
                financialRecords={financialRecords}
                cows={cows}
                healthRecords={healthRecords}
                employees={employees}
                attendanceRecords={attendanceRecords}
                biogasLogs={biogasLogs}
                biogasInspections={biogasInspections}
                reminders={consolidatedReminders}
                ownerName={farmProfile.ownerName}
                farmName={farmProfile.farmName}
                farmAddress={farmProfile.address}
              />
            )}

            {currentTab === 'reminders' && (
              <RemindersView
                reminders={reminders}
                employees={employees}
                cows={cows}
                healthRecords={healthRecords}
                biogasInspections={biogasInspections}
                onOpenAddTask={() => {
                  setSelectedEmployeeForTask(undefined);
                  setIsAddTaskOpen(true);
                }}
                onToggleTask={handleToggleTask}
              />
            )}

            {currentTab === 'advisor' && (
              <AdvisorView
                financialRecords={financialRecords}
                milkRecords={milkRecords}
                cows={cows}
                healthRecords={healthRecords}
                employees={employees}
                attendanceRecords={attendanceRecords}
                biogasLogs={biogasLogs}
                biogasInspections={biogasInspections}
                reminders={consolidatedReminders}
                onNavigate={(tab) => {
                  setCurrentTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                farmProfile={farmProfile}
                onUpdateFarmProfile={handleUpdateFarmProfile}
                onResetDemoData={handleResetDemoData}
                onLoadSampleData={handleLoadSampleData}
                onShowToast={(msg) => showToast(msg)}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onOpenSetup={() => setIsSetupModalOpen(true)}
                onImportBackup={handleImportBackup}
                onOpenInstall={triggerInstall}
              />
            )}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onNavigate={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        pendingTasksCount={pendingTasksCount}
        onOpenAddMilk={() => {
          setSelectedCowForRecord(null);
          setIsAddMilkOpen(true);
        }}
        onOpenAddExpense={() => setIsAddExpenseOpen(true)}
      />

      {/* Modals */}
      <AddMilkModal
        isOpen={isAddMilkOpen}
        onClose={() => {
          setIsAddMilkOpen(false);
          setSelectedCowForRecord(null);
        }}
        onAddRecord={handleAddMilkRecord}
        cows={cows}
        initialCowId={selectedCowForRecord?.id}
        employees={employees}
        ownerName={farmProfile.ownerName}
        defaultMilkRate={farmProfile.defaultMilkRate}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditingTransaction(null);
        }}
        onAddTransaction={handleAddTransaction}
        onUpdateTransaction={handleUpdateTransaction}
        initialRecord={editingTransaction}
        employees={employees}
        ownerName={farmProfile.ownerName}
      />

      <AddCowModal
        isOpen={isAddCowOpen}
        onClose={() => {
          setIsAddCowOpen(false);
          setEditingCow(null);
        }}
        onSaveCow={handleSaveCow}
        existingCows={cows}
        initialCow={editingCow}
      />

      <AddHealthRecordModal
        isOpen={isAddHealthOpen}
        onClose={() => {
          setIsAddHealthOpen(false);
          setSelectedCowForRecord(null);
        }}
        cows={cows}
        initialCowId={selectedCowForRecord?.id}
        onAddHealthRecord={handleAddHealthRecord}
      />

      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => {
          setIsAddTaskOpen(false);
          setSelectedEmployeeForTask(undefined);
        }}
        onAddTask={handleAddTask}
        employees={employees}
        initialEmployeeId={selectedEmployeeForTask}
        ownerName={farmProfile.ownerName}
      />

      <AddEmployeeModal
        isOpen={isAddEmployeeOpen}
        onClose={() => {
          setIsAddEmployeeOpen(false);
          setEditingEmployee(null);
        }}
        onSave={handleSaveEmployee}
        initialEmployee={editingEmployee}
        existingEmployees={employees}
      />

      <RecordAttendanceModal
        isOpen={isRecordAttendanceOpen}
        onClose={() => {
          setIsRecordAttendanceOpen(false);
          setSelectedEmployeeForAttendance(undefined);
        }}
        employees={employees}
        existingRecords={attendanceRecords}
        onSaveAttendance={handleRecordAttendance}
        initialEmployeeId={selectedEmployeeForAttendance}
      />

      <RecordSalaryPaymentModal
        isOpen={isRecordSalaryPaymentOpen}
        onClose={() => {
          setIsRecordSalaryPaymentOpen(false);
          setSelectedEmployeeForSalary(undefined);
        }}
        employees={employees}
        financialRecords={financialRecords}
        onSavePayment={handleRecordSalaryPayment}
        initialEmployeeId={selectedEmployeeForSalary}
      />

      <FarmPinModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onOpenSetupGuide={() => {
          setIsAuthModalOpen(false);
          setIsSetupModalOpen(true);
        }}
      />

      <SupabaseSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
      />

      <InstallAppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        deferredPrompt={deferredPrompt}
        isInstalled={isInstalled}
        ownerName={farmProfile.ownerName}
        farmName={farmProfile.farmName}
      />

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-[#FAF7F0] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-[#EAE2D0]">
              <span className="font-bold text-sm text-[#16402C]">মেনু ও বিভাগসমূহ</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-xl bg-white border border-[#E2DAC7] text-gray-600 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar
                currentTab={currentTab}
                onNavigate={(tab) => {
                  setCurrentTab(tab);
                  setIsMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                pendingTasksCount={pendingTasksCount}
                onOpenInstall={() => {
                  setIsMobileMenuOpen(false);
                  triggerInstall();
                }}
                ownerName={farmProfile.ownerName}
                activeEmployeesCount={activeEmployeesCount}
                farmName={farmProfile.farmName}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <FarmDashboard />
    </AuthProvider>
  );
}

export default App;
