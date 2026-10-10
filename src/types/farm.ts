export type NavigationTab = 
  | 'dashboard'
  | 'cows'
  | 'milk'
  | 'finance'
  | 'employees'
  | 'biogas'
  | 'reports'
  | 'reminders'
  | 'advisor'
  | 'settings';

export type CowStatus = 
  | 'milking'   // দুধ দিচ্ছে
  | 'pregnant'  // গর্ভবতী
  | 'dry'       // দুধ দিচ্ছে না (ড্রাই)
  | 'calf'      // বাছুর
  | 'sick'      // অসুস্থ
  | 'sold'      // বিক্রি হয়েছে
  | 'other';    // অন্যান্য

export interface Cow {
  id: string;
  tagNumber: string; // e.g. "গাভী-০১" or "COW-01"
  name: string;      // e.g. "লালমনি", "শাপলা"
  breed: string;     // e.g. "হলস্টাইন ফ্রিজিয়ান ক্রস"
  gender?: 'female' | 'male';
  ageYears: number;
  isAgeEstimated?: boolean;
  dateOfBirth?: string;
  status: CowStatus;
  statusLabelBn: string;
  dailyAvgMilkLiters: number;
  lastMilkingLiters: number;
  lastVaccinatedDate?: string;
  expectedCalvingDate?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  isArchived?: boolean;
  archivedAt?: string;
  photoUrl?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type MilkEntryType = 'aggregate' | 'individual';

export interface MilkRecord {
  id: string;
  date: string;
  morningLiters: number;
  eveningLiters: number;
  totalLiters: number;
  entryType?: MilkEntryType; // aggregate: সম্পূর্ণ খামার | individual: নির্দিষ্ট গরু
  isSold?: boolean;
  soldLiters?: number;
  pricePerLiter: number;
  totalAmount: number;
  cowId?: string;
  cowName?: string;
  recordedBy: string;
  note?: string;
}

export type TransactionType = 'income' | 'expense';

export type ExpenseCategory = 
  | 'feed'                // পশুখাদ্য (ভুসি, খৈল, ঘাস, খড়)
  | 'medicine'            // পশুচিকিৎসা ও ঔষধ/টিকা
  | 'salary'              // কর্মচারীর বেতন
  | 'utility'             // বিদ্যুৎ ও পানি বিল
  | 'maintenance'         // খামার মেরামত ও রক্ষণাবেক্ষণ
  | 'biogas_maintenance'  // বায়োগ্যাস প্ল্যান্ট মেরামত
  | 'biogas_parts'        // বায়োগ্যাস যন্ত্রাংশ (পুরোনো কম্প্যাটিবিলিটি)
  | 'transport'           // পরিবহন ও যাতায়াত খরচ
  | 'other';              // অন্যান্য খামার পরিচালন খরচ

export type IncomeCategory = 
  | 'milk_sale'      // দুধ বিক্রি
  | 'slurry_sale'    // বায়োগ্যাস জৈব সার / স্লারি বিক্রি
  | 'cattle_sale'    // গরু / বাছুর বিক্রি
  | 'calf_sale'      // বাছুর বিক্রি (কম্প্যাটিবিলিটি)
  | 'other_income';  // অন্যান্য আয়

export interface FinancialRecord {
  id: string;
  date: string;
  type: TransactionType;
  category: ExpenseCategory | IncomeCategory;
  categoryLabelBn: string;
  title: string;
  amount: number;
  paymentMethod: 'cash' | 'bkash' | 'bank';
  recordedBy: string;
  notes?: string;
  relatedMilkRecordId?: string | null;
  relatedHealthRecordId?: string | null;
  relatedEmployeeId?: string | null;
  salaryPeriod?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type HealthEventType = 
  | 'vaccination'        // টিকাদান (FMD, অ্যানথ্রাক্স ইত্যাদি)
  | 'deworming'          // কৃমিনাশক প্রয়োগ
  | 'vet_consultation'   // ডাক্তার পরামর্শ
  | 'treatment'          // অসুস্থতা ও চিকিৎসা
  | 'other';             // অন্যান্য স্বাস্থ্যসেবা

export interface HealthRecord {
  id: string;
  cowId: string;
  cowTag: string;
  cowName?: string;
  eventType: HealthEventType;
  eventTypeLabelBn: string;
  eventDate: string;
  nextDueDate?: string;
  treatmentName: string;
  doctorName?: string;
  cost?: number;
  notes?: string;
  relatedExpenseId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type EmployeeStatus = 'active' | 'on_leave' | 'inactive';

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  salaryMonthly: number;
  joiningDate: string;
  assignedDuties: string[];
  status: EmployeeStatus;
  avatarInitials: string;
  notes?: string;
  isArchived?: boolean;
  archivedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'leave';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  statusBn: string;
  arrivalTime?: string;
  departureTime?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MonthlyAttendanceSummary {
  employeeId: string;
  month: string; // e.g. "2026-10"
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  totalRecordedDays: number;
  attendanceRatePercent: number;
}

export interface PayrollStatus {
  employeeId: string;
  employeeName: string;
  monthlySalary: number;
  salaryPeriod: string; // e.g. "2026-10"
  paidAmount: number;
  dueAmount: number;
  status: 'paid' | 'partial' | 'unpaid';
  statusBn: string;
  payments: FinancialRecord[];
}

export interface BiogasDailyLog {
  id: string;
  date: string;
  dungInputKg: number;        // দৈনিক গোবর ইনপুট (কেজি)
  waterInputLiters: number;   // পানির পরিমাণ (লিটার)
  gasPressurePsi?: number;    // চাপ বা সূচক
  burnHoursToday: number;     // রান্নার চুলা জ্বলার সময় (ঘণ্টা)
  slurryProducedBags: number; // প্রাপ্ত জৈব সার (বস্তা/ড্রাম)
  status: 'optimal' | 'low' | 'attention';
  statusBn: string;
  recordedByEmployeeId?: string;
  recordedBy?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BiogasInspectionItem {
  id: string;
  date: string;
  itemKey: 'inlet' | 'pipes' | 'safety_valve' | 'slurry_outlet' | 'cleanliness';
  itemNameBn: string;
  status: 'good' | 'needs_attention' | 'urgent';
  statusBn: string;
  inspectorEmployeeId?: string;
  inspectorName?: string;
  notes?: string;
  nextInspectionDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReminderTask {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  priorityBn: string;
  category: 'vaccine' | 'feed' | 'vet' | 'worker' | 'biogas' | 'medicine' | 'other';
  completed: boolean;
  completedAt?: string;
  assignedEmployeeId?: string;
  assignedTo?: string;
  relatedHealthRecordId?: string;
  cowId?: string;
}

export interface FarmSummary {
  totalCows: number;
  milkingCows: number;
  pregnantCows: number;
  calvesCount: number;
  todayMilkLiters: number;
  yesterdayMilkLiters: number;
  todayIncomeTk: number;
  monthExpensesTk: number;
  monthIncomeTk: number;
  estimatedMonthProfitTk: number;
  pendingTasksCount: number;
  vaccinesDueSoonCount?: number;
  overdueTasksCount?: number;
}

export interface FarmProfile {
  id?: string;
  userId?: string;
  farmName: string;
  ownerName: string;
  phone: string;
  address?: string;
  defaultMilkRate: number;
  dairyCapacity: number;
  notificationsEnabled: boolean;
}
