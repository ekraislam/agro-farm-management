import type { Cow, MilkRecord } from '../types/farm';
import { roundMoney, toIsoDateString } from './accounting';

export interface DailyProductionResult {
  date: string;
  totalLiters: number;
  morningLiters: number;
  eveningLiters: number;
  recordCount: number;
  method: 'aggregate' | 'individual_sum' | 'none';
  hasAggregate: boolean;
  individualCount: number;
}

export interface CowMilkStats {
  cowId: string;
  totalLiters: number;
  recordCount: number;
  averageDailyLiters: number;
  lastRecordLiters: number;
  lastRecordDate?: string;
}

export interface FarmProductionAggregate {
  totalProductionLiters: number;
  totalSoldLiters: number;
  totalRevenueTk: number;
  distinctDaysCount: number;
  dailyAverages: number;
}

/**
 * Calculates farm-wide daily milk production without double-counting.
 * 
 * Rule:
 * 1. If any 'aggregate' (farm-wide bulk) record exists on targetDate, use sum of aggregate records.
 *    (This represents the whole-farm bulk tank collection and avoids adding cow-level entries on top).
 * 2. If NO aggregate record exists on targetDate, sum the individual cow records on that date.
 * 3. Never sum both individual cow records AND aggregate records on the same date.
 */
export const calculateDailyFarmMilkProduction = (
  records: MilkRecord[],
  targetDate: string
): DailyProductionResult => {
  const targetIso = toIsoDateString(targetDate);
  const dayRecords = records.filter((r) => toIsoDateString(r.date) === targetIso);

  if (dayRecords.length === 0) {
    return {
      date: targetIso,
      totalLiters: 0,
      morningLiters: 0,
      eveningLiters: 0,
      recordCount: 0,
      method: 'none',
      hasAggregate: false,
      individualCount: 0,
    };
  }

  const aggregateRecords = dayRecords.filter(
    (r) => r.entryType === 'aggregate' || (!r.cowId && r.entryType !== 'individual')
  );
  const individualRecords = dayRecords.filter(
    (r) => r.entryType === 'individual' || Boolean(r.cowId)
  );

  if (aggregateRecords.length > 0) {
    // Bulk/tank aggregate record exists — takes precedence for whole farm total
    const totalLiters = roundMoney(aggregateRecords.reduce((sum, r) => sum + r.totalLiters, 0));
    const morningLiters = roundMoney(aggregateRecords.reduce((sum, r) => sum + r.morningLiters, 0));
    const eveningLiters = roundMoney(aggregateRecords.reduce((sum, r) => sum + r.eveningLiters, 0));

    return {
      date: targetIso,
      totalLiters,
      morningLiters,
      eveningLiters,
      recordCount: aggregateRecords.length,
      method: 'aggregate',
      hasAggregate: true,
      individualCount: individualRecords.length,
    };
  }

  // No aggregate record; sum individual cow recordings
  const totalLiters = roundMoney(individualRecords.reduce((sum, r) => sum + r.totalLiters, 0));
  const morningLiters = roundMoney(individualRecords.reduce((sum, r) => sum + r.morningLiters, 0));
  const eveningLiters = roundMoney(individualRecords.reduce((sum, r) => sum + r.eveningLiters, 0));

  return {
    date: targetIso,
    totalLiters,
    morningLiters,
    eveningLiters,
    recordCount: individualRecords.length,
    method: 'individual_sum',
    hasAggregate: false,
    individualCount: individualRecords.length,
  };
};

/**
 * Calculates multi-day farm milk production totals without double-counting across dates.
 */
