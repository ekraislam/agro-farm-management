import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { 
  INITIAL_COWS, 
  INITIAL_MILK_RECORDS, 
  INITIAL_FINANCIAL_RECORDS, 
  INITIAL_EMPLOYEES, 
  INITIAL_BIOGAS_LOGS, 
  INITIAL_REMINDERS 
} from '../../data/demoData';

describe('Demo Data Isolation & Database Migration Schema', () => {
  it('maintains pure and separate demo data records for Phase 1 preview', () => {
    expect(INITIAL_COWS.length).toBeGreaterThan(0);
    expect(INITIAL_MILK_RECORDS.length).toBeGreaterThan(0);
    expect(INITIAL_FINANCIAL_RECORDS.length).toBeGreaterThan(0);
    expect(INITIAL_EMPLOYEES.length).toBe(2);
    expect(INITIAL_BIOGAS_LOGS.length).toBeGreaterThan(0);
    expect(INITIAL_REMINDERS.length).toBeGreaterThan(0);

    // Verify demo cows are not empty
    expect(INITIAL_COWS[0].tagNumber).toBeDefined();
    expect(INITIAL_COWS[0].name).toBeDefined();
  });

  it('verifies that SQL migration file exists and enforces Row Level Security (RLS)', () => {
    const migrationPath = resolve(process.cwd(), 'supabase/migrations/20261010000000_initial_schema.sql');
    expect(existsSync(migrationPath)).toBe(true);

    const sqlContent = readFileSync(migrationPath, 'utf-8');

    // Verify all 7 core tables exist
    const tables = [
      'farm_profiles',
      'cows',
      'milk_records',
      'financial_transactions',
      'employees',
      'tasks',
      'biogas_logs',
    ];

    for (const table of tables) {
      expect(sqlContent).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
      expect(sqlContent).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    }

    // Verify user tenant isolation in RLS policies
    expect(sqlContent).toContain('auth.uid() = user_id');
  });
});
