import type { 
  HealthEventType, 
  HealthRecord, 
  ReminderTask, 
  BiogasInspectionItem, 
  Cow, 
  Employee 
} from '../types/farm';
import { toIsoDateString } from './accounting';

export const HEALTH_EVENT_LABELS: Record<HealthEventType, string> = {
  vaccination: 'টিকা প্রদান (Vaccine)',
  deworming: 'কৃমিনাশক প্রয়োগ (Deworming)',
  vet_consultation: 'পশুচিকিৎসক পরামর্শ (Vet Consultation)',
  treatment: 'অসুস্থতা ও চিকিৎসা (Treatment)',
  other: 'অন্যান্য স্বাস্থ্যসেবা',
};

export interface ConsolidateRemindersOptions {
  tasks: ReminderTask[];
  healthRecords?: HealthRecord[];
  biogasInspections?: BiogasInspectionItem[];
  cows?: Cow[];
  employees?: Employee[];
}

/**
 * Consolidates farm reminders from:
 * 1. Explicitly recorded manual & employee farm tasks
 * 2. Cow vaccination and booster follow-ups (from health records)
 * 3. Veterinary consultation revisit dates (from health records)
 * 4. Biogas plant safety and maintenance inspections
 *
 * Strict duplicate prevention:
 * - Never creates a duplicate if a task already links to the health record (via relatedHealthRecordId)
 * - Never duplicates an inspection reminder if a task exists for that date and item
 */
export const consolidateFarmReminders = ({
  tasks,
  healthRecords = [],
  biogasInspections = [],
  cows = [],
  employees = [],
}: ConsolidateRemindersOptions): ReminderTask[] => {
  const result: ReminderTask[] = [...tasks];

  // Set of linked health record IDs already covered by explicit tasks
  const linkedHealthRecordIds = new Set<string>();
  const linkedCowAndDates = new Set<string>();

  for (const t of tasks) {
    if (t.relatedHealthRecordId) {
      linkedHealthRecordIds.add(t.relatedHealthRecordId);
    }
    if (t.cowId && t.dueDate) {
      linkedCowAndDates.add(`${t.cowId}_${toIsoDateString(t.dueDate)}`);
    }
  }

  // 1. Synthesize reminders for health records with nextDueDate
  for (const hr of healthRecords) {
    if (!hr.nextDueDate || hr.nextDueDate.trim() === '') continue;
    if (linkedHealthRecordIds.has(hr.id)) continue;

    const cowDateKey = `${hr.cowId}_${toIsoDateString(hr.nextDueDate)}`;
    if (linkedCowAndDates.has(cowDateKey)) continue;

    // Check if auto-generated reminder already exists in tasks
    const existingAutoId = `auto-hr-${hr.id}`;
    if (tasks.some((t) => t.id === existingAutoId)) continue;

    const cow = cows.find((c) => c.id === hr.cowId);
    const cowTag = hr.cowTag || cow?.tagNumber || 'গাভী';
    const cowName = hr.cowName || cow?.name || '';
    const displayName = cowName ? `${cowTag} (${cowName})` : cowTag;

    let category: ReminderTask['category'] = 'medicine';
    let priority: ReminderTask['priority'] = 'medium';
    let priorityBn = 'মাঝারি';
    let typeLabel = 'স্বাস্থ্য ফলো-আপ';

    if (hr.eventType === 'vaccination') {
      category = 'vaccine';
      priority = 'high';
      priorityBn = 'জরুরি';
      typeLabel = 'বুস্টার টিকা';
    } else if (hr.eventType === 'vet_consultation') {
      category = 'vet';
      priority = 'medium';
      priorityBn = 'মাঝারি';
      typeLabel = 'ডাক্তার ভিজিট ফলো-আপ';
    } else if (hr.eventType === 'deworming') {
      category = 'medicine';
      priority = 'medium';
      priorityBn = 'মাঝারি';
      typeLabel = 'কৃমিনাশক ডোজ';
    }

    const title = `${displayName} - ${typeLabel}: ${hr.treatmentName}`;
    const description = `${hr.treatmentName} এর পরবর্তী ডোজ বা পর্যবেক্ষণ।${
      hr.doctorName ? ` (পরামর্শক: ${hr.doctorName})` : ''
    }`;

    // Default assigned worker if available
    const defaultEmployee = employees.find((e) => !e.isArchived);

    result.push({
      id: existingAutoId,
      title,
      description,
      dueDate: hr.nextDueDate,
      priority,
      priorityBn,
      category,
      completed: false,
      cowId: hr.cowId,
      relatedHealthRecordId: hr.id,
      assignedEmployeeId: defaultEmployee?.id,
      assignedTo: defaultEmployee?.name || 'খামার কর্মী',
    });

    linkedHealthRecordIds.add(hr.id);
    linkedCowAndDates.add(cowDateKey);
  }

  // 2. Synthesize reminders for biogas maintenance inspections with nextInspectionDate
  for (const insp of biogasInspections) {
    if (!insp.nextInspectionDate || insp.nextInspectionDate.trim() === '') continue;

    const existingAutoInspId = `auto-insp-${insp.id}`;
    if (tasks.some((t) => t.id === existingAutoInspId)) continue;

    const inspIso = toIsoDateString(insp.nextInspectionDate);
    // Check if an existing task covers this biogas item on that date
    const alreadyCovered = tasks.some(
      (t) =>
        t.category === 'biogas' &&
        toIsoDateString(t.dueDate) === inspIso &&
        t.title.includes(insp.itemNameBn)
    );
    if (alreadyCovered) continue;

    const isUrgent = insp.status === 'urgent';
    const isAttention = insp.status === 'needs_attention';

    const inspEmployee = employees.find((e) => e.id === insp.inspectorEmployeeId);

    result.push({
      id: existingAutoInspId,
      title: `বায়োগ্যাস প্ল্যান্ট তদারকি: ${insp.itemNameBn}`,
      description: `${insp.itemNameBn} এর পরবর্তী নিরাপত্তা চেকআপ ও পর্যবেক্ষণ।${
        insp.notes ? ` (পূর্ববর্তী নোট: ${insp.notes})` : ''
      }`,
      dueDate: insp.nextInspectionDate,
      priority: isUrgent ? 'high' : isAttention ? 'medium' : 'low',
      priorityBn: isUrgent ? 'জরুরি' : isAttention ? 'মাঝারি' : 'সাধারণ',
      category: 'biogas',
      completed: false,
      assignedEmployeeId: insp.inspectorEmployeeId,
      assignedTo: insp.inspectorName || inspEmployee?.name || 'বায়োগ্যাস ইনচার্জ',
    });
  }

  return result;
};

