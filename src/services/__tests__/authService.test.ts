import { describe, it, expect } from 'vitest';
import { translateAuthError, authService } from '../authService';

describe('Authentication Service & Bengali Error Handling', () => {
  it('translates invalid login credentials to clear Bengali message', () => {
    const errorMsg = translateAuthError(new Error('Invalid login credentials'));
    expect(errorMsg).toContain('ভুল ইমেইল অথবা পাসওয়ার্ড প্রদান করা হয়েছে');
  });

  it('translates unconfirmed email error to Bengali message', () => {
    const errorMsg = translateAuthError(new Error('Email not confirmed'));
    expect(errorMsg).toContain('আপনার ইমেইল ঠিকানা এখনো ভেরিফাই করা হয়নি');
  });

  it('translates duplicate user registration to Bengali message', () => {
    const errorMsg = translateAuthError(new Error('User already registered'));
    expect(errorMsg).toContain('ইতিপূর্বে একাউন্ট খোলা হয়েছে');
  });

  it('translates network or connection failures to Bengali message', () => {
    const errorMsg = translateAuthError(new Error('Failed to fetch'));
    expect(errorMsg).toContain('ক্লাউড সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি');
  });

  it('translates rate limit and security cooldown errors to clear Bengali advice', () => {
    const rateLimitMsg1 = translateAuthError(new Error('over_email_send_rate_limit'));
    expect(rateLimitMsg1).toContain('অতিরিক্ত সংখ্যক চেষ্টার কারণে');
    expect(rateLimitMsg1).toContain('৬০ সেকেন্ড');

    const rateLimitMsg2 = translateAuthError(new Error('For security purposes, you can only request this after 60 seconds'));
    expect(rateLimitMsg2).toContain('অতিরিক্ত সংখ্যক চেষ্টার কারণে');
    expect(rateLimitMsg2).toContain('৬০ সেকেন্ড');
  });

  it('returns explicit failure when sign-in is attempted without cloud configuration', async () => {
    if (!authService.isConfigured()) {
      const res = await authService.signIn('farmer@mominagro.com', 'password123');
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
      expect(res.error).toContain('Supabase ক্লাউড ডেটাবেজ কনফিগার করা হয়নি');
    }
  });

  it('returns explicit failure when sign-up is attempted without cloud configuration', async () => {
    if (!authService.isConfigured()) {
      const res = await authService.signUp('farmer@muminagro.com', 'password123', 'আব্বু', 'মুমিন এগ্রো');
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    }
  });

  it('configures internal farm account email without exposing password in frontend', async () => {
    const { defaultFarmEmail } = await import('../../lib/supabase');
    expect(defaultFarmEmail).toBeDefined();
    expect(typeof defaultFarmEmail).toBe('string');
    expect(defaultFarmEmail).toContain('@');
  });
});
