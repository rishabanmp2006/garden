import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, GitCommitHorizontal, Scale,
  ArrowRight, Hexagon, ChevronRight,
  Lock, Users, Bot, CheckCircle2,
  Search, Plus, FileText,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-[#E2E8F0]">
        <div className="max-w-[1100px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0F172A] rounded-lg flex items-center justify-center">
              <Hexagon size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold text-[#0F172A] tracking-tight">ResearchMesh</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
              Sign in
            </Button>
            <Button size="sm" onClick={() => navigate('/auth')}>
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-[#E2E8F0]">
        <div className="max-w-[1100px] mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-[#F1F5F9] border border-[#E2E8F0] rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 bg-[#15803D] rounded-full" />
            <span className="text-xs font-medium text-[#475569]">Open for research collaboration</span>
          </div>
          <h1 className="text-4xl font-bold text-[#0F172A] leading-tight max-w-2xl mx-auto">
            Research collaboration with privacy, provenance and accountability
          </h1>
          <p className="text-lg text-[#64748B] mt-4 max-w-xl mx-auto leading-relaxed">
            Connect organizations, experts and students in trusted project workspaces where
            humans and AI collaborate under clear rules.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Button size="lg" onClick={() => navigate('/projects')} icon={<Search size={16} />}>
              Explore Research
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate('/auth')} icon={<Plus size={16} />}>
              Post a Research Problem
            </Button>
          </div>
        </div>
      </section>

      {/* Three Pillars */}
      <section className="border-b border-[#E2E8F0]">
        <div className="max-w-[1100px] mx-auto px-6 py-16">
          <div className="grid grid-cols-3 gap-8">
            <PillarCard
              icon={<Shield size={20} />}
              title="Private AI"
              description="AI routing based on project sensitivity. Confidential data stays on local models. Cloud AI only for public analysis."
            />
            <PillarCard
              icon={<GitCommitHorizontal size={20} />}
              title="Verified Contribution"
              description="Human and AI actions are traceable. Every contribution is hash-chained and attributed. Tamper-evident ledger."
            />
            <PillarCard
              icon={<Scale size={20} />}
              title="Fair Credit"
              description="Contribution, recognition and rewards are transparent. AI does not earn credits — humans who direct AI do."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-[#E2E8F0]">
        <div className="max-w-[1100px] mx-auto px-6 py-16">
          <h2 className="text-lg font-bold text-[#0F172A] text-center mb-10">How it works</h2>
          <div className="flex items-center justify-between">
            {[
              { step: 'Post', desc: 'Organization posts research problem', icon: <FileText size={18} /> },
              { step: 'Match', desc: 'AI matches suitable contributors', icon: <Bot size={18} /> },
              { step: 'Agree', desc: 'Team accepts project charter', icon: <CheckCircle2 size={18} /> },
              { step: 'Collaborate', desc: 'Work in governed workspace', icon: <Users size={18} /> },
              { step: 'Verify', desc: 'Contributions reviewed & recorded', icon: <GitCommitHorizontal size={18} /> },
              { step: 'Reward', desc: 'Credits and rewards distributed', icon: <Scale size={18} /> },
            ].map((item, i) => (
              <Fragment key={item.step}>
                <div className="flex flex-col items-center text-center w-[140px]">
                  <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#475569] mb-3">
                    {item.icon}
                  </div>
                  <p className="text-xs font-semibold text-[#0F172A]">{item.step}</p>
                  <p className="text-[11px] text-[#64748B] mt-1 leading-tight">{item.desc}</p>
                </div>
                {i < 5 && <ChevronRight size={16} className="text-[#CBD5E1] mt-[-20px]" />}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Trust indicators */}
      <section className="border-b border-[#E2E8F0]">
        <div className="max-w-[1100px] mx-auto px-6 py-12">
          <div className="flex items-center justify-center gap-10 text-xs text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <Lock size={14} />
              <span>SHA-256 hash chain</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={14} />
              <span>Policy-aware AI routing</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={14} />
              <span>Role-based access control</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} />
              <span>Human approval required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8">
        <div className="max-w-[1100px] mx-auto px-6 text-center">
          <p className="text-xs text-[#94A3B8]">
            ResearchMesh — Gardenia 2K26 Hackathon Prototype.
            Not a production system. Escrow is simulated. Credits are reputation points, not cryptocurrency.
          </p>
        </div>
      </footer>
    </div>
  );
}

function PillarCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="border border-[#E2E8F0] rounded-lg p-6">
      <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-[#334155] mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-[#0F172A] mb-2">{title}</h3>
      <p className="text-sm text-[#64748B] leading-relaxed">{description}</p>
    </div>
  );
}
