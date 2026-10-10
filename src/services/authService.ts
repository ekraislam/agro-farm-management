import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Translates standard Supabase Auth errors into clear, friendly Bengali messages
 */
export const translateAuthError = (error: AuthError | Error | null | unknown): string => {
  if (!error) return 'একটি অজানা ত্রুটি ঘটেছে।';
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return 'ভুল ইমেইল অথবা পাসওয়ার্ড প্রদান করা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
  }
  if (message.includes('email not confirmed')) {
    return 'আপনার ইমেইল ঠিকানা এখনো ভেরিফাই করা হয়নি। দয়া করে আপনার ইনবক্স চেক করুন।';
  }
  if (message.includes('user already registered') || message.includes('already exists')) {
    return 'এই ইমেইল দিয়ে ইতিপূর্বে একাউন্ট খোলা হয়েছে। অনুগ্রহ করে লগইন করুন।';
  }
  if (message.includes('password should be at least')) {
    return 'পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।';
  }
  if (message.includes('network') || message.includes('failed to fetch')) {
    return 'ক্লাউড সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। ইন্টারনেট সংযোগ বা Supabase URL পরীক্ষা করুন।';
  }
  if (message.includes('rate limit')) {
    return 'অতিরিক্ত সংখ্যক চেষ্টার কারণে সাময়িকভাবে ব্লক করা হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।';
  }

  return error instanceof Error ? error.message : 'লগইন প্রক্রিয়ায় সমস্যা হয়েছে।';
};

export const authService = {
  isConfigured(): boolean {
    return isSupabaseConfigured && supabase !== null;
  },

  async getSession(): Promise<Session | null> {
    if (!supabase) return null;
    try {
      const { data } = await supabase.auth.getSession();
      return data.session;
    } catch {
      return null;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    if (!supabase) return null;
    try {
      const { data } = await supabase.auth.getUser();
      return data.user;
    } catch {
      return null;
    }
  },

  async signIn(email: string, password: string): Promise<AuthResponse<{ user: User; session: Session }>> {
    if (!supabase) {
      return {
        success: false,
        error: 'Supabase ক্লাউড ডেটাবেজ কনফিগার করা হয়নি। ডেমো মোড ব্যবহার করুন অথবা .env ফাইলে ক্রেডেনশিয়াল দিন।',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return {
          success: false,
          error: translateAuthError(error),
        };
      }

      if (!data.user || !data.session) {
        return {
          success: false,
          error: 'ব্যবহারকারীর তথ্য পাওয়া যায়নি।',
        };
      }

      return {
        success: true,
        data: { user: data.user, session: data.session },
      };
    } catch (err) {
      return {
        success: false,
        error: translateAuthError(err),
      };
    }
  },

  async signUp(
    email: string,
    password: string,
    ownerName: string,
    farmName: string
  ): Promise<AuthResponse<{ user: User | null; session: Session | null }>> {
    if (!supabase) {
      return {
        success: false,
        error: 'Supabase ক্লাউড ডেটাবেজ কনফিগার করা হয়নি।',
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            owner_name: ownerName.trim() || 'মো: মুমিনুল হক (আব্বু)',
            farm_name: farmName.trim() || 'মুমিন এগ্রো',
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: translateAuthError(error),
        };
      }

      // If user registered and session created, insert default farm profile
      if (data.user) {
        try {
          await supabase.from('farm_profiles').upsert({
            user_id: data.user.id,
            farm_name: farmName.trim() || 'মুমিন এগ্রো',
            owner_name: ownerName.trim() || 'মো: মুমিনুল হক (আব্বু)',
            default_milk_rate: 80,
            dairy_capacity: 10,
          });
        } catch {
          // If table trigger handled or fails, auth still succeeds
        }
      }

      return {
        success: true,
        data: { user: data.user, session: data.session },
      };
    } catch (err) {
      return {
        success: false,
        error: translateAuthError(err),
      };
    }
  },

  async signOut(): Promise<AuthResponse<void>> {
    if (!supabase) {
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return {
          success: false,
          error: translateAuthError(error),
        };
      }
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: translateAuthError(err),
      };
    }
  },
};
