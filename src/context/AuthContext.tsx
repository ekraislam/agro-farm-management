import React, { useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, getSupabaseConfigStatus } from '../lib/supabase';
import { authService, type AuthResponse } from '../services/authService';
import { AuthContext } from './authContextDef';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [isDemoMode, setIsDemoMode] = useState(!isSupabaseConfigured);

  const configStatus = getSupabaseConfigStatus();

  useEffect(() => {
    // If Supabase is not configured, state is already initialized for Demo Mode
    if (!supabase || !isSupabaseConfigured) {
      return;
    }

    // Check active session on mount
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setIsDemoMode(false);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsDemoMode(false);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async (
    email: string,
    password: string
  ): Promise<AuthResponse<{ user: User; session: Session }>> => {
    setLoading(true);
    const res = await authService.signIn(email, password);
    setLoading(false);
    if (res.success && res.data) {
      setUser(res.data.user);
      setSession(res.data.session);
      setIsDemoMode(false);
    }
    return res;
  };

  const handleSignUp = async (
    email: string,
    password: string,
    ownerName: string,
    farmName: string
  ): Promise<AuthResponse<{ user: User | null; session: Session | null }>> => {
    setLoading(true);
    const res = await authService.signUp(email, password, ownerName, farmName);
    setLoading(false);
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      setSession(res.data.session);
      setIsDemoMode(false);
    }
    return res;
  };

  const handleSignOut = async (): Promise<void> => {
    setLoading(true);
    await authService.signOut();
    setUser(null);
    setSession(null);
    setIsDemoMode(true);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        isDemoMode,
        configStatus,
        setDemoMode: setIsDemoMode,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