export interface CategorizedReminders {
  overdue: ReminderTask[];
  dueToday: ReminderTask[];
  dueSoon: ReminderTask[];
  upcoming: ReminderTask[];
  completed: ReminderTask[];
}

/**
 * Categorizes reminder tasks based on urgency relative to a reference date.
 */
export const categorizeRemindersByUrgency = (
  tasks: ReminderTask[],
  referenceDate?: Date
): CategorizedReminders => {
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  const todayIso = toIsoDateString(ref);

  // 7 days in the future ISO
  const soonLimit = new Date(ref);
  soonLimit.setDate(soonLimit.getDate() + 7);
  const soonLimitIso = toIsoDateString(soonLimit);

  const overdue: ReminderTask[] = [];
  const dueToday: ReminderTask[] = [];
  const dueSoon: ReminderTask[] = [];
  const upcoming: ReminderTask[] = [];
  const completed: ReminderTask[] = [];

  for (const t of tasks) {
    if (t.completed) {
      completed.push(t);
      continue;
    }

    const dueIso = toIsoDateString(t.dueDate);

    if (dueIso < todayIso) {
      overdue.push(t);
    } else if (dueIso === todayIso) {
      dueToday.push(t);
    } else if (dueIso <= soonLimitIso) {
      dueSoon.push(t);
    } else {
      upcoming.push(t);
    }
  }

  // Sort each category by dueDate
  const sorter = (a: ReminderTask, b: ReminderTask) =>
    toIsoDateString(a.dueDate).localeCompare(toIsoDateString(b.dueDate));

  overdue.sort(sorter);
  dueToday.sort(sorter);
  dueSoon.sort(sorter);
  upcoming.sort(sorter);
  completed.sort((a, b) =>
    toIsoDateString(b.completedAt || b.dueDate).localeCompare(toIsoDateString(a.completedAt || a.dueDate))
  );

  return {
    overdue,
    dueToday,
    dueSoon,
    upcoming,
    completed,
  };
};

/**
 * Validates a health record before save.
 */
export const validateHealthRecord = (
  record: Partial<HealthRecord>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!record.cowId) {
    errors.cowId = 'গাভী বা গরু নির্বাচন করা আবশ্যক।';
  }

  if (!record.eventType) {
    errors.eventType = 'স্বাস্থ্য ইভেন্টের ধরন নির্বাচন করুন।';
  }

  if (!record.treatmentName || record.treatmentName.trim() === '') {
    errors.treatmentName = 'টিকা, ঔষধ বা চিকিৎসার নাম লিখুন।';
  }

  if (!record.eventDate || record.eventDate.trim() === '') {
    errors.eventDate = 'ইভেন্টের তারিখ প্রদান করুন।';
  }

  if (record.cost !== undefined && record.cost !== null) {
    const costNum = Number(record.cost);
    if (isNaN(costNum) || costNum < 0) {
      errors.cost = 'খরচের পরিমাণ শূন্য বা তার চেয়ে বেশি হতে হবে।';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
