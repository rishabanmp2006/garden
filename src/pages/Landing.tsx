import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Hexagon, Search, Plus, Shield, Lock,
  CheckCircle2, MessageSquare, Check
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'discussions' | 'tasks' | 'files' | 'overview'>('discussions');

  const handlePostProblem = () => {
    if (user) {
      navigate('/projects/create');
    } else {
      navigate('/auth');
    }
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const scrollToSecurity = () => {
    const el = document.getElementById('security');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0F172A] flex flex-col font-sans antialiased selection:bg-[#DBEAFE] selection:text-[#1D4ED8]">
      {/* 1. NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xs border-b border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-6 h-6 bg-[#0F172A] rounded-md flex items-center justify-center text-white">
              <Hexagon size={13} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold tracking-tight text-[#0F172A]">ResearchMesh</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-6 text-xs text-[#64748B]">
            <button
              onClick={() => navigate('/projects')}
              className="hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              Explore Research
            </button>
            <button
              onClick={scrollToSecurity}
              className="hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              Security
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <Button size="sm" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                  Sign in
                </Button>
                <Button size="sm" onClick={handleGetStarted}>
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO */}
      <main className="flex-1 flex flex-col items-center justify-start pt-16 sm:pt-20 pb-16 px-6">
        <div className="max-w-3xl w-full mx-auto text-center space-y-6">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-[#475569] bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
            Trusted research collaboration
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#0F172A] leading-[1.12]">
            Research teams, connected by trust.
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-[#64748B] max-w-xl mx-auto leading-relaxed font-normal">
            Connect organizations, researchers and mentors in secure workspaces built for collaborative research.
          </p>

          {/* Hero CTAs */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button size="md" onClick={() => navigate('/projects')} icon={<Search size={15} />}>
              Explore Research
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handlePostProblem}
              icon={<Plus size={15} />}
            >
              Post a Research Problem
            </Button>
          </div>
        </div>

        {/* PRODUCT PREVIEW */}
        <div className="w-full max-w-3xl mt-12 sm:mt-16">
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs overflow-hidden text-left">
            {/* Workspace Header Strip */}
            <div className="p-5 border-b border-[#F1F5F9] bg-[#FAFAFA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-medium text-[#64748B] block uppercase tracking-wider">
                  Research Workspace
                </span>
                <h3 className="text-base font-semibold text-[#0F172A] mt-0.5">
                  Low-cost diabetic retinopathy detection
                </h3>
              </div>

              {/* Roster stats */}
              <div className="flex items-center gap-4 text-xs text-[#64748B] shrink-0">
                <span>
                  Team: <strong className="text-[#0F172A] font-semibold">5</strong>
                </span>
                <span className="text-[#E2E8F0]">•</span>
                <span>
                  Milestones: <strong className="text-[#0F172A] font-semibold">3</strong>
                </span>
                <span className="text-[#E2E8F0]">•</span>
                <span>
                  Contributions: <strong className="text-[#0F172A] font-semibold">18</strong>
                </span>
              </div>
            </div>

            {/* Quiet Workspace Navigation Tabs */}
            <div className="px-5 border-b border-[#F1F5F9] flex items-center gap-6 text-xs bg-white">
              {(['overview', 'tasks', 'files', 'discussions'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2.5 font-medium border-b-2 capitalize transition-colors cursor-pointer ${
                    activeTab === tab
                      ? 'border-[#1D4ED8] text-[#1D4ED8]'
                      : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Workspace Preview Content */}
            <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-6 bg-white">
              {/* Left: Small Discussion Panel */}
              <div className="md:col-span-7 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#475569]">
                  <MessageSquare size={13} className="text-[#64748B]" />
                  <span>Team Discussion</span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Expert message */}
                  <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E8F0] space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#0F172A]">Dr. Marcus Vance</span>
                      <span className="text-[#94A3B8]">Expert / Mentor</span>
                    </div>
                    <p className="text-[#475569] leading-relaxed">
                      "Try benchmarking MobileNetV3 against the current baseline."
                    </p>
                  </div>

                  {/* Student message */}
                  <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E8F0] space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#0F172A]">Rishaban MP</span>
                      <span className="text-[#94A3B8]">Student Researcher</span>
                    </div>
                    <p className="text-[#475569] leading-relaxed">
                      "I've uploaded the first benchmark results."
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Small Activity & Status Indicator */}
              <div className="md:col-span-5 md:border-l md:border-[#F1F5F9] md:pl-6 space-y-3">
                <span className="text-xs font-semibold text-[#475569] block">
                  Workspace Status
                </span>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 text-[#334155]">
                    <CheckCircle2 size={13} className="text-[#15803D] shrink-0" />
                    <span>Contribution verified</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#334155]">
                    <Check size={13} className="text-[#15803D] shrink-0" />
                    <span>Methodology reviewed</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#334155]">
                    <Lock size={12} className="text-[#B45309] shrink-0" />
                    <span>Confidential dataset protected</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F1F5F9]">
                  <div className="text-[11px] text-[#64748B] flex items-center justify-between">
                    <span>AI Execution Policy:</span>
                    <span className="font-medium text-[#0F172A]">Air-gapped Local</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. SMALL TRUST / FEATURE STRIP */}
        <section id="security" className="w-full max-w-3xl mt-16 pt-10 border-t border-[#E2E8F0]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
                <Shield size={13} className="text-[#1D4ED8]" />
                Private AI
              </h4>
              <p className="text-xs text-[#64748B]">
                Sensitive work stays protected.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-[#1D4ED8]" />
                Verified Contributions
              </h4>
              <p className="text-xs text-[#64748B]">
                Work is attributed and reviewable.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
                <Lock size={13} className="text-[#1D4ED8]" />
                Governed Rewards
              </h4>
              <p className="text-xs text-[#64748B]">
                Terms are agreed before work begins.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-[#E2E8F0] py-6 text-center text-xs text-[#94A3B8]">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#0F172A] rounded flex items-center justify-center text-white">
              <Hexagon size={9} strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-[#0F172A]">ResearchMesh</span>
            <span>•</span>
            <span>Trusted collaboration for research.</span>
          </div>
          <div>© {new Date().getFullYear()} ResearchMesh</div>
        </div>
      </footer>
    </div>
  );
}
