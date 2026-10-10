import { supabase } from '../lib/supabase';
import type { 
  Cow, 
  MilkRecord, 
  FinancialRecord, 
  Employee, 
  BiogasDailyLog, 
  ReminderTask,
  FarmProfile,
  HealthRecord,
  AttendanceRecord,
  BiogasInspectionItem
} from '../types/farm';

export interface RepositoryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const translateDbError = (error: unknown, fallback: string): string => {
  if (!error) return fallback;
  const msg = error instanceof Error
    ? error.message
    : typeof error === 'object' && error && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error);
  if (msg.includes('JWT') || msg.includes('auth') || msg.includes('unauthorized') || msg.includes('row-level security') || msg.includes('violates row-level security policy')) {
    return 'ব্যবহারকারীর সেশন মেয়াদোত্তীর্ণ বা অনুমোদনহীন। অনুগ্রহ করে আবার লগইন করুন।';
  }
  if (msg.includes('network') || msg.includes('Failed to fetch')) {
    return 'ক্লাউড সার্ভারের সাথে যোগাযোগ করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।';
  }
  if (msg.includes('duplicate key') || msg.includes('unique_user_cow_tag')) {
    return 'এই ট্যাগ নম্বরের গরু ইতিমধ্যে আপনার খামারে নিবন্ধিত রয়েছে।';
  }
  if (msg.includes('unique_user_milk_transaction')) {
    return 'এই দুধের হিসাবের বিপরীতে ইতিমধ্যে একটি আয়ের লেনদেন অন্তর্ভুক্ত রয়েছে (দ্বৈত এন্ট্রি প্রতিরোধ)।';
  }
  return `${fallback}: ${msg}`;
};

