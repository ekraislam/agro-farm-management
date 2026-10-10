import type {
  Cow,
  MilkRecord,
  FinancialRecord,
  Employee,
  BiogasDailyLog,
  BiogasInspectionItem,
  ReminderTask,
  HealthRecord,
  AttendanceRecord,
  FarmProfile,
} from '../types/farm';

import {
  INITIAL_COWS,
  INITIAL_MILK_RECORDS,
  INITIAL_FINANCIAL_RECORDS,
  INITIAL_EMPLOYEES,
  INITIAL_BIOGAS_LOGS,
  INITIAL_BIOGAS_INSPECTIONS,
  INITIAL_REMINDERS,
  INITIAL_HEALTH_RECORDS,
  INITIAL_ATTENDANCE_RECORDS,
  DEMO_EMPLOYEE_IDS,
} from '../data/demoData';

const STORAGE_KEYS = {
  COWS: 'momin_agro_cows_v2',
  MILK: 'momin_agro_milk_v2',
  FINANCE: 'momin_agro_finance_v2',
  EMPLOYEES: 'momin_agro_employees_v2',
  BIOGAS: 'momin_agro_biogas_v2',
  INSPECTIONS: 'momin_agro_inspections_v2',
  REMINDERS: 'momin_agro_reminders_v2',
  HEALTH: 'momin_agro_health_v2',
  ATTENDANCE: 'momin_agro_attendance_v2',
  PROFILE: 'momin_agro_profile_v2',
} as const;

function safeGet<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, data: T): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (err) {
    console.warn(`Local storage write failed for ${key}:`, err);
  }
}

