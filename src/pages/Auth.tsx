import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hexagon, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import type { UserRole } from '../types';

type AuthTab = 'login' | 'register';

export function Auth() {
  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, demoLogin, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: UserRole) => {
    demoLogin(role);
    navigate('/dashboard');
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
          <Feature text="Policy-aware AI routing for confidential data" />
          <Feature text="SHA-256 tamper-evident contribution ledger" />
          <Feature text="Human approval for all high-impact AI actions" />
          <Feature text="Simulated escrow for funded projects" />
        </div>
        <p className="text-[11px] text-[#475569] mt-6">
          Gardenia 2K26 Hackathon — Prototype
        </p>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px] animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[#0F172A] rounded-lg flex items-center justify-center">
              <Hexagon size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold text-[#0F172A] tracking-tight">ResearchMesh</span>
          </div>

          <h1 className="text-xl font-bold text-[#0F172A]">
            {tab === 'login' ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-sm text-[#64748B] mt-1 mb-6">
            {tab === 'login'
              ? 'Sign in to your ResearchMesh account'
              : 'Get started with ResearchMesh'
            }
          </p>

          {/* Demo login section */}
          <div className="border border-[#E2E8F0] rounded-lg p-4 mb-6 bg-white">
            <p className="text-xs font-semibold text-[#475569] mb-3">Quick demo access</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { role: 'student' as UserRole, label: 'Student', desc: 'Rishaban MP' },
                { role: 'organization' as UserRole, label: 'Organization', desc: 'Nova Biotech' },
                { role: 'mentor' as UserRole, label: 'Mentor', desc: 'Dr. Meera' },
                { role: 'admin' as UserRole, label: 'Admin', desc: 'System Admin' },
              ]).map(({ role, label, desc }) => (
                <button
                  key={role}
                  onClick={() => handleDemoLogin(role)}
                  className="flex flex-col items-start p-3 border border-[#E2E8F0] rounded-lg hover:border-[#CBD5E1] hover:bg-[#F8FAFC] transition-all cursor-pointer text-left"
                >
                  <span className="text-xs font-semibold text-[#0F172A]">{label}</span>
                  <span className="text-[10px] text-[#64748B]">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#E2E8F0]" />
            <span className="text-[11px] text-[#94A3B8] font-medium">
              {supabaseReady ? 'or use email' : 'Supabase not configured'}
            </span>
            <div className="flex-1 h-px bg-[#E2E8F0]" />
          </div>

          {/* Auth form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-[#FEF2F2] border border-[#FEE2E2] rounded-lg">
                <AlertCircle size={14} className="text-[#B91C1C] flex-shrink-0" />
                <p className="text-xs text-[#B91C1C]">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={!supabaseReady}
              />
            </div>

            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={!supabaseReady}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={!supabaseReady}
              icon={<ArrowRight size={16} />}
            >
              {tab === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="text-xs text-[#64748B] text-center mt-4">
            {tab === 'login' ? (
              <>Don't have an account?{' '}
                <button onClick={() => setTab('register')} className="text-[#1D4ED8] font-medium hover:underline cursor-pointer bg-transparent border-none p-0">
                  Register
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => setTab('login')} className="text-[#1D4ED8] font-medium hover:underline cursor-pointer bg-transparent border-none p-0">
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
    <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
      <div className="w-1 h-1 rounded-full bg-[#475569]" />
      {text}
    </div>
  );
}
