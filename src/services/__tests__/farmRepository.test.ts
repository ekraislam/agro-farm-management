import { describe, it, expect } from 'vitest';
import { farmRepository } from '../farmRepository';
import { isSupabaseConfigured } from '../../lib/supabase';
import type { MilkRecord, Cow, ReminderTask, BiogasDailyLog } from '../../types/farm';

describe('Farm Repository & Data Access Security', () => {
  it('never outputs false success message when unconfigured', async () => {
    if (!isSupabaseConfigured) {
      const milkRes = await farmRepository.getMilkRecords('user-123');
      expect(milkRes.success).toBe(false);
      expect(milkRes.error).toBeDefined();

      const cowRes = await farmRepository.getCows('user-123');
      expect(cowRes.success).toBe(false);
      expect(cowRes.error).toBeDefined();

      const finRes = await farmRepository.getFinancialTransactions('user-123');
      expect(finRes.success).toBe(false);
      expect(finRes.error).toBeDefined();
    }
  });

  it('rejects adding records when client is unconfigured with descriptive Bengali error', async () => {
    if (!isSupabaseConfigured) {
      const dummyMilk: MilkRecord = {
        id: 'mr-test',
        date: '১০ অক্টোবর ২০২৬',
        morningLiters: 40,
        eveningLiters: 30,
        totalLiters: 70,
        pricePerLiter: 80,
        totalAmount: 5600,
        recordedBy: 'রহিম',
      };

      const res = await farmRepository.addMilkRecord('user-123', dummyMilk);
      expect(res.success).toBe(false);
      expect(res.error).toContain('ক্লাউড ডেটাবেজ কনফিগার করা হয়নি');
    }
  });

  it('rejects adding cow without cloud configuration', async () => {
    if (!isSupabaseConfigured) {
      const dummyCow: Cow = {
        id: 'cow-test',
        tagNumber: 'গাভী-৯৯',
        name: 'পরীক্ষামূলক',
        breed: 'দেশি',
        ageYears: 3,
        status: 'milking',
        statusLabelBn: 'দুধাল গাভী',
        dailyAvgMilkLiters: 12,
        lastMilkingLiters: 6,
        lastVaccinatedDate: '২০২৬-১০-০১',
      };

      const res = await farmRepository.addCow('user-123', dummyCow);
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    }
  });

  it('rejects adding tasks and logs without cloud configuration', async () => {
    if (!isSupabaseConfigured) {
      const dummyTask: ReminderTask = {
        id: 'task-test',
        title: 'টিকা প্রদান',
        description: 'অ্যানথ্রাক্স টিকা',
        dueDate: '২০২৬-১০-১৫',
        priority: 'high',
        priorityBn: 'জরুরি',
        category: 'vaccine',
        completed: false,
      };

      const res = await farmRepository.addTask('user-123', dummyTask);
      expect(res.success).toBe(false);

      const dummyBiogas: BiogasDailyLog = {
        id: 'bio-test',
        date: '২০২৬-১০-১০',
        dungInputKg: 50,
        waterInputLiters: 50,
        gasPressurePsi: 1.5,
        burnHoursToday: 4,
        slurryProducedBags: 2,
        status: 'optimal',
        statusBn: 'স্বাভাবিক',
      };

      const bioRes = await farmRepository.addBiogasLog('user-123', dummyBiogas);
      expect(bioRes.success).toBe(false);
    }
  });
});