export const localFarmStorage = {
  getCows(): Cow[] {
    return safeGet<Cow[]>(STORAGE_KEYS.COWS, []);
  },
  saveCows(cows: Cow[]): void {
    safeSet(STORAGE_KEYS.COWS, cows);
  },

  getMilkRecords(): MilkRecord[] {
    return safeGet<MilkRecord[]>(STORAGE_KEYS.MILK, []);
  },
  saveMilkRecords(records: MilkRecord[]): void {
    safeSet(STORAGE_KEYS.MILK, records);
  },

  getFinancialRecords(): FinancialRecord[] {
    return safeGet<FinancialRecord[]>(STORAGE_KEYS.FINANCE, []);
  },
  saveFinancialRecords(records: FinancialRecord[]): void {
    safeSet(STORAGE_KEYS.FINANCE, records);
  },

  getEmployees(): Employee[] {
    // Always strip old hardcoded demo employees (emp-1, emp-2) so they
    // never appear as real employees when the user hasn't added any.
    const stored = safeGet<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
    const filtered = stored.filter((e) => !DEMO_EMPLOYEE_IDS.has(e.id));
    // If we filtered any out, persist the cleaned list immediately
    if (filtered.length !== stored.length) {
      safeSet(STORAGE_KEYS.EMPLOYEES, filtered);
    }
    return filtered;
  },
  saveEmployees(employees: Employee[]): void {
    // Never persist demo employee IDs
    const clean = employees.filter((e) => !DEMO_EMPLOYEE_IDS.has(e.id));
    safeSet(STORAGE_KEYS.EMPLOYEES, clean);
  },

  getBiogasLogs(): BiogasDailyLog[] {
    return safeGet<BiogasDailyLog[]>(STORAGE_KEYS.BIOGAS, []);
  },
  saveBiogasLogs(logs: BiogasDailyLog[]): void {
    safeSet(STORAGE_KEYS.BIOGAS, logs);
  },

  getInspections(): BiogasInspectionItem[] {
    return safeGet<BiogasInspectionItem[]>(STORAGE_KEYS.INSPECTIONS, []);
  },
  saveInspections(items: BiogasInspectionItem[]): void {
    safeSet(STORAGE_KEYS.INSPECTIONS, items);
  },

  getReminders(): ReminderTask[] {
    return safeGet<ReminderTask[]>(STORAGE_KEYS.REMINDERS, []);
  },
  saveReminders(tasks: ReminderTask[]): void {
    safeSet(STORAGE_KEYS.REMINDERS, tasks);
  },

  getHealthRecords(): HealthRecord[] {
    return safeGet<HealthRecord[]>(STORAGE_KEYS.HEALTH, []);
  },
  saveHealthRecords(records: HealthRecord[]): void {
    safeSet(STORAGE_KEYS.HEALTH, records);
  },

  getAttendance(): AttendanceRecord[] {
    return safeGet<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
  },
  saveAttendance(records: AttendanceRecord[]): void {
    safeSet(STORAGE_KEYS.ATTENDANCE, records);
  },

  getFarmProfile(): FarmProfile {
    const defaultProfile: FarmProfile = {
      farmName: 'মুমিন এগ্রো',
      ownerName: 'মুমিনুল ইসলাম',
      phone: '০১৭XXXXXXXX',
      address: 'খামার প্রাঙ্গণ',
      defaultMilkRate: 80,
      dairyCapacity: 10,
      notificationsEnabled: true,
      securityPin: '1234',
    };
    const saved = safeGet<FarmProfile>(STORAGE_KEYS.PROFILE, defaultProfile);
    // If farmName has been customized away from 'মুমিন এগ্রো', but ownerName was still the default 'মুমিনুল ইসলাম',
    // align ownerName to the custom farm name so the hardcoded demo name never lingers!
    if (saved.farmName && saved.farmName.trim() !== 'মুমিন এগ্রো' && (!saved.ownerName || saved.ownerName.trim() === 'মুমিনুল ইসলাম')) {
      saved.ownerName = saved.farmName;
    }
    return saved;
  },
  saveFarmProfile(profile: FarmProfile): void {
    if (profile.farmName && profile.farmName.trim() !== 'মুমিন এগ্রো' && (!profile.ownerName || profile.ownerName.trim() === 'মুমিনুল ইসলাম')) {
      profile.ownerName = profile.farmName;
    }
    safeSet(STORAGE_KEYS.PROFILE, profile);
  },

  clearToEmptyFarm(): void {
    this.saveCows([]);
    this.saveMilkRecords([]);
    this.saveFinancialRecords([]);
    this.saveEmployees([]);
    this.saveBiogasLogs([]);
    this.saveInspections([]);
    this.saveReminders([]);
    this.saveHealthRecords([]);
    this.saveAttendance([]);
  },

  loadDemoData(): void {
    this.saveCows(INITIAL_COWS);
    this.saveMilkRecords(INITIAL_MILK_RECORDS);
    this.saveFinancialRecords(INITIAL_FINANCIAL_RECORDS);
    this.saveEmployees(INITIAL_EMPLOYEES);
    this.saveBiogasLogs(INITIAL_BIOGAS_LOGS);
    this.saveInspections(INITIAL_BIOGAS_INSPECTIONS);
    this.saveReminders(INITIAL_REMINDERS);
    this.saveHealthRecords(INITIAL_HEALTH_RECORDS);
    this.saveAttendance(INITIAL_ATTENDANCE_RECORDS);
  },

  exportBackup(): string {
    const profile = this.getFarmProfile();
    const data = {
      exportDate: new Date().toISOString(),
      farmName: profile.farmName || 'খামার',
      cows: this.getCows(),
      milkRecords: this.getMilkRecords(),
      financialRecords: this.getFinancialRecords(),
      employees: this.getEmployees(),
      biogasLogs: this.getBiogasLogs(),
      inspections: this.getInspections(),
      reminders: this.getReminders(),
      healthRecords: this.getHealthRecords(),
      attendance: this.getAttendance(),
      profile: this.getFarmProfile(),
    };
    return JSON.stringify(data, null, 2);
  },

  importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.cows && Array.isArray(data.cows)) this.saveCows(data.cows);
      if (data.milkRecords && Array.isArray(data.milkRecords)) this.saveMilkRecords(data.milkRecords);
      if (data.financialRecords && Array.isArray(data.financialRecords)) this.saveFinancialRecords(data.financialRecords);
      if (data.employees && Array.isArray(data.employees)) this.saveEmployees(data.employees);
      if (data.biogasLogs && Array.isArray(data.biogasLogs)) this.saveBiogasLogs(data.biogasLogs);
      if (data.inspections && Array.isArray(data.inspections)) this.saveInspections(data.inspections);
      if (data.reminders && Array.isArray(data.reminders)) this.saveReminders(data.reminders);
      if (data.healthRecords && Array.isArray(data.healthRecords)) this.saveHealthRecords(data.healthRecords);
      if (data.attendance && Array.isArray(data.attendance)) this.saveAttendance(data.attendance);
      if (data.profile) this.saveFarmProfile(data.profile);
      return true;
    } catch {
      return false;
    }
  },

  resetToDefaults(): void {
    this.clearToEmptyFarm();
  },
};
