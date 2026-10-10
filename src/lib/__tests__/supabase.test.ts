import { describe, it, expect } from 'vitest';
import { isSupabaseConfigured, getSupabaseConfigStatus, supabase } from '../supabase';

describe('Supabase Client & Environment Configuration', () => {
  it('gracefully handles missing or placeholder environment variables', () => {
    // When run in local test without real credentials
    const status = getSupabaseConfigStatus();
    expect(status).toBeDefined();
    expect(typeof status.isConfigured).toBe('boolean');

    if (!isSupabaseConfigured) {
      expect(supabase).toBeNull();
      expect(status.isConfigured).toBe(false);
      expect(status.reason).toBeDefined();
    }
  });

  it('preserves honest Demo Mode without faking a cloud connection', () => {
    // Ensure that if credentials are not configured, the app does not invent fake clients
    if (!isSupabaseConfigured) {
      expect(supabase).toBeNull();
    }
  });
});