export const calculateFarmMilkTotals = (records: MilkRecord[]): FarmProductionAggregate => {
  // Collect all distinct dates
  const distinctDates = Array.from(new Set(records.map((r) => toIsoDateString(r.date))));

  let totalProductionLiters = 0;

  for (const d of distinctDates) {
    const daily = calculateDailyFarmMilkProduction(records, d);
    totalProductionLiters = roundMoney(totalProductionLiters + daily.totalLiters);
  }

  // Commercial sales are linked to specific sale records (isSold === true)
  // Sum sold liters and revenues strictly from records marked as sold
  const soldRecords = records.filter((r) => r.isSold && r.totalAmount > 0);
  const totalSoldLiters = roundMoney(soldRecords.reduce((sum, r) => sum + (r.soldLiters ?? r.totalLiters), 0));
  const totalRevenueTk = roundMoney(soldRecords.reduce((sum, r) => sum + r.totalAmount, 0));

  const distinctDaysCount = distinctDates.length;
  const dailyAverages = distinctDaysCount > 0 ? roundMoney(totalProductionLiters / distinctDaysCount) : 0;

  return {
    totalProductionLiters,
    totalSoldLiters,
    totalRevenueTk,
    distinctDaysCount,
    dailyAverages,
  };
};

/**
 * Filters milk records for an individual cow.
 */
export const getCowMilkHistory = (records: MilkRecord[], cowId: string): MilkRecord[] => {
  if (!cowId) return [];
  return records
    .filter((r) => r.cowId === cowId)
    .sort((a, b) => (toIsoDateString(b.date) > toIsoDateString(a.date) ? 1 : -1));
};

/**
 * Calculates production statistics for a specific cow.
 */
export const calculateCowMilkStats = (records: MilkRecord[], cowId: string): CowMilkStats => {
  const cowRecords = getCowMilkHistory(records, cowId);

  if (cowRecords.length === 0) {
    return {
      cowId,
      totalLiters: 0,
      recordCount: 0,
      averageDailyLiters: 0,
      lastRecordLiters: 0,
      lastRecordDate: undefined,
    };
  }

  const totalLiters = roundMoney(cowRecords.reduce((sum, r) => sum + r.totalLiters, 0));
  const recordCount = cowRecords.length;
  const averageDailyLiters = roundMoney(totalLiters / recordCount);
  const lastRecord = cowRecords[0];

  return {
    cowId,
    totalLiters,
    recordCount,
    averageDailyLiters,
    lastRecordLiters: lastRecord ? lastRecord.totalLiters : 0,
    lastRecordDate: lastRecord ? lastRecord.date : undefined,
  };
};

/**
 * Validates a cow record before save.
 */
export const validateCow = (
  cow: Partial<Cow>,
  existingCows: Cow[] = [],
  editingCowId?: string
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!cow.tagNumber || cow.tagNumber.trim() === '') {
    errors.tagNumber = 'ট্যাগ বা আইডি নম্বর প্রদান করা আবশ্যক।';
  } else {
    const cleanTag = cow.tagNumber.trim().toLowerCase();
    const isDuplicate = existingCows.some(
      (c) => c.id !== editingCowId && c.tagNumber.trim().toLowerCase() === cleanTag
    );
    if (isDuplicate) {
      errors.tagNumber = `ট্যাগ নম্বর "${cow.tagNumber.trim()}" ইতিমধ্যে আপনার খামারে নিবন্ধিত রয়েছে।`;
    }
  }

  if (!cow.name || cow.name.trim() === '') {
    errors.name = 'গাভী বা গরুর নাম লিখুন।';
  }

  if (!cow.breed || cow.breed.trim() === '') {
    errors.breed = 'গরুর জাত নির্বাচন করুন।';
  }

  const age = Number(cow.ageYears);
  if (isNaN(age) || age < 0) {
    errors.ageYears = 'সঠিক বয়স প্রদান করুন।';
  }

  if (cow.purchasePrice !== undefined && (isNaN(Number(cow.purchasePrice)) || Number(cow.purchasePrice) < 0)) {
    errors.purchasePrice = 'ক্রয় মূল্য শূন্য বা ধনাত্মক সংখ্যা হতে হবে।';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
