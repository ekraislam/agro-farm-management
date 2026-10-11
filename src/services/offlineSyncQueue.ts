/**
 * Momin Agro — Offline Sync Queue Manager
 * 
 * Guarantees zero data loss by queuing operations performed while offline
 * and automatically syncing them to Supabase once an internet connection is restored.
 */

import { farmRepository } from './farmRepository';
import type {
  Cow,
  MilkRecord,
  FinancialRecord,
  Employee,
  BiogasDailyLog,
  ReminderTask,
  HealthRecord,
  AttendanceRecord,
  BiogasInspectionItem,
  FarmProfile,
} from '../types/farm';

export type SyncEntityType =
  | 'cow'
  | 'milk'
  | 'finance'
  | 'employee'
  | 'biogas'
  | 'task'
  | 'health'
  | 'attendance'
  | 'inspection'
  | 'profile';

export type SyncAction = 'create' | 'update' | 'delete';

export interface PendingSyncItem {
  id: string;
  entityType: SyncEntityType;
  action: SyncAction;
  data: unknown;
  timestamp: string;
  retryCount: number;
}

const QUEUE_STORAGE_KEY = 'momin_agro_pending_sync_v1';

function readQueue(): PendingSyncItem[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = window.localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PendingSyncItem[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: PendingSyncItem[]): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    }
  } catch (err) {
    console.warn('[SyncQueue] Storage write failed:', err);
  }
}

export const offlineSyncQueue = {
  getPending(): PendingSyncItem[] {
    return readQueue();
  },

  getPendingCount(): number {
    return readQueue().length;
  },

  enqueue(item: Omit<PendingSyncItem, 'timestamp' | 'retryCount'>): void {
    const queue = readQueue();
    // Prevent exact duplicates
    const filtered = queue.filter((q) => q.id !== item.id || q.action !== item.action);
    filtered.push({
      ...item,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    });
    writeQueue(filtered);
  },

  remove(id: string): void {
    const queue = readQueue();
    writeQueue(queue.filter((q) => q.id !== id));
  },

  clear(): void {
    writeQueue([]);
  },

  /**
   * Process all queued items when internet connection is restored
   * Returns count of successfully synced items
   */
  async processQueue(userId: string): Promise<{ syncedCount: number; remainingCount: number }> {
    const queue = readQueue();
    if (queue.length === 0) return { syncedCount: 0, remainingCount: 0 };

    let syncedCount = 0;
    const remaining: PendingSyncItem[] = [];

    for (const item of queue) {
      try {
        let success = false;

        switch (item.entityType) {
          case 'cow': {
            const cow = item.data as Cow;
            if (item.action === 'create') {
              const res = await farmRepository.addCow(userId, cow);
              success = res.success;
            } else if (item.action === 'update') {
              const res = await farmRepository.updateCow(userId, cow);
              success = res.success;
            } else if (item.action === 'delete') {
              const res = await farmRepository.deleteOrArchiveCow(userId, cow.id);
              success = res.success;
            }
            break;
          }

          case 'milk': {
            const milk = item.data as MilkRecord;
            if (item.action === 'create') {
              const res = await farmRepository.addMilkRecord(userId, milk);
              success = res.success;
            } else if (item.action === 'update') {
              const res = await farmRepository.updateMilkRecord(userId, milk);
              success = res.success;
            } else if (item.action === 'delete') {
              const res = await farmRepository.deleteMilkRecord(userId, milk.id);
              success = res.success;
            }
            break;
          }

          case 'finance': {
            const fin = item.data as FinancialRecord;
            if (item.action === 'create') {
              const res = await farmRepository.addFinancialTransaction(userId, fin);
              success = res.success;
            } else if (item.action === 'update') {
              const res = await farmRepository.updateFinancialTransaction(userId, fin);
              success = res.success;
            } else if (item.action === 'delete') {
              const res = await farmRepository.deleteFinancialTransaction(userId, fin.id);
              success = res.success;
            }
            break;
          }

          case 'employee': {
            const emp = item.data as Employee;
            if (item.action === 'create') {
              const res = await farmRepository.addEmployee(userId, emp);
              success = res.success;
            } else if (item.action === 'update') {
              const res = await farmRepository.updateEmployee(userId, emp);
              success = res.success;
            } else if (item.action === 'delete') {
              const res = await farmRepository.deleteOrArchiveEmployee(userId, emp.id);
              success = res.success;
            }
            break;
          }

          case 'biogas': {
            const bio = item.data as BiogasDailyLog;
            if (item.action === 'create') {
              const res = await farmRepository.addBiogasLog(userId, bio);
              success = res.success;
            }
            break;
          }

          case 'task': {
            const task = item.data as ReminderTask;
            if (item.action === 'create') {
              const res = await farmRepository.addTask(userId, task);
              success = res.success;
            } else if (item.action === 'update') {
              const res = await farmRepository.updateTask(userId, task);
              success = res.success;
            } else if (item.action === 'delete') {
              const res = await farmRepository.deleteTask(userId, task.id);
              success = res.success;
            }
            break;
          }

          case 'health': {
            const health = item.data as HealthRecord;
            if (item.action === 'create') {
              const res = await farmRepository.addHealthRecord(userId, health, false);
              success = res.success;
            }
            break;
          }

          case 'attendance': {
            const att = item.data as AttendanceRecord;
            if (item.action === 'create') {
              const res = await farmRepository.recordAttendance(userId, att);
              success = res.success;
            }
            break;
          }

          case 'inspection': {
            const insp = item.data as BiogasInspectionItem;
            if (item.action === 'create' || item.action === 'update') {
              const res = await farmRepository.addBiogasInspection(userId, insp);
              success = res.success;
            }
            break;
          }

          case 'profile': {
            const prof = item.data as FarmProfile;
            const res = await farmRepository.updateFarmProfile(userId, prof);
            success = res.success;
            break;
          }
        }

        if (success) {
          syncedCount++;
        } else {
          remaining.push({ ...item, retryCount: item.retryCount + 1 });
        }
      } catch (err) {
        console.warn(`[SyncQueue] Failed to sync ${item.entityType}:${item.id}`, err);
        remaining.push({ ...item, retryCount: item.retryCount + 1 });
      }
    }

    writeQueue(remaining);
    return { syncedCount, remainingCount: remaining.length };
  },
};