export const farmRepository = {
  // --------------------------------------------------------------------------
  // Farm Profile
  // --------------------------------------------------------------------------
  async getFarmProfile(userId: string): Promise<RepositoryResult<FarmProfile>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const { data, error } = await supabase
        .from('farm_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        return { success: false, error: translateDbError(error, 'খামার প্রোফাইল লোড করতে ব্যর্থ') };
      }

      if (!data) {
        // Return default profile
        return {
          success: true,
          data: {
            userId,
            farmName: 'মুমিন এগ্রো',
            ownerName: 'মো: মোমিনুল ইসলাম',
            phone: '০১৭XXXXXXXX',
            address: 'খামার প্রাঙ্গণ',
            defaultMilkRate: 80,
            dairyCapacity: 10,
            notificationsEnabled: true,
          },
        };
      }

      return {
        success: true,
        data: {
          id: data.id,
          userId: data.user_id,
          farmName: data.farm_name,
          ownerName: data.owner_name,
          phone: data.phone || '',
          address: data.address || '',
          defaultMilkRate: Number(data.default_milk_rate) || 80,
          dairyCapacity: Number(data.dairy_capacity) || 10,
          notificationsEnabled: Boolean(data.notifications_enabled),
        },
      };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'খামার প্রোফাইল লোড করা যায়নি') };
    }
  },

  async updateFarmProfile(userId: string, profile: Partial<FarmProfile>): Promise<RepositoryResult<FarmProfile>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const payload = {
        user_id: userId,
        farm_name: profile.farmName ?? 'মুমিন এগ্রো',
        owner_name: profile.ownerName ?? 'মো: মোমিনুল ইসলাম',
        phone: profile.phone ?? null,
        address: profile.address ?? null,
        default_milk_rate: profile.defaultMilkRate ?? 80,
        dairy_capacity: profile.dairyCapacity ?? 10,
        notifications_enabled: profile.notificationsEnabled ?? true,
      };

      const { data, error } = await supabase
        .from('farm_profiles')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        return { success: false, error: translateDbError(error, 'খামার সেটিংস সংরক্ষণ করা সম্ভব হয়নি') };
      }

      return {
        success: true,
        data: {
          id: data.id,
          userId: data.user_id,
          farmName: data.farm_name,
          ownerName: data.owner_name,
          phone: data.phone || '',
          address: data.address || '',
          defaultMilkRate: Number(data.default_milk_rate),
          dairyCapacity: Number(data.dairy_capacity),
          notificationsEnabled: Boolean(data.notifications_enabled),
        },
      };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'খামার সেটিংস সংরক্ষণে সমস্যা হয়েছে') };
    }
  },

  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // Cows (CRUD & Safe Archival)
  // --------------------------------------------------------------------------
  async getCows(userId: string): Promise<RepositoryResult<Cow[]>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const { data, error } = await supabase
        .from('cows')
        .select('*')
        .eq('user_id', userId)
        .order('tag_number', { ascending: true });

      if (error) {
        return { success: false, error: translateDbError(error, 'গরুর তালিকা লোড করা যায়নি') };
      }

      const cows: Cow[] = (data || []).map((row) => ({
        id: row.id,
        tagNumber: row.tag_number,
        name: row.name,
        breed: row.breed,
        gender: (row.gender as any) || 'female',
        ageYears: Number(row.age_years) || 0,
        isAgeEstimated: row.is_age_estimated ?? true,
        dateOfBirth: row.date_of_birth || undefined,
        status: row.status as any,
        statusLabelBn: row.status_label_bn,
        dailyAvgMilkLiters: Number(row.daily_avg_milk_liters) || 0,
        lastMilkingLiters: Number(row.last_milking_liters) || 0,
        lastVaccinatedDate: row.last_vaccinated_date || '',
        expectedCalvingDate: row.expected_calving_date || undefined,
        purchaseDate: row.purchase_date || undefined,
        purchasePrice: Number(row.purchase_price) || 0,
        isArchived: Boolean(row.is_archived),
        archivedAt: row.archived_at || undefined,
        photoUrl: row.photo_url || undefined,
        notes: row.notes || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return { success: true, data: cows };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'গরুর তথ্য লোড করা যায়নি') };
    }
  },

  async addCow(userId: string, cow: Cow): Promise<RepositoryResult<Cow>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const payload = {
        user_id: userId,
        tag_number: cow.tagNumber.trim(),
        name: cow.name.trim(),
        breed: cow.breed,
        gender: cow.gender || 'female',
        age_years: cow.ageYears,
        is_age_estimated: cow.isAgeEstimated ?? true,
        date_of_birth: cow.dateOfBirth || null,
        status: cow.status,
        status_label_bn: cow.statusLabelBn,
        daily_avg_milk_liters: cow.dailyAvgMilkLiters,
        last_milking_liters: cow.lastMilkingLiters,
        last_vaccinated_date: cow.lastVaccinatedDate || null,
        expected_calving_date: cow.expectedCalvingDate || null,
        purchase_date: cow.purchaseDate || null,
        purchase_price: cow.purchasePrice ?? 0,
        is_archived: cow.isArchived ?? false,
        notes: cow.notes || null,
      };

      const { data, error } = await supabase.from('cows').insert(payload).select().single();

      if (error) {
        return { success: false, error: translateDbError(error, 'গরুর তথ্য সংরক্ষণ করা যায়নি') };
      }

      return {
        success: true,
        data: {
          id: data.id,
          tagNumber: data.tag_number,
          name: data.name,
          breed: data.breed,
          gender: data.gender as any,
          ageYears: Number(data.age_years),
          isAgeEstimated: Boolean(data.is_age_estimated),
          dateOfBirth: data.date_of_birth || undefined,
          status: data.status as any,
          statusLabelBn: data.status_label_bn,
          dailyAvgMilkLiters: Number(data.daily_avg_milk_liters),
          lastMilkingLiters: Number(data.last_milking_liters),
          lastVaccinatedDate: data.last_vaccinated_date || '',
          expectedCalvingDate: data.expected_calving_date || undefined,
          purchaseDate: data.purchase_date || undefined,
          purchasePrice: Number(data.purchase_price) || 0,
          isArchived: Boolean(data.is_archived),
          archivedAt: data.archived_at || undefined,
          notes: data.notes || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
      };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'গরুর তথ্য সংরক্ষণ ব্যর্থ হয়েছে') };
    }
  },

  async updateCow(userId: string, cow: Cow): Promise<RepositoryResult<Cow>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const payload = {
        tag_number: cow.tagNumber.trim(),
        name: cow.name.trim(),
        breed: cow.breed,
        gender: cow.gender || 'female',
        age_years: cow.ageYears,
        is_age_estimated: cow.isAgeEstimated ?? true,
        date_of_birth: cow.dateOfBirth || null,
        status: cow.status,
        status_label_bn: cow.statusLabelBn,
        daily_avg_milk_liters: cow.dailyAvgMilkLiters,
        last_milking_liters: cow.lastMilkingLiters,
        last_vaccinated_date: cow.lastVaccinatedDate || null,
        expected_calving_date: cow.expectedCalvingDate || null,
        purchase_date: cow.purchaseDate || null,
        purchase_price: cow.purchasePrice ?? 0,
        is_archived: cow.isArchived ?? false,
        archived_at: cow.isArchived ? (cow.archivedAt || new Date().toISOString()) : null,
        notes: cow.notes || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('cows')
        .update(payload)
        .eq('id', cow.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: translateDbError(error, 'গরুর তথ্য সংশোধন করা সম্ভব হয়নি') };
      }

      return {
        success: true,
        data: {
          id: data.id,
          tagNumber: data.tag_number,
          name: data.name,
          breed: data.breed,
          gender: data.gender as any,
          ageYears: Number(data.age_years),
          isAgeEstimated: Boolean(data.is_age_estimated),
          dateOfBirth: data.date_of_birth || undefined,
          status: data.status as any,
          statusLabelBn: data.status_label_bn,
          dailyAvgMilkLiters: Number(data.daily_avg_milk_liters),
          lastMilkingLiters: Number(data.last_milking_liters),
          lastVaccinatedDate: data.last_vaccinated_date || '',
          expectedCalvingDate: data.expected_calving_date || undefined,
          purchaseDate: data.purchase_date || undefined,
          purchasePrice: Number(data.purchase_price) || 0,
          isArchived: Boolean(data.is_archived),
          archivedAt: data.archived_at || undefined,
          notes: data.notes || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
      };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'গরুর তথ্য হালনাগাদ ব্যর্থ') };
    }
  },

  async deleteOrArchiveCow(userId: string, cowId: string): Promise<RepositoryResult<{ archived: boolean }>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      // 1. Check if the cow has historical milk records or health records
      const [milkCheck, healthCheck] = await Promise.all([
        supabase.from('milk_records').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('cow_id', cowId),
        supabase.from('health_records').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('cow_id', cowId),
      ]);

      const hasHistory = Boolean((milkCheck.count && milkCheck.count > 0) || (healthCheck.count && healthCheck.count > 0));

      if (hasHistory) {
        // Safe archival strategy: archive the cow to preserve accounting and milk histories
        const { error } = await supabase
          .from('cows')
          .update({
            is_archived: true,
            archived_at: new Date().toISOString(),
            status: 'other',
            status_label_bn: 'সংরক্ষণাগার (আর্কাইভ)',
            updated_at: new Date().toISOString(),
          })
          .eq('id', cowId)
          .eq('user_id', userId);

        if (error) {
          return { success: false, error: translateDbError(error, 'গরুটি সংরক্ষণাগারে সরানো যায়নি') };
        }

        return { success: true, data: { archived: true } };
      }

      // No historical records exist, safe to hard delete
      const { error } = await supabase
        .from('cows')
        .delete()
        .eq('id', cowId)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: translateDbError(error, 'গরুর তথ্য মুছে ফেলা যায়নি') };
      }

      return { success: true, data: { archived: false } };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'গরু অপসারণ বা সংরক্ষণাগারে সরাতে সমস্যা হয়েছে') };
    }
  },

  // --------------------------------------------------------------------------
  // Milk Records
  // --------------------------------------------------------------------------
  async getMilkRecords(userId: string): Promise<RepositoryResult<MilkRecord[]>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const { data, error } = await supabase
        .from('milk_records')
        .select('*')
        .eq('user_id', userId)
        .order('record_date', { ascending: false });

      if (error) {
        return { success: false, error: translateDbError(error, 'দুধের হিসাব লোড করা যায়নি') };
      }

      const records: MilkRecord[] = (data || []).map((row) => ({
        id: row.id,
        date: row.record_date,
        morningLiters: Number(row.morning_liters) || 0,
        eveningLiters: Number(row.evening_liters) || 0,
        totalLiters: Number(row.total_liters) || 0,
        entryType: (row.entry_type as any) || (row.cow_id ? 'individual' : 'aggregate'),
        isSold: row.is_sold ?? true,
        soldLiters: Number(row.sold_liters) || 0,
        pricePerLiter: Number(row.price_per_liter) || 0,
        totalAmount: Number(row.total_amount) || 0,
        cowId: row.cow_id || undefined,
        cowName: row.cow_name || undefined,
        recordedBy: row.recorded_by,
        note: row.notes || undefined,
      }));

      return { success: true, data: records };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'দুধের হিসাব আনতে সমস্যা হয়েছে') };
    }
  },

  async addMilkRecord(userId: string, record: MilkRecord): Promise<RepositoryResult<MilkRecord>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const isSold = record.isSold ?? true;
      const soldLiters = isSold ? (record.soldLiters ?? record.totalLiters) : 0;
      const totalAmount = isSold ? record.totalAmount : 0;

      const payload = {
        user_id: userId,
        record_date: record.date.includes('২০২') ? new Date().toISOString().split('T')[0] : record.date,
        cow_id: record.cowId || null,
        cow_name: record.cowName || null,
        entry_type: record.entryType || (record.cowId ? 'individual' : 'aggregate'),
        session: 'full_day' as const,
        morning_liters: record.morningLiters,
        evening_liters: record.eveningLiters,
        total_liters: record.totalLiters,
        is_sold: isSold,
        sold_liters: soldLiters,
        price_per_liter: isSold ? record.pricePerLiter : 0,
        total_amount: totalAmount,
        recorded_by: record.recordedBy,
        notes: record.note || null,
      };

      const { data, error } = await supabase.from('milk_records').insert(payload).select().single();

      if (error) {
        return { success: false, error: translateDbError(error, 'দুধের হিসাব সংরক্ষণ করা সম্ভব হয়নি') };
      }

      return {
        success: true,
        data: {
          id: data.id,
          date: record.date,
          morningLiters: Number(data.morning_liters),
          eveningLiters: Number(data.evening_liters),
          totalLiters: Number(data.total_liters),
          entryType: data.entry_type as any,
          isSold: Boolean(data.is_sold),
          soldLiters: Number(data.sold_liters),
          pricePerLiter: Number(data.price_per_liter),
          totalAmount: Number(data.total_amount),
          cowId: data.cow_id || undefined,
          cowName: data.cow_name || undefined,
          recordedBy: data.recorded_by,
          note: data.notes || undefined,
        },
      };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'দুধের হিসাব সংরক্ষণে সমস্যা হয়েছে') };
    }
  },

  async updateMilkRecord(userId: string, record: MilkRecord): Promise<RepositoryResult<MilkRecord>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const isSold = record.isSold ?? true;
      const soldLiters = isSold ? (record.soldLiters ?? record.totalLiters) : 0;
      const totalAmount = isSold ? record.totalAmount : 0;

      const payload = {
        record_date: record.date.includes('২০২') ? new Date().toISOString().split('T')[0] : record.date,
        cow_id: record.cowId || null,
        cow_name: record.cowName || null,
        entry_type: record.entryType || (record.cowId ? 'individual' : 'aggregate'),
        morning_liters: record.morningLiters,
        evening_liters: record.eveningLiters,
        total_liters: record.totalLiters,
        is_sold: isSold,
        sold_liters: soldLiters,
        price_per_liter: isSold ? record.pricePerLiter : 0,
        total_amount: totalAmount,
        recorded_by: record.recordedBy,
        notes: record.note || null,
      };

      const { data, error } = await supabase
        .from('milk_records')
        .update(payload)
        .eq('id', record.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: translateDbError(error, 'দুধের হিসাব সংশোধন করা সম্ভব হয়নি') };
      }

      // Synchronize linked financial transaction if one exists
      if (isSold && totalAmount > 0) {
        await supabase
          .from('financial_transactions')
          .update({
            amount: totalAmount,
            title: `দুধ বিক্রয় (${soldLiters} লিটার)`,
            transaction_date: payload.record_date,
            description: record.note || null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('related_milk_record_id', record.id);
      } else {
        // If milk is no longer sold, eliminate linked revenue transaction to avoid fictional income
        await supabase
          .from('financial_transactions')
          .delete()
          .eq('user_id', userId)
          .eq('related_milk_record_id', record.id);
      }

      return {
        success: true,
        data: {
          id: data.id,
          date: record.date,
          morningLiters: Number(data.morning_liters),
          eveningLiters: Number(data.evening_liters),
          totalLiters: Number(data.total_liters),
          entryType: data.entry_type as any,
          isSold: Boolean(data.is_sold),
          soldLiters: Number(data.sold_liters),
          pricePerLiter: Number(data.price_per_liter),
          totalAmount: Number(data.total_amount),
          cowId: data.cow_id || undefined,
          cowName: data.cow_name || undefined,
          recordedBy: data.recorded_by,
          note: data.notes || undefined,
        },
      };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'দুধের হিসাব হালনাগাদ করতে ব্যর্থ') };
    }
  },

  async deleteMilkRecord(userId: string, milkRecordId: string): Promise<RepositoryResult<boolean>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      // 1. Delete any linked financial transaction first
      await supabase
        .from('financial_transactions')
        .delete()
        .eq('user_id', userId)
        .eq('related_milk_record_id', milkRecordId);

      // 2. Delete the milk record itself
      const { error } = await supabase
        .from('milk_records')
        .delete()
        .eq('id', milkRecordId)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: translateDbError(error, 'দুধের রেকর্ড মুছে ফেলা যায়নি') };
      }

      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'দুধের রেকর্ড অপসারণ ব্যর্থ হয়েছে') };
    }
  },

  // --------------------------------------------------------------------------
  // Health Records (স্বাস্থ্য ও টিকাদান খতিয়ান)
  // --------------------------------------------------------------------------
  async getHealthRecords(userId: string, cowId?: string): Promise<RepositoryResult<HealthRecord[]>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      let query = supabase
        .from('health_records')
        .select('*')
        .eq('user_id', userId)
        .order('event_date', { ascending: false });

      if (cowId) {
        query = query.eq('cow_id', cowId);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: translateDbError(error, 'স্বাস্থ্য রেকর্ড লোড করা যায়নি') };
      }

      const records: HealthRecord[] = (data || []).map((row) => ({
        id: row.id,
        cowId: row.cow_id || '',
        cowTag: row.cow_tag,
        cowName: row.cow_name || undefined,
        eventType: row.event_type as any,
        eventTypeLabelBn: row.event_type === 'vaccination' ? 'টিকা প্রদান (Vaccine)' :
                          row.event_type === 'deworming' ? 'কৃমিনাশক প্রয়োগ (Deworming)' :
                          row.event_type === 'vet_consultation' ? 'পশুচিকিৎসক পরামর্শ' :
                          row.event_type === 'treatment' ? 'অসুস্থতা ও চিকিৎসা' : 'অন্যান্য স্বাস্থ্যসেবা',
        eventDate: row.event_date,
        nextDueDate: row.next_due_date || undefined,
        treatmentName: row.treatment_name,
        doctorName: row.doctor_name || undefined,
        cost: Number(row.cost) || 0,
        notes: row.notes || undefined,
        relatedExpenseId: row.related_expense_id || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return { success: true, data: records };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'স্বাস্থ্য রেকর্ড লোড করতে ব্যর্থ') };
    }
  },

  async addHealthRecord(
    userId: string,
    record: HealthRecord,
    createExpense = false,
    paymentMethod: 'cash' | 'bkash' | 'bank' = 'cash'
  ): Promise<RepositoryResult<{ healthRecord: HealthRecord; expenseRecord?: FinancialRecord }>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const payload = {
        user_id: userId,
        cow_id: record.cowId || null,
        cow_tag: record.cowTag,
        cow_name: record.cowName || null,
        event_type: record.eventType,
        event_date: record.eventDate.includes('২০২') ? new Date().toISOString().split('T')[0] : record.eventDate,
        next_due_date: record.nextDueDate ? (record.nextDueDate.includes('২০২') ? new Date().toISOString().split('T')[0] : record.nextDueDate) : null,
        treatment_name: record.treatmentName,
        doctor_name: record.doctorName || null,
        cost: record.cost ?? 0,
        notes: record.notes || null,
      };

      const { data: hData, error: hError } = await supabase
        .from('health_records')
        .insert(payload)
        .select()
        .single();

      if (hError) {
        return { success: false, error: translateDbError(hError, 'স্বাস্থ্য রেকর্ড সংরক্ষণ ব্যর্থ হয়েছে') };
      }

      let createdExpense: FinancialRecord | undefined = undefined;

      // Only create an expense if user explicitly opted in and cost is positive
      if (createExpense && record.cost && record.cost > 0) {
        const expensePayload = {
          user_id: userId,
          transaction_date: payload.event_date,
          type: 'expense' as const,
          category: 'medicine',
          category_label_bn: 'পশুচিকিৎসা ও ঔষধ',
          title: `চিকিৎসা খরচ: ${record.treatmentName} (${record.cowTag})`,
          amount: record.cost,
          payment_method: paymentMethod,
          recorded_by: 'আব্বু (খামার মালিক)',
          description: record.notes || `ডাক্তার: ${record.doctorName || 'উদ্ধৃত নেই'}`,
          related_health_record_id: hData.id,
        };

        const { data: expData, error: expError } = await supabase
          .from('financial_transactions')
          .insert(expensePayload)
          .select()
          .single();

        if (!expError && expData) {
          // Link back to health record
          await supabase
            .from('health_records')
            .update({ related_expense_id: expData.id })
            .eq('id', hData.id);

          createdExpense = {
            id: expData.id,
            date: expData.transaction_date,
            type: 'expense',
            category: 'medicine',
            categoryLabelBn: 'পশুচিকিৎসা ও ঔষধ',
            title: expData.title,
            amount: Number(expData.amount),
            paymentMethod: expData.payment_method,
            recordedBy: expData.recorded_by,
            notes: expData.description || undefined,
            relatedHealthRecordId: hData.id,
          };
        }
      }

      // If next_due_date is set, create a reminder task linked to this health event
      if (payload.next_due_date) {
        await supabase.from('tasks').insert({
          user_id: userId,
          title: `${record.treatmentName} ফলো-আপ / বুস্টার (${record.cowTag})`,
          description: `পূর্বে চিকিৎসা: ${record.treatmentName} (${payload.event_date})। ডাক্তার: ${record.doctorName || 'উদ্ধৃত নেই'}`,
          due_date: payload.next_due_date,
          priority: 'high',
          priority_bn: 'জরুরি',
          category: 'vaccine',
          completed: false,
          cow_id: record.cowId || null,
          related_health_record_id: hData.id,
        });
      }

      const savedHealth: HealthRecord = {
        id: hData.id,
        cowId: hData.cow_id || '',
        cowTag: hData.cow_tag,
        cowName: hData.cow_name || undefined,
        eventType: hData.event_type as any,
        eventTypeLabelBn: record.eventTypeLabelBn,
        eventDate: hData.event_date,
        nextDueDate: hData.next_due_date || undefined,
        treatmentName: hData.treatment_name,
        doctorName: hData.doctor_name || undefined,
        cost: Number(hData.cost),
        notes: hData.notes || undefined,
        relatedExpenseId: createdExpense ? createdExpense.id : undefined,
      };

      return {
        success: true,
        data: {
          healthRecord: savedHealth,
          expenseRecord: createdExpense,
        },
      };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'স্বাস্থ্য রেকর্ড তৈরিতে সমস্যা হয়েছে') };
    }
  },

  async updateHealthRecord(userId: string, record: HealthRecord): Promise<RepositoryResult<HealthRecord>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const payload = {
        cow_id: record.cowId || null,
        cow_tag: record.cowTag,
        cow_name: record.cowName || null,
        event_type: record.eventType,
        event_date: record.eventDate.includes('২০২') ? new Date().toISOString().split('T')[0] : record.eventDate,
        next_due_date: record.nextDueDate ? (record.nextDueDate.includes('২০২') ? new Date().toISOString().split('T')[0] : record.nextDueDate) : null,
        treatment_name: record.treatmentName,
        doctor_name: record.doctorName || null,
        cost: record.cost ?? 0,
        notes: record.notes || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('health_records')
        .update(payload)
        .eq('id', record.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: translateDbError(error, 'স্বাস্থ্য রেকর্ড আপডেট ব্যর্থ হয়েছে') };
      }

      // If linked expense exists, synchronize amount
      if (record.relatedExpenseId && record.cost) {
        await supabase
          .from('financial_transactions')
          .update({
            amount: record.cost,
            title: `চিকিৎসা খরচ: ${record.treatmentName} (${record.cowTag})`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', record.relatedExpenseId)
          .eq('user_id', userId);
      }

      return {
        success: true,
        data: {
          id: data.id,
          cowId: data.cow_id || '',
          cowTag: data.cow_tag,
          cowName: data.cow_name || undefined,
          eventType: data.event_type as any,
          eventTypeLabelBn: record.eventTypeLabelBn,
          eventDate: data.event_date,
          nextDueDate: data.next_due_date || undefined,
          treatmentName: data.treatment_name,
          doctorName: data.doctor_name || undefined,
          cost: Number(data.cost),
          notes: data.notes || undefined,
          relatedExpenseId: record.relatedExpenseId,
        },
      };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'স্বাস্থ্য রেকর্ড সংশোধনে ত্রুটি') };
    }
  },

  async deleteHealthRecord(userId: string, recordId: string): Promise<RepositoryResult<boolean>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      // 1. Clear any linked task
      await supabase.from('tasks').delete().eq('user_id', userId).eq('related_health_record_id', recordId);

      // 2. Delete the health record
      const { error } = await supabase
        .from('health_records')
        .delete()
        .eq('id', recordId)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: translateDbError(error, 'স্বাস্থ্য রেকর্ড মুছে ফেলা সম্ভব হয়নি') };
      }

      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'স্বাস্থ্য রেকর্ড অপসারণ ব্যর্থ') };
    }
  },

  // --------------------------------------------------------------------------
  // Financial Transactions (CRUD)
  // --------------------------------------------------------------------------
  async getFinancialTransactions(userId: string): Promise<RepositoryResult<FinancialRecord[]>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false });

      if (error) {
        return { success: false, error: translateDbError(error, 'আর্থিক লেনদেন লোড করা যায়নি') };
      }

      const records: FinancialRecord[] = (data || []).map((row) => ({
        id: row.id,
        date: row.transaction_date,
        type: row.type,
        category: row.category as any,
        categoryLabelBn: row.category_label_bn,
        title: row.title,
        amount: Number(row.amount),
        paymentMethod: row.payment_method,
        recordedBy: row.recorded_by,
        notes: row.description || undefined,
        relatedMilkRecordId: row.related_milk_record_id || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return { success: true, data: records };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'আর্থিক তথ্য আনতে সমস্যা হয়েছে') };
    }
  },

  async addFinancialTransaction(userId: string, tx: FinancialRecord): Promise<RepositoryResult<FinancialRecord>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const payload = {
        user_id: userId,
        transaction_date: tx.date.includes('২০২') ? new Date().toISOString().split('T')[0] : tx.date,
        type: tx.type,
        category: tx.category,
        category_label_bn: tx.categoryLabelBn,
        title: tx.title,
        amount: tx.amount,
        payment_method: tx.paymentMethod,
        recorded_by: tx.recordedBy,
        description: tx.notes || null,
        related_milk_record_id: tx.relatedMilkRecordId || null,
      };

      const { data, error } = await supabase.from('financial_transactions').insert(payload).select().single();

      if (error) {
        return { success: false, error: translateDbError(error, 'আর্থিক লেনদেন সংরক্ষণ করা যায়নি') };
      }

      return {
        success: true,
        data: {
          id: data.id,
          date: tx.date,
          type: data.type,
          category: data.category as any,
          categoryLabelBn: data.category_label_bn,
          title: data.title,
          amount: Number(data.amount),
          paymentMethod: data.payment_method,
          recordedBy: data.recorded_by,
          notes: data.description || undefined,
          relatedMilkRecordId: data.related_milk_record_id || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
      };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'আর্থিক লেনদেন সংরক্ষণ ব্যর্থ হয়েছে') };
    }
  },

  async updateFinancialTransaction(userId: string, tx: FinancialRecord): Promise<RepositoryResult<FinancialRecord>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const payload = {
        transaction_date: tx.date.includes('২০২') ? new Date().toISOString().split('T')[0] : tx.date,
        type: tx.type,
        category: tx.category,
        category_label_bn: tx.categoryLabelBn,
        title: tx.title,
        amount: tx.amount,
        payment_method: tx.paymentMethod,
        recorded_by: tx.recordedBy,
        description: tx.notes || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('financial_transactions')
        .update(payload)
        .eq('id', tx.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: translateDbError(error, 'আর্থিক লেনদেন সংশোধন করা সম্ভব হয়নি') };
      }

      return {
        success: true,
        data: {
          id: data.id,
          date: tx.date,
          type: data.type,
          category: data.category as any,
          categoryLabelBn: data.category_label_bn,
          title: data.title,
          amount: Number(data.amount),
          paymentMethod: data.payment_method,
          recordedBy: data.recorded_by,
          notes: data.description || undefined,
          relatedMilkRecordId: data.related_milk_record_id || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
      };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'আর্থিক লেনদেন সংশোধনে ব্যর্থ') };
    }
  },

  async deleteFinancialTransaction(userId: string, txId: string): Promise<RepositoryResult<boolean>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', txId)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: translateDbError(error, 'আর্থিক লেনদেন মুছে ফেলা সম্ভব হয়নি') };
      }

      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'আর্থিক লেনদেন মুছতে সমস্যা হয়েছে') };
    }
  },

  // --------------------------------------------------------------------------
  // Employees
  // --------------------------------------------------------------------------
  async getEmployees(userId: string): Promise<RepositoryResult<Employee[]>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) {
        return { success: false, error: translateDbError(error, 'কর্মচারীদের তথ্য লোড করা যায়নি') };
      }

      const employees: Employee[] = (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        role: row.job_title,
        phone: row.phone || '',
        salaryMonthly: Number(row.monthly_salary) || 0,
        joiningDate: row.joining_date || '',
        assignedDuties: row.assigned_duties || [],
        status: (row.active_status as any) || 'active',
        avatarInitials: row.name.slice(0, 2),
        notes: row.notes || undefined,
        isArchived: Boolean(row.is_archived),
        archivedAt: row.archived_at || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return { success: true, data: employees };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'কর্মচারীদের তথ্য লোড ব্যর্থ') };
    }
  },

  async addEmployee(userId: string, emp: Employee): Promise<RepositoryResult<Employee>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const payload = {
        user_id: userId,
        name: emp.name,
        job_title: emp.role,
        phone: emp.phone || null,
        monthly_salary: emp.salaryMonthly,
        active_status: emp.status,
        assigned_duties: emp.assignedDuties || [],
        joining_date: emp.joiningDate ? (emp.joiningDate.includes('২০২') ? new Date().toISOString().split('T')[0] : emp.joiningDate) : null,
        notes: emp.notes || null,
        is_archived: false,
      };

      const { data, error } = await supabase.from('employees').insert(payload).select().single();

      if (error) {
        return { success: false, error: translateDbError(error, 'কর্মচারী সংরক্ষণ করা সম্ভব হয়নি') };
      }

      return {
        success: true,
        data: {
          id: data.id,
          name: data.name,
          role: data.job_title,
          phone: data.phone || '',
          salaryMonthly: Number(data.monthly_salary),
          joiningDate: data.joining_date || '',
          assignedDuties: data.assigned_duties,
          status: (data.active_status as any) || 'active',
          avatarInitials: data.name.slice(0, 2),
          notes: data.notes || undefined,
          isArchived: Boolean(data.is_archived),
          archivedAt: data.archived_at || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
      };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'কর্মচারী সংরক্ষণে ত্রুটি') };
    }
  },

  async updateEmployee(userId: string, emp: Employee): Promise<RepositoryResult<Employee>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const payload = {
        name: emp.name,
        job_title: emp.role,
        phone: emp.phone || null,
        monthly_salary: emp.salaryMonthly,
        active_status: emp.status,
        assigned_duties: emp.assignedDuties || [],
        joining_date: emp.joiningDate ? (emp.joiningDate.includes('২০২') ? new Date().toISOString().split('T')[0] : emp.joiningDate) : null,
        notes: emp.notes || null,
        is_archived: Boolean(emp.isArchived),
        archived_at: emp.archivedAt || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('employees')
        .update(payload)
        .eq('id', emp.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: translateDbError(error, 'কর্মচারীর তথ্য সংশোধন করা যায়নি') };
      }

      return {
        success: true,
        data: {
          id: data.id,
          name: data.name,
          role: data.job_title,
          phone: data.phone || '',
          salaryMonthly: Number(data.monthly_salary),
          joiningDate: data.joining_date || '',
          assignedDuties: data.assigned_duties,
          status: (data.active_status as any) || 'active',
          avatarInitials: data.name.slice(0, 2),
          notes: data.notes || undefined,
          isArchived: Boolean(data.is_archived),
          archivedAt: data.archived_at || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
      };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'কর্মচারীর তথ্য আপডেটে সমস্যা হয়েছে') };
    }
  },

  async deleteOrArchiveEmployee(userId: string, employeeId: string): Promise<RepositoryResult<{ archived: boolean }>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      // Check historical records
      const [attCheck, taskCheck, finCheck] = await Promise.all([
        supabase.from('employee_attendance').select('id').eq('employee_id', employeeId).limit(1),
        supabase.from('tasks').select('id').eq('assigned_employee_id', employeeId).limit(1),
        supabase.from('financial_transactions').select('id').eq('related_employee_id', employeeId).limit(1),
      ]);

      const hasHistory = (attCheck.data && attCheck.data.length > 0) ||
        (taskCheck.data && taskCheck.data.length > 0) ||
        (finCheck.data && finCheck.data.length > 0);

      if (hasHistory) {
        // Safe archival
        const { error } = await supabase
          .from('employees')
          .update({
            is_archived: true,
            archived_at: new Date().toISOString(),
            active_status: 'inactive',
            updated_at: new Date().toISOString(),
          })
          .eq('id', employeeId)
          .eq('user_id', userId);

        if (error) {
          return { success: false, error: translateDbError(error, 'কর্মচারী আর্কাইভ করতে সমস্যা হয়েছে') };
        }
        return { success: true, data: { archived: true } };
      }

      // No historical records: safe to hard delete
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: translateDbError(error, 'কর্মচারী মুছে ফেলা সম্ভব হয়নি') };
      }

      return { success: true, data: { archived: false } };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'কর্মচারী মুছে ফেলার প্রক্রিয়ায় ত্রুটি') };
    }
  },

  // --------------------------------------------------------------------------
  // Attendance
  // --------------------------------------------------------------------------
  async getAttendance(userId: string, dateOrMonth?: string): Promise<RepositoryResult<AttendanceRecord[]>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      let query = supabase
        .from('employee_attendance')
        .select('*')
        .eq('user_id', userId)
        .order('attendance_date', { ascending: false });

      if (dateOrMonth) {
        if (dateOrMonth.length === 10) {
          query = query.eq('attendance_date', dateOrMonth);
        } else if (dateOrMonth.length === 7) {
          query = query.gte('attendance_date', `${dateOrMonth}-01`).lte('attendance_date', `${dateOrMonth}-31`);
        }
      }

      const { data, error } = await query;
      if (error) {
        return { success: false, error: translateDbError(error, 'উপস্থিতি তথ্য লোড করা যায়নি') };
      }

      const records: AttendanceRecord[] = (data || []).map((row) => ({
        id: row.id,
        employeeId: row.employee_id,
        date: row.attendance_date,
        status: row.status as any,
        statusBn: row.status === 'present' ? 'উপস্থিত' : row.status === 'leave' ? 'ছুটি' : 'অনুপস্থিত',
        arrivalTime: row.arrival_time || undefined,
        departureTime: row.departure_time || undefined,
        notes: row.notes || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return { success: true, data: records };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'উপস্থিতি লোড ব্যর্থ') };
    }
  },

  async recordAttendance(userId: string, record: AttendanceRecord): Promise<RepositoryResult<AttendanceRecord>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const payload = {
        user_id: userId,
        employee_id: record.employeeId,
        attendance_date: record.date.includes('২০২') ? new Date().toISOString().split('T')[0] : record.date,
        status: record.status,
        arrival_time: record.arrivalTime || null,
        departure_time: record.departureTime || null,
        notes: record.notes || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('employee_attendance')
        .upsert(payload, { onConflict: 'user_id,employee_id,attendance_date' })
        .select()
        .single();

      if (error) {
        return { success: false, error: translateDbError(error, 'উপস্থিতি সংরক্ষণ করা সম্ভব হয়নি') };
      }

      return {
        success: true,
        data: {
          id: data.id,
          employeeId: data.employee_id,
          date: data.attendance_date,
          status: data.status as any,
          statusBn: data.status === 'present' ? 'উপস্থিত' : data.status === 'leave' ? 'ছুটি' : 'অনুপস্থিত',
          arrivalTime: data.arrival_time || undefined,
          departureTime: data.departure_time || undefined,
          notes: data.notes || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
      };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'উপস্থিতি সংরক্ষণে ত্রুটি') };
    }
  },

  // --------------------------------------------------------------------------
  // Payroll & Salary Transactions
  // --------------------------------------------------------------------------
  async recordSalaryPayment(
    userId: string,
    params: {
      employee: Employee;
      amount: number;
      paymentMethod: 'cash' | 'bkash' | 'bank';
      salaryPeriod: string;
      paymentDate: string;
      notes?: string;
    }
  ): Promise<RepositoryResult<FinancialRecord>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const payload = {
        user_id: userId,
        transaction_date: params.paymentDate.includes('২০২') ? new Date().toISOString().split('T')[0] : params.paymentDate,
        type: 'expense' as const,
        category: 'salary',
        category_label_bn: 'কর্মচারীর বেতন',
        title: `বেতন পরিশোধ: ${params.employee.name} (${params.salaryPeriod})`,
        amount: params.amount,
        payment_method: params.paymentMethod,
        related_employee_id: params.employee.id,
        salary_period: params.salaryPeriod,
        recorded_by: 'আব্বু (খামার মালিক)',
        description: params.notes || `মাসিক বেতন পরিশোধ - ${params.salaryPeriod}`,
      };

      const { data, error } = await supabase
        .from('financial_transactions')
        .insert(payload)
        .select()
        .single();

      if (error) {
        return { success: false, error: translateDbError(error, 'বেতনের খরচ সংরক্ষণ করা সম্ভব হয়নি') };
      }

      return {
        success: true,
        data: {
          id: data.id,
          date: data.transaction_date,
          type: 'expense',
          category: 'salary',
          categoryLabelBn: 'কর্মচারীর বেতন',
          title: data.title,
          amount: Number(data.amount),
          paymentMethod: data.payment_method,
          relatedEmployeeId: data.related_employee_id,
          salaryPeriod: data.salary_period,
          recordedBy: data.recorded_by,
          notes: data.description || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
      };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'বেতন প্রদানে ত্রুটি হয়েছে') };
    }
  },

  // --------------------------------------------------------------------------
  // Tasks
  // --------------------------------------------------------------------------
  async getTasks(userId: string): Promise<RepositoryResult<ReminderTask[]>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('completed', { ascending: true })
        .order('due_date', { ascending: true });

      if (error) {
        return { success: false, error: translateDbError(error, 'কাজের তালিকা লোড করা যায়নি') };
      }

      const tasks: ReminderTask[] = (data || []).map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        dueDate: row.due_date,
        priority: row.priority,
        priorityBn: row.priority_bn,
        category: row.category as any,
        completed: row.completed,
        completedAt: row.completed_at || undefined,
        assignedEmployeeId: row.assigned_employee_id || undefined,
        assignedTo: row.assigned_to || undefined,
        relatedHealthRecordId: row.related_health_record_id || undefined,
        cowId: row.cow_id || undefined,
      }));

      return { success: true, data: tasks };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'কাজের তথ্য আনতে সমস্যা হয়েছে') };
    }
  },

  async addTask(userId: string, task: ReminderTask): Promise<RepositoryResult<ReminderTask>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const payload = {
        user_id: userId,
        title: task.title,
        description: task.description || null,
        due_date: task.dueDate.includes('২০২') ? new Date().toISOString().split('T')[0] : task.dueDate,
        priority: task.priority,
        priority_bn: task.priorityBn,
        category: task.category,
        assigned_employee_id: task.assignedEmployeeId || null,
        assigned_to: task.assignedTo || null,
        completed: task.completed,
        cow_id: task.cowId || null,
        related_health_record_id: task.relatedHealthRecordId || null,
      };

      const { data, error } = await supabase.from('tasks').insert(payload).select().single();

      if (error) {
        return { success: false, error: translateDbError(error, 'কাজ সংরক্ষণ করা সম্ভব হয়নি') };
      }

      return {
        success: true,
        data: {
          id: data.id,
          title: data.title,
          description: data.description || '',
          dueDate: task.dueDate,
          priority: data.priority,
          priorityBn: data.priority_bn,
          category: data.category as any,
          completed: data.completed,
          completedAt: data.completed_at || undefined,
          assignedEmployeeId: data.assigned_employee_id || undefined,
          assignedTo: data.assigned_to || undefined,
          cowId: data.cow_id || undefined,
          relatedHealthRecordId: data.related_health_record_id || undefined,
        },
      };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'কাজ সংরক্ষণে সমস্যা হয়েছে') };
    }
  },

  async toggleTask(
    userId: string,
    taskId: string,
    completed: boolean,
    completionDate?: string
  ): Promise<RepositoryResult<void>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const updatePayload: { completed: boolean; completed_at?: string | null } = {
        completed,
        completed_at: completed ? (completionDate || new Date().toISOString().split('T')[0]) : null,
      };

      const { error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: translateDbError(error, 'কাজের স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে') };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'কাজের স্ট্যাটাস আপডেট করা যায়নি') };
    }
  },

  // --------------------------------------------------------------------------
  // Biogas Logs
  // --------------------------------------------------------------------------
  async getBiogasLogs(userId: string): Promise<RepositoryResult<BiogasDailyLog[]>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const { data, error } = await supabase
        .from('biogas_logs')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: false });

      if (error) {
        return { success: false, error: translateDbError(error, 'বায়োগ্যাস লগ লোড করা যায়নি') };
      }

      const logs: BiogasDailyLog[] = (data || []).map((row) => ({
        id: row.id,
        date: row.log_date,
        dungInputKg: Number(row.dung_quantity_kg),
        waterInputLiters: Number(row.water_quantity_liters),
        gasPressurePsi: row.gas_pressure_psi ? Number(row.gas_pressure_psi) : undefined,
        burnHoursToday: Number(row.burn_duration_hours),
        slurryProducedBags: row.slurry_quantity_bags,
        status: row.status as any,
        statusBn: row.status_bn,
        recordedByEmployeeId: row.recorded_by_employee_id || undefined,
        notes: row.maintenance_notes || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return { success: true, data: logs };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'বায়োগ্যাস তথ্য আনতে সমস্যা হয়েছে') };
    }
  },

  async addBiogasLog(userId: string, log: BiogasDailyLog): Promise<RepositoryResult<BiogasDailyLog>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const payload = {
        user_id: userId,
        log_date: log.date.includes('২০২') ? new Date().toISOString().split('T')[0] : log.date,
        dung_quantity_kg: log.dungInputKg,
        water_quantity_liters: log.waterInputLiters,
        gas_pressure_psi: log.gasPressurePsi ?? 2.0,
        burn_duration_hours: log.burnHoursToday,
        slurry_quantity_bags: log.slurryProducedBags,
        status: log.status,
        status_bn: log.statusBn,
        recorded_by_employee_id: log.recordedByEmployeeId || null,
        maintenance_notes: log.notes || null,
      };

      const { data, error } = await supabase.from('biogas_logs').insert(payload).select().single();

      if (error) {
        return { success: false, error: translateDbError(error, 'বায়োগ্যাস লগ সংরক্ষণ করা সম্ভব হয়নি') };
      }

      return {
        success: true,
        data: {
          id: data.id,
          date: log.date,
          dungInputKg: Number(data.dung_quantity_kg),
          waterInputLiters: Number(data.water_quantity_liters),
          gasPressurePsi: Number(data.gas_pressure_psi),
          burnHoursToday: Number(data.burn_duration_hours),
          slurryProducedBags: data.slurry_quantity_bags,
          status: data.status as any,
          statusBn: data.status_bn,
          recordedByEmployeeId: data.recorded_by_employee_id || undefined,
          notes: data.maintenance_notes || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
      };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'বায়োগ্যাস লগ সংরক্ষণে ত্রুটি') };
    }
  },

  async updateBiogasLog(userId: string, log: BiogasDailyLog): Promise<RepositoryResult<BiogasDailyLog>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const payload = {
        log_date: log.date.includes('২০২') ? new Date().toISOString().split('T')[0] : log.date,
        dung_quantity_kg: log.dungInputKg,
        water_quantity_liters: log.waterInputLiters,
        gas_pressure_psi: log.gasPressurePsi ?? 2.0,
        burn_duration_hours: log.burnHoursToday,
        slurry_quantity_bags: log.slurryProducedBags,
        status: log.status,
        status_bn: log.statusBn,
        recorded_by_employee_id: log.recordedByEmployeeId || null,
        maintenance_notes: log.notes || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('biogas_logs')
        .update(payload)
        .eq('id', log.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: translateDbError(error, 'বায়োগ্যাস লগ আপডেট ব্যর্থ হয়েছে') };
      }

      return {
        success: true,
        data: {
          id: data.id,
          date: log.date,
          dungInputKg: Number(data.dung_quantity_kg),
          waterInputLiters: Number(data.water_quantity_liters),
          gasPressurePsi: Number(data.gas_pressure_psi),
          burnHoursToday: Number(data.burn_duration_hours),
          slurryProducedBags: data.slurry_quantity_bags,
          status: data.status as any,
          statusBn: data.status_bn,
          recordedByEmployeeId: data.recorded_by_employee_id || undefined,
          notes: data.maintenance_notes || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
      };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'বায়োগ্যাস লগ সংশোধনে ত্রুটি') };
    }
  },

  async deleteBiogasLog(userId: string, logId: string): Promise<RepositoryResult<boolean>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const { error } = await supabase
        .from('biogas_logs')
        .delete()
        .eq('id', logId)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: translateDbError(error, 'বায়োগ্যাস লগ মুছে ফেলা যায়নি') };
      }

      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'বায়োগ্যাস লগ অপসারণে সমস্যা হয়েছে') };
    }
  },

  // --------------------------------------------------------------------------
  // Biogas Safety Inspections
  // --------------------------------------------------------------------------
  async getBiogasInspections(userId: string): Promise<RepositoryResult<BiogasInspectionItem[]>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const { data, error } = await supabase
        .from('biogas_inspections')
        .select('*')
        .eq('user_id', userId)
        .order('inspection_date', { ascending: false });

      if (error) {
        return { success: false, error: translateDbError(error, 'বায়োগ্যাস পরিদর্শন রেকর্ড লোড করা যায়নি') };
      }

      const items: BiogasInspectionItem[] = (data || []).map((row) => ({
        id: row.id,
        date: row.inspection_date,
        itemKey: row.item_key as any,
        itemNameBn: row.item_name_bn,
        status: row.status as any,
        statusBn: row.status === 'good' ? 'স্বাভাবিক ও নিরাপদ' : row.status === 'needs_attention' ? 'যত্ন প্রয়োজন' : 'জরুরি পদক্ষেপ আবশ্যক',
        inspectorEmployeeId: row.inspector_employee_id || undefined,
        inspectorName: row.inspector_name || undefined,
        notes: row.notes || undefined,
        nextInspectionDate: row.next_inspection_date || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return { success: true, data: items };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'পরিদর্শন লোড ব্যর্থ') };
    }
  },

  async addBiogasInspection(userId: string, item: BiogasInspectionItem): Promise<RepositoryResult<BiogasInspectionItem>> {
    if (!supabase) {
      return { success: false, error: 'ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।' };
    }

    try {
      const payload = {
        user_id: userId,
        inspection_date: item.date.includes('২০২') ? new Date().toISOString().split('T')[0] : item.date,
        item_key: item.itemKey,
        item_name_bn: item.itemNameBn,
        status: item.status,
        inspector_employee_id: item.inspectorEmployeeId || null,
        inspector_name: item.inspectorName || null,
        notes: item.notes || null,
        next_inspection_date: item.nextInspectionDate || null,
      };

      const { data, error } = await supabase.from('biogas_inspections').insert(payload).select().single();

      if (error) {
        return { success: false, error: translateDbError(error, 'পরিদর্শন রেকর্ড সংরক্ষণ সম্ভব হয়নি') };
      }

      return {
        success: true,
        data: {
          id: data.id,
          date: data.inspection_date,
          itemKey: data.item_key as any,
          itemNameBn: data.item_name_bn,
          status: data.status as any,
          statusBn: data.status === 'good' ? 'স্বাভাবিক ও নিরাপদ' : data.status === 'needs_attention' ? 'যত্ন প্রয়োজন' : 'জরুরি পদক্ষেপ আবশ্যক',
          inspectorEmployeeId: data.inspector_employee_id || undefined,
          inspectorName: data.inspector_name || undefined,
          notes: data.notes || undefined,
          nextInspectionDate: data.next_inspection_date || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
      };
    } catch (err) {
      return { success: false, error: translateDbError(err, 'পরিদর্শন সংরক্ষণে সমস্যা হয়েছে') };
    }
  },
};

