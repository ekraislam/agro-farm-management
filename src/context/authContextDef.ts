import { createContext, useContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { SupabaseConfigStatus } from '../lib/supabase';
import type { AuthResponse } from '../services/authService';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isDemoMode: boolean;
  configStatus: SupabaseConfigStatus;
  farmEmail: string;
  setDemoMode: (isDemo: boolean) => void;
  unlockFarm: (password: string) => Promise<AuthResponse<{ user: User; session: Session }>>;
  signIn: (email: string, password: string) => Promise<AuthResponse<{ user: User; session: Session }>>;
  signUp: (email: string, password: string, ownerName: string, farmName: string) => Promise<AuthResponse<{ user: User | null; session: Session | null }>>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
