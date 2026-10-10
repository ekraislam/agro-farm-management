import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Read public environment variables safely
const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = typeof rawUrl === 'string' ? rawUrl.trim() : '';
const supabaseAnonKey = typeof rawAnonKey === 'string' ? rawAnonKey.trim() : '';

// Verify that the credentials are valid and not defaults/placeholders
const isPlaceholderUrl =
  !supabaseUrl ||
  supabaseUrl.includes('your-project-id') ||
  supabaseUrl.includes('example.com') ||
  !supabaseUrl.startsWith('http');

const isPlaceholderKey =
  !supabaseAnonKey ||
  supabaseAnonKey.includes('your-supabase-anon-key') ||
  supabaseAnonKey.length < 20;

export const isSupabaseConfigured: boolean = Boolean(!isPlaceholderUrl && !isPlaceholderKey);

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  url: string | null;
  hasAnonKey: boolean;
  reason?: string;
}

export const getSupabaseConfigStatus = (): SupabaseConfigStatus => {
  if (!supabaseUrl) {
    return {
      isConfigured: false,
      url: null,
      hasAnonKey: false,
      reason: 'VITE_SUPABASE_URL কনফিগার করা হয়নি।',
    };
  }
  if (isPlaceholderUrl) {
    return {
      isConfigured: false,
      url: supabaseUrl,
      hasAnonKey: Boolean(supabaseAnonKey),
      reason: 'VITE_SUPABASE_URL-এ ডামি বা প্লেসহোল্ডার মান রয়েছে।',
    };
  }
  if (!supabaseAnonKey || isPlaceholderKey) {
    return {
      isConfigured: false,
      url: supabaseUrl,
      hasAnonKey: false,
      reason: 'VITE_SUPABASE_ANON_KEY কনফিগার করা হয়নি বা প্লেসহোল্ডার মান রয়েছে।',
    };
  }

  return {
    isConfigured: true,
    url: supabaseUrl,
    hasAnonKey: true,
  };
};

/**
 * Initialized Supabase Client with full TypeScript Database schema
 * Returns null if environment variables are not configured, preserving honest Demo Mode.
 */
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
