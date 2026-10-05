import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEMO_USERS, DEMO_PROFILES, getUserCredits } from '../lib/demo-data';
import type { User, Profile, UserRole } from '../types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isDemo: boolean;
  totalCredits: number;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  demoLogin: (role: UserRole) => void;
  setProfile: (profile: Profile) => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ROLE_USER_MAP: Record<UserRole, string> = {
  student: 'user-student-1',
  organization: 'user-org-1',
  mentor: 'user-mentor-1',
  admin: 'user-admin-1',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    isDemo: false,
    totalCredits: 0,
  });

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      // Check localStorage for demo session
      const demoUserId = localStorage.getItem('researchmesh_demo_user');
      if (demoUserId) {
        const user = DEMO_USERS.find(u => u.id === demoUserId);
        const profile = DEMO_PROFILES.find(p => p.user_id === demoUserId);
        if (user) {
          setState({
            user,
            profile: profile || null,
            loading: false,
            isDemo: true,
            totalCredits: getUserCredits(demoUserId),
          });
          return;
        }
      }

      // Check Supabase session
      if (isSupabaseConfigured() && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Fetch profile from Supabase
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            role: profileData?.role || 'student',
            display_name: profileData?.display_name || session.user.email?.split('@')[0] || '',
            verified: false,
            created_at: session.user.created_at,
          };

          setState({
            user,
            profile: profileData,
            loading: false,
            isDemo: false,
            totalCredits: 0,
          });
          return;
        }
      }

      setState(prev => ({ ...prev, loading: false }));
    };

    checkSession();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      // Fall back to demo mode
      const user = DEMO_USERS.find(u => u.email === email);
      if (user) {
        const profile = DEMO_PROFILES.find(p => p.user_id === user.id);
        localStorage.setItem('researchmesh_demo_user', user.id);
        setState({
          user,
          profile: profile || null,
          loading: false,
          isDemo: true,
          totalCredits: getUserCredits(user.id),
        });
        return;
      }
      throw new Error('Invalid credentials');
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (data.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        role: profileData?.role || 'student',
        display_name: profileData?.display_name || data.user.email?.split('@')[0] || '',
        verified: false,
        created_at: data.user.created_at,
      };

      setState({
        user,
        profile: profileData,
        loading: false,
        isDemo: false,
        totalCredits: 0,
      });
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured. Use demo mode.');
    }
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem('researchmesh_demo_user');
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    setState({ user: null, profile: null, loading: false, isDemo: false, totalCredits: 0 });
  }, []);

  const demoLogin = useCallback((role: UserRole) => {
    const userId = DEMO_ROLE_USER_MAP[role];
    const user = DEMO_USERS.find(u => u.id === userId);
    const profile = DEMO_PROFILES.find(p => p.user_id === userId);
    if (user) {
      localStorage.setItem('researchmesh_demo_user', user.id);
      setState({
        user,
        profile: profile || null,
        loading: false,
        isDemo: true,
        totalCredits: getUserCredits(userId),
      });
    }
  }, []);

  const setProfile = useCallback((profile: Profile) => {
    setState(prev => ({ ...prev, profile }));
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null,
    }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut, demoLogin, setProfile, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
