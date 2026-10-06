import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hexagon, ArrowRight, AlertCircle, Building2, GraduationCap, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserRole } from '../types';

type AuthTab = 'login' | 'register';

export function Auth() {
  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp, user, profile } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      if (profile && (profile.education || profile?.org_name || profile?.experience)) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  }, [user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'login') {
        await signIn(email, password);
        navigate('/dashboard');
      } else {
        if (!displayName.trim()) {
          throw new Error('Please enter your full name or organization name.');
        }
        await signUp(email, password, selectedRole, displayName.trim());
        navigate('/onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!supabase) return;
    setError('');
    setGoogleLoading(true);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });

      if (oauthError) {
        throw oauthError;
      }
      // Browser will redirect to Google — no further action needed here.
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const supabaseReady = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-[480px] bg-[#0F172A] text-white flex-col justify-between p-10">
        <div>
          <div className="flex items-center gap-2 mb-16">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <Hexagon size={16} />
            </div>
            <span className="text-sm font-bold tracking-tight">ResearchMesh</span>
          </div>
          <h2 className="text-2xl font-bold leading-tight">
            Private AI.<br />
            Verified contribution.<br />
            Fair research.
          </h2>
          <p className="text-sm text-[#94A3B8] mt-4 leading-relaxed max-w-[340px]">
            A collaborative research platform where AI is a controlled team member,
            contributions are hash-chained, and credit is earned — not assumed.
          </p>
        </div>

        <div className="space-y-3">
          <Feature text="Role-governed research workspaces with signed charters" />
          <Feature text="Policy-aware AI routing: air-gap isolation for sensitive data" />
          <Feature text="Cryptographic SHA-256 tamper-evident provenance ledger" />
          <Feature text="Simulated multi-sig escrow with meritocratic credit release" />
        </div>

        <p className="text-[11px] text-[#475569] mt-6">
          Gardenia 2K26 Hackathon Prototype — Multi-User Verified
        </p>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[420px] animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[#0F172A] rounded-lg flex items-center justify-center">
              <Hexagon size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold text-[#0F172A] tracking-tight">ResearchMesh</span>
          </div>

          <h1 className="text-xl font-bold text-[#0F172A]">
            {tab === 'login' ? 'Sign in to ResearchMesh' : 'Create your Researcher Account'}
          </h1>
          <p className="text-xs text-[#64748B] mt-1 mb-6">
            {tab === 'login'
              ? 'Access your governed project workspaces and verified research credentials.'
              : 'Register to collaborate on confidential research with provenance tracking.'}
          </p>

          {!supabaseReady && (
            <div className="mb-6 p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-xs text-[#92400E] space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle size={14} /> Supabase Configuration Required
              </p>
              <p>
                To enable multi-device authentication across all 4 laptops, configure your Supabase URL
                and Anon Key in the <code>.env</code> file:
              </p>
              <code className="block bg-[#FEF3C7] p-2 rounded text-[11px] font-mono mt-1 break-all">
                VITE_SUPABASE_URL=https://your-project.supabase.co<br />
                VITE_SUPABASE_ANON_KEY=your-anon-key
              </code>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-[#FEF2F2] border border-[#FEE2E2] rounded-lg">
              <AlertCircle size={14} className="text-[#B91C1C] flex-shrink-0" />
              <p className="text-xs text-[#B91C1C]">{error}</p>
            </div>
          )}

          {/* Google OAuth Button */}
          {supabaseReady && (
            <div className="mb-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] hover:border-[#94A3B8] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-[#1D4ED8] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 2.58z" fill="#EA4335"/>
                  </svg>
                )}
                Continue with Google
              </button>
            </div>
          )}

          {/* Divider */}
          {supabaseReady && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[#E2E8F0]" />
              <span className="text-[11px] text-[#94A3B8] font-medium uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-[#E2E8F0]" />
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                    Account Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('student')}
                      className={`p-2.5 rounded-lg border text-xs flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                        selectedRole === 'student'
                          ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8] font-bold'
                          : 'border-[#CBD5E1] text-[#64748B] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <GraduationCap size={16} />
                      <span>Student</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('organization')}
                      className={`p-2.5 rounded-lg border text-xs flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                        selectedRole === 'organization'
                          ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8] font-bold'
                          : 'border-[#CBD5E1] text-[#64748B] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <Building2 size={16} />
                      <span>Organization</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('mentor')}
                      className={`p-2.5 rounded-lg border text-xs flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                        selectedRole === 'mentor'
                          ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8] font-bold'
                          : 'border-[#CBD5E1] text-[#64748B] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <ShieldCheck size={16} />
                      <span>Mentor</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1.5" htmlFor="displayName">
                    {selectedRole === 'organization' ? 'Organization Name' : 'Full Name'}
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={selectedRole === 'organization' ? 'e.g., Nova Biotech Labs' : 'e.g., Rishaban MP'}
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5" htmlFor="email">
                Institutional / Corporate Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu or name@organization.org"
                required
                className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
              />
            </div>

            <Button
              type="submit"
              className="w-full justify-center"
              loading={loading}
              disabled={!supabaseReady || loading}
              icon={<ArrowRight size={16} />}
            >
              {tab === 'login' ? 'Sign In' : 'Create Account & Continue'}
            </Button>
          </form>

          <p className="text-xs text-[#64748B] text-center mt-6">
            {tab === 'login' ? (
              <>
                New to ResearchMesh?{' '}
                <button
                  type="button"
                  onClick={() => { setTab('register'); setError(''); }}
                  className="text-[#1D4ED8] font-semibold hover:underline cursor-pointer bg-transparent border-none p-0"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setTab('login'); setError(''); }}
                  className="text-[#1D4ED8] font-semibold hover:underline cursor-pointer bg-transparent border-none p-0"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-xs text-[#94A3B8]">
      <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
      <span>{text}</span>
    </div>
  );
}
