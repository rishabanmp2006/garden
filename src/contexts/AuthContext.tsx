import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authRegister, authLogin, authProfile, syncUserProfile } from '../lib/api';
import type { User, Profile, UserRole } from '../types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  totalCredits: number;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: UserRole, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_SESSION_KEY = 'researchmesh_auth_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalCredits, setTotalCredits] = useState(0);

  // Fetch verified credits sum for the user from Supabase
  const fetchCreditsSupabase = async (userId: string) => {
    if (!supabase) return 0;
    try {
      const { data, error } = await supabase
        .from('credits')
        .select('amount')
        .eq('user_id', userId);
      if (error || !data) return 0;
      return data.reduce((sum: number, c: { amount: number }) => sum + c.amount, 0);
    } catch {
      return 0;
    }
  };

  // Fetch profile for an authenticated user ID from Supabase
  const fetchUserProfileSupabase = async (userId: string) => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }
      return data as Profile | null;
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      return null;
    }
  };

  // Initialize session on mount and listen to auth changes
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isSupabaseConfigured() && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const profileData = await fetchUserProfileSupabase(session.user.id);
            const creditsSum = await fetchCreditsSupabase(session.user.id);

            const appUser: User = {
              id: session.user.id,
              email: session.user.email || '',
              role: profileData?.role || (session.user.user_metadata?.role as UserRole) || 'student',
              display_name: profileData?.display_name || session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'User',
              verified: profileData?.verified || false,
              created_at: session.user.created_at,
            };

            setUser(appUser);
            setProfile(profileData);
            setTotalCredits(creditsSum);
          } else {
            setUser(null);
            setProfile(null);
            setTotalCredits(0);
          }
        } else {
          // Local/Backend mode: restore session from persistent storage
          const stored = localStorage.getItem(LOCAL_SESSION_KEY);
          if (stored) {
            try {
              const sessionUser = JSON.parse(stored);
              const data = await authProfile(sessionUser.id);
              if (data && data.user) {
                setUser(data.user);
                setProfile(data.profile);
                setTotalCredits(data.total_credits || 0);
              }
            } catch (e) {
              console.warn('Failed to restore local session:', e);
              localStorage.removeItem(LOCAL_SESSION_KEY);
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes if Supabase is active
    if (isSupabaseConfigured() && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const profileData = await fetchUserProfileSupabase(session.user.id);
          const creditsSum = await fetchCreditsSupabase(session.user.id);

          const appUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            role: profileData?.role || (session.user.user_metadata?.role as UserRole) || 'student',
            display_name: profileData?.display_name || session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'User',
            verified: profileData?.verified || false,
            created_at: session.user.created_at,
          };

          setUser(appUser);
          setProfile(profileData);
          setTotalCredits(creditsSum);
        } else {
          setUser(null);
          setProfile(null);
          setTotalCredits(0);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        const profileData = await fetchUserProfileSupabase(data.user.id);
        const creditsSum = await fetchCreditsSupabase(data.user.id);

        const appUser: User = {
          id: data.user.id,
          email: data.user.email || '',
          role: profileData?.role || (data.user.user_metadata?.role as UserRole) || 'student',
          display_name: profileData?.display_name || data.user.user_metadata?.display_name || data.user.email?.split('@')[0] || 'User',
          verified: profileData?.verified || false,
          created_at: data.user.created_at,
        };

        setUser(appUser);
        setProfile(profileData);
        setTotalCredits(creditsSum);

        // Sync with backend SQLite
        syncUserProfile(data.user.id, {
          email: data.user.email,
          role: appUser.role,
          display_name: appUser.display_name,
        }).catch(() => {});
      }
    } else {
      // Backend direct authentication
      const res = await authLogin({ email, password });
      setUser(res.user);
      setProfile(res.profile);
      setTotalCredits(res.total_credits || 0);
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(res.user));
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, role: UserRole, displayName: string) => {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            display_name: displayName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create or ensure profile row in public.profiles
        const { data: insertedProfile, error: profileErr } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            role,
            display_name: displayName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (profileErr) {
          console.warn('Profile upsert note:', profileErr.message);
        }

        const appUser: User = {
          id: data.user.id,
          email: data.user.email || '',
          role,
          display_name: displayName,
          verified: false,
          created_at: data.user.created_at,
        };

        setUser(appUser);
        setProfile(insertedProfile || null);
        setTotalCredits(0);

        // Sync with backend SQLite
        syncUserProfile(data.user.id, {
          email: data.user.email,
          role,
          display_name: displayName,
        }).catch(() => {});
      }
    } else {
      // Backend direct registration
      const res = await authRegister({
        email,
        password,
        role,
        display_name: displayName,
      });

      setUser(res.user);
      setProfile(res.profile);
      setTotalCredits(0);
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(res.user));
    }
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(LOCAL_SESSION_KEY);
    setUser(null);
    setProfile(null);
    setTotalCredits(0);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    if (isSupabaseConfigured() && supabase) {
      const profileData = await fetchUserProfileSupabase(user.id);
      const creditsSum = await fetchCreditsSupabase(user.id);
      if (profileData) {
        setProfile(profileData);
        setUser(prev => prev ? {
          ...prev,
          role: profileData.role || prev.role,
          display_name: profileData.display_name || prev.display_name,
          verified: profileData.verified !== undefined ? Boolean(profileData.verified) : prev.verified,
        } : null);
      }
      setTotalCredits(creditsSum);
    } else {
      try {
        const res = await authProfile(user.id);
        if (res && res.user) {
          setUser(res.user);
          setProfile(res.profile);
          setTotalCredits(res.total_credits || 0);
        }
      } catch (err) {
        console.error('Failed to refresh profile:', err);
      }
    }
  }, [user]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return;
    if (isSupabaseConfigured() && supabase) {
      // Use upsert to guarantee persistence whether the row exists or is being initialized
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase profile persistence error:', error);
        throw error;
      }

      if (data) {
        setProfile(data as Profile);
        setUser(prev => prev ? {
          ...prev,
          display_name: data.display_name || prev.display_name,
          role: (data.role as UserRole) || prev.role,
          verified: data.verified !== undefined ? data.verified : prev.verified,
        } : null);
      }
    }

    // Attempt optional FastAPI SQLite backend synchronization
    try {
      const backendPayload = {
        ...updates,
        domains: Array.isArray(updates.domains) ? updates.domains.join(', ') : updates.domains,
      };
      await syncUserProfile(user.id, backendPayload);
    } catch (e) {
      console.warn('Backend SQLite profile sync note:', e);
    } finally {
      // Guarantee refresh from Supabase to keep state in sync with database
      await refreshProfile();
    }
  }, [user, refreshProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        totalCredits,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
