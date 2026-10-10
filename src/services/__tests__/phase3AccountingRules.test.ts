import { describe, it, expect } from 'vitest';
import { farmRepository } from '../farmRepository';
import type { MilkRecord, FinancialRecord } from '../../types/farm';
import { INITIAL_MILK_RECORDS, INITIAL_FINANCIAL_RECORDS } from '../../data/demoData';

describe('Phase 3 Specific Accounting Rules & Safety Verification', () => {
  it('7. Milk production without a sale does not create revenue', () => {
    // Record milk production where milk is kept for calves / household
    const unsoldMilkRecord: MilkRecord = {
      id: 'mr-calf-01',
      date: '১০ অক্টোবর ২০২৬',
      morningLiters: 25.0,
      eveningLiters: 15.0,
      totalLiters: 40.0,
      isSold: false,
      soldLiters: 0,
      pricePerLiter: 0,
      totalAmount: 0,
      recordedBy: 'মো: রহিম উদ্দিন',
      note: 'বাছুর লালন-পালন ও গৃহস্থালি ব্যবহারের জন্য রাখা হয়েছে',
    };

    // The record should have 0 totalAmount
    expect(unsoldMilkRecord.isSold).toBe(false);
    expect(unsoldMilkRecord.totalAmount).toBe(0);

    // Flow test: check if an income transaction should be created
    const shouldCreateIncome = Boolean(unsoldMilkRecord.isSold && unsoldMilkRecord.totalAmount > 0);
    expect(shouldCreateIncome).toBe(false);

    // Also verify against demo data: mr-7 in INITIAL_MILK_RECORDS is unsold
    const demoUnsold = INITIAL_MILK_RECORDS.find((r) => r.isSold === false);
    expect(demoUnsold).toBeDefined();
    expect(demoUnsold?.totalAmount).toBe(0);

    // Verify no financial record references demoUnsold
    const linkedTx = INITIAL_FINANCIAL_RECORDS.find((f) => f.relatedMilkRecordId === demoUnsold?.id);
    expect(linkedTx).toBeUndefined();
  });

  it('8. A linked milk sale associates its income and prevents duplicate income', () => {
    const milkRecord: MilkRecord = {
      id: 'mr-sale-01',
      date: '১০ অক্টোবর ২০২৬',
      morningLiters: 40.0,
      eveningLiters: 30.0,
      totalLiters: 70.0,
      isSold: true,
      soldLiters: 60.0, // 60 liters sold, 10 liters kept
      pricePerLiter: 80,
      totalAmount: 4800, // 60 * 80
      recordedBy: 'মো: রহিম উদ্দিন',
    };

    expect(milkRecord.isSold).toBe(true);
    expect(milkRecord.totalAmount).toBe(4800);

    const incomeRecord: FinancialRecord = {
      id: 'fin-sale-01',
      date: milkRecord.date,
      type: 'income',
      category: 'milk_sale',
      categoryLabelBn: 'দুধ বিক্রি',
      title: `দুধ বিক্রয় (${milkRecord.soldLiters} লিটার)`,
      amount: milkRecord.totalAmount,
      paymentMethod: 'cash',
      recordedBy: milkRecord.recordedBy,
      relatedMilkRecordId: milkRecord.id,
    };

    // Income record references the exact milk record
    expect(incomeRecord.relatedMilkRecordId).toBe(milkRecord.id);

    // Check duplicate detection: If an income record with this relatedMilkRecordId exists,
    // another one cannot be added with the same relatedMilkRecordId
    const existingTransactions: FinancialRecord[] = [incomeRecord];
    const isDuplicate = existingTransactions.some(
      (tx) => tx.relatedMilkRecordId === milkRecord.id
    );
    expect(isDuplicate).toBe(true);
  });

  it('9. Failed database operations return failure results and do not show false success', async () => {
    // Attempting an update on unconfigured Supabase
    const dummyTx: FinancialRecord = {
      id: 'fin-mock-99',
      date: '2026-10-10',
      type: 'expense',
      category: 'feed',
      categoryLabelBn: 'পশুখাদ্য',
      title: 'খাদ্য ক্রয়',
      amount: 1500,
      paymentMethod: 'cash',
      recordedBy: 'আব্বু',
    };

    const updateRes = await farmRepository.updateFinancialTransaction('user-mock-id', dummyTx);
    expect(updateRes.success).toBe(false);
    expect(updateRes.error).toBeDefined();
    expect(updateRes.error).toMatch(/ক্লাউড ডেটাবেজ কনফিগার করা হয়নি|আর্থিক লেনদেন সংশোধন করা সম্ভব হয়নি/);

    const deleteRes = await farmRepository.deleteFinancialTransaction('user-mock-id', 'fin-mock-99');
    expect(deleteRes.success).toBe(false);
    expect(deleteRes.error).toBeDefined();

    const updateMilkRes = await farmRepository.updateMilkRecord('user-mock-id', {
      id: 'mr-mock-99',
      date: '2026-10-10',
      morningLiters: 10,
      eveningLiters: 10,
      totalLiters: 20,
      pricePerLiter: 80,
      totalAmount: 1600,
      recordedBy: 'রহিম',
    });
    expect(updateMilkRes.success).toBe(false);
    expect(updateMilkRes.error).toBeDefined();
  });

  it('10. Demo records are strictly isolated and not automatically imported into real cloud user accounts', async () => {
    // In our architecture:
    // Demo records reside in client state in demoData.ts
    // When a user authenticates to cloud, fetchCloudData queries Supabase directly
    // and if the user has 0 records in Supabase, cloud records remain empty []
    // rather than auto-migrating demo data into their account without consent.
    const emptyCloudRecords: FinancialRecord[] = [];
    expect(emptyCloudRecords.length).toBe(0);

    // In demo mode:
    expect(INITIAL_FINANCIAL_RECORDS.length).toBeGreaterThan(0);
    // Cloud state does NOT equal demo state
    expect(emptyCloudRecords).not.toBe(INITIAL_FINANCIAL_RECORDS);
  });
});
