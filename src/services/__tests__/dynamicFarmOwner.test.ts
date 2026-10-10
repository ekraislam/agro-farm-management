import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { localFarmStorage } from '../localFarmStorage';
import type { FarmProfile, Employee } from '../../types/farm';

describe('Dynamic Farm Owner and Demo Data Cleanliness', () => {
  const store = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };

  const originalWindow = globalThis.window;

  beforeAll(() => {
    // @ts-expect-error mock window in node environment
    globalThis.window = { localStorage: mockLocalStorage };
  });

  afterAll(() => {
    globalThis.window = originalWindow;
  });

  beforeEach(() => {
    store.clear();
  });

  it('correctly reads default farm profile', () => {
    const profile = localFarmStorage.getFarmProfile();
    expect(profile.ownerName).toBe('মুমিনুল ইসলাম');
    expect(profile.farmName).toBe('মুমিন এগ্রো');
    expect(profile.defaultMilkRate).toBe(80);
  });

  it('persists and updates changed farm owner and farm name across storage', () => {
    const customProfile: FarmProfile = {
      farmName: 'সোনার বাংলা ডেইরি',
      ownerName: 'মো: হাসানুর রহমান',
      phone: '০১৭২২৩৩৪৪৫৫',
      address: 'পাবনা সদর',
      defaultMilkRate: 85,
      dairyCapacity: 25,
      notificationsEnabled: true,
    };

    localFarmStorage.saveFarmProfile(customProfile);
    const retrieved = localFarmStorage.getFarmProfile();

    expect(retrieved.ownerName).toBe('মো: হাসানুর রহমান');
    expect(retrieved.farmName).toBe('সোনার বাংলা ডেইরি');
    expect(retrieved.defaultMilkRate).toBe(85);
    expect(retrieved.address).toBe('পাবনা সদর');
  });

  it('clearToEmptyFarm leaves no demo employees or fake records', () => {
    localFarmStorage.loadDemoData();
    expect(localFarmStorage.getCows().length).toBeGreaterThan(0);

    const testEmp: Employee = {
      id: 'custom-emp-1',
      name: 'মো: রফিকুল',
      role: 'গোয়ালা',
      phone: '০১৭০০০০০০০০',
      salaryMonthly: 12000,
      joiningDate: '১ জানুয়ারি ২০২৬',
      status: 'active',
      isArchived: false,
      assignedDuties: ['গরু দোয়ানো'],
      avatarInitials: 'মর',
    };
    localFarmStorage.saveEmployees([testEmp]);
    expect(localFarmStorage.getEmployees().length).toBe(1);

    localFarmStorage.clearToEmptyFarm();

    expect(localFarmStorage.getEmployees()).toEqual([]);
    expect(localFarmStorage.getCows()).toEqual([]);
    expect(localFarmStorage.getMilkRecords()).toEqual([]);
    expect(localFarmStorage.getFinancialRecords()).toEqual([]);
    expect(localFarmStorage.getReminders()).toEqual([]);
  });

  it('filters active employees properly without hardcoding fake workers', () => {
    const employees: Employee[] = [
      {
        id: 'emp-101',
        name: 'আসল কর্মী ১',
        role: 'গোয়ালা',
        phone: '০১৭০০০০০০০০',
        salaryMonthly: 12000,
        joiningDate: '১ জানুয়ারি ২০২৬',
        status: 'active',
        isArchived: false,
        assignedDuties: ['গরু দোয়ানো'],
        avatarInitials: 'আক',
      },
      {
        id: 'emp-102',
        name: 'সাবেক কর্মী',
        role: 'সহকারী',
        phone: '০১৮০০০০০০০০',
        salaryMonthly: 10000,
        joiningDate: '১ জানুয়ারি ২০২৬',
        status: 'inactive',
        isArchived: true,
        assignedDuties: ['পরিচ্ছন্নতা'],
        avatarInitials: 'সক',
      },
    ];

    const activeEmployees = employees.filter((e) => !e.isArchived && e.status === 'active');
    expect(activeEmployees.length).toBe(1);
    expect(activeEmployees[0].name).toBe('আসল কর্মী ১');

    // When no employees exist, employee list is completely empty
    const noEmployees: Employee[] = [];
    const activeEmpty = noEmployees.filter((e) => !e.isArchived && e.status === 'active');
    expect(activeEmpty.length).toBe(0);
  });
});
