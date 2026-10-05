import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hexagon, ArrowRight, AlertCircle, Building2, GraduationCap, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
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
  const { signIn, signUp, user, profile } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      if (profile && profile.education || profile?.org_name || profile?.experience) {
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-[#FEF2F2] border border-[#FEE2E2] rounded-lg">
                <AlertCircle size={14} className="text-[#B91C1C] flex-shrink-0" />
                <p className="text-xs text-[#B91C1C]">{error}</p>
              </div>
            )}

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
