import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, CheckCircle2, Lock, Shield,
  Clock, Users, Coins, Briefcase, FileText, Bot, AlertCircle,
  ExternalLink, Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';
import { StatusBadge, SensitivityBadge, EngagementBadge } from '../../components/ui/Badge';
import {
  DEMO_PROJECTS, DEMO_MEMBERSHIPS, DEMO_MILESTONES,
  DEMO_CHARTERS, DEMO_USERS, DEMO_PROFILES
} from '../../lib/demo-data';

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [applyRole, setApplyRole] = useState<'student' | 'mentor'>(user?.role === 'mentor' ? 'mentor' : 'student');
  const [hasApplied, setHasApplied] = useState(false);
  const [charterAccepted, setCharterAccepted] = useState(true);

  const project = DEMO_PROJECTS.find((p) => p.id === id) || DEMO_PROJECTS[0];
  const members = DEMO_MEMBERSHIPS.filter((m) => m.project_id === project.id);
  const milestones = DEMO_MILESTONES.filter((m) => m.project_id === project.id);
  const charter = DEMO_CHARTERS.find((c) => c.project_id === project.id);

  const isMember = members.some((m) => m.user_id === user?.id);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FileText size={14} /> },
    { id: 'charter', label: 'Research Charter v1', icon: <Lock size={14} /> },
    { id: 'milestones', label: 'Milestones & Deliverables', count: milestones.length, icon: <CheckCircle2 size={14} /> },
    { id: 'ai-policy', label: 'AI Governance Policy', icon: <Bot size={14} /> },
  ];

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setHasApplied(true);
    setIsApplyModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to explore projects
        </button>
      </div>

      {/* Main Project Header Card */}
      <Card className="p-6 bg-white">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-[#475569]">
                <Building2 size={13} className="text-[#64748B]" />
                {project.organization?.name || 'Research Org'}
              </span>
              {project.organization?.verified && (
                <span className="inline-flex items-center text-[10px] text-[#15803D] font-semibold bg-[#F0FDF4] px-1.5 py-0.5 rounded border border-[#DCFCE7]">
                  <CheckCircle2 size={10} className="mr-0.5" /> VERIFIED
                </span>
              )}
              <span className="text-[#CBD5E1]">•</span>
              <span className="text-xs font-semibold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded">
                {project.domain}
              </span>
              <StatusBadge status={project.status} />
              <SensitivityBadge level={project.sensitivity_level} />
              <EngagementBadge model={project.engagement_model} />
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-[#0F172A] leading-tight">
              {project.title}
            </h1>

            <p className="text-xs md:text-sm text-[#475569] leading-relaxed">
              {project.public_summary}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#64748B]">
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                Duration: <strong>{project.duration_days} days</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={14} />
                Team Size: <strong>{members.length} members</strong>
              </span>
              {project.budget > 0 && (
                <span className="flex items-center gap-1.5">
                  <Coins size={14} className="text-[#B45309]" />
                  Total Escrow: <strong>${project.budget.toLocaleString()}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Action button */}
          <div className="md:w-64 flex flex-col gap-2 shrink-0">
            {isMember ? (
              <Button
                size="lg"
                className="w-full justify-center"
                icon={<Briefcase size={16} />}
                onClick={() => navigate(`/workspace/${project.id}`)}
              >
                Open Workspace
              </Button>
            ) : hasApplied ? (
              <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg text-center">
                <p className="text-xs font-semibold text-[#15803D] flex items-center justify-center gap-1">
                  <CheckCircle2 size={14} /> Application Submitted
                </p>
                <p className="text-[11px] text-[#166534] mt-0.5">Status: Pending Org Review</p>
              </div>
            ) : (
              <Button
                size="lg"
                className="w-full justify-center"
                icon={<Sparkles size={16} />}
                onClick={() => setIsApplyModalOpen(true)}
              >
                Apply to Research
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-center"
              icon={<ExternalLink size={14} />}
              onClick={() => setActiveTab('charter')}
            >
              Review Charter Terms
            </Button>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Confidential Brief Card */}
              <Card className="p-5 border-[#CBD5E1] bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Lock size={15} className="text-[#991B1B]" />
                    <h3 className="text-sm font-bold text-[#0F172A]">Confidential Research Brief</h3>
                  </div>
                  <SensitivityBadge level={project.sensitivity_level} />
                </div>

                {isMember ? (
                  <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#7F1D1D] leading-relaxed space-y-2">
                    <p className="font-semibold flex items-center gap-1.5">
                      <Shield size={13} /> CONFIDENTIAL — ACCESSIBLE TO CHARTER SIGNATORIES ONLY
                    </p>
                    <p>{project.confidential_brief}</p>
                    <p className="text-[11px] text-[#991B1B] italic">
                      Notice: Any unauthorized extraction or cloud processing of this brief violates the
                      ResearchMesh Charter and is cryptographically audited on the append-only ledger.
                    </p>
                  </div>
                ) : (
                  <div className="p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-center space-y-2">
                    <Lock size={20} className="mx-auto text-[#94A3B8]" />
                    <p className="text-xs font-semibold text-[#0F172A]">
                      Confidential brief locked to approved collaborators
                    </p>
                    <p className="text-[11px] text-[#64748B] max-w-md mx-auto">
                      Contains proprietary datasets, FDA regulatory targets, and proprietary
                      pipeline specifications. Apply and sign Charter v1 to gain workspace access.
                    </p>
                  </div>
                )}
              </Card>

              {/* Required Skills */}
              <Card className="p-5 bg-white space-y-3">
                <h3 className="text-sm font-bold text-[#0F172A]">Required Skills & Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {project.required_skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 bg-[#F1F5F9] text-[#1E293B] text-xs font-medium rounded-md border border-[#E2E8F0]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </Card>

              {/* IP & Authorship Overview */}
              <Card className="p-5 bg-white space-y-3">
                <h3 className="text-sm font-bold text-[#0F172A]">Intellectual Property & Publications</h3>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                    <span className="font-semibold text-[#0F172A] block mb-0.5">IP Ownership Terms</span>
                    <p className="text-[#475569]">{project.ip_ownership}</p>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                    <span className="font-semibold text-[#0F172A] block mb-0.5">Authorship Policy</span>
                    <p className="text-[#475569]">{project.authorship_rules}</p>
                  </div>
                  {project.commercialization_terms && (
                    <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                      <span className="font-semibold text-[#0F172A] block mb-0.5">Commercialization Terms</span>
                      <p className="text-[#475569]">{project.commercialization_terms}</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right sidebar: Team members */}
            <div className="space-y-6">
              <Card className="p-5 bg-white space-y-4">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center justify-between">
                  <span>Project Team</span>
                  <span className="text-xs font-normal text-[#64748B]">{members.length} members</span>
                </h3>

                <div className="space-y-3">
                  {members.map((m) => {
                    const u = DEMO_USERS.find((usr) => usr.id === m.user_id);
                    const prof = DEMO_PROFILES.find((p) => p.user_id === m.user_id);
                    return (
                      <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F8FAFC]">
                        <div className="w-8 h-8 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center text-xs font-bold">
                          {u?.display_name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#0F172A] truncate">
                            {u?.display_name}
                          </p>
                          <p className="text-[10px] text-[#64748B] capitalize">{m.role.replace('_', ' ')}</p>
                        </div>
                        <span className="text-[10px] font-semibold text-[#15803D] bg-[#F0FDF4] px-1.5 py-0.5 rounded">
                          Charter v1 ✓
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Escrow Distribution Breakdown */}
              {project.budget > 0 && (
                <Card className="p-5 bg-white space-y-3">
                  <h3 className="text-sm font-bold text-[#0F172A]">Simulated Escrow Allocation</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-[#475569]">
                      <span>Contributor Pool (60%)</span>
                      <strong className="text-[#0F172A]">
                        ${(project.budget * 0.6).toLocaleString()}
                      </strong>
                    </div>
                    <div className="flex justify-between text-[#475569]">
                      <span>Mentor / Expert Pool (25%)</span>
                      <strong className="text-[#0F172A]">
                        ${(project.budget * 0.25).toLocaleString()}
                      </strong>
                    </div>
                    <div className="flex justify-between text-[#475569]">
                      <span>AI Compute Reserve (10%)</span>
                      <strong className="text-[#0F172A]">
                        ${(project.budget * 0.1).toLocaleString()}
                      </strong>
                    </div>
                    <div className="flex justify-between text-[#475569]">
                      <span>Platform Maintenance (5%)</span>
                      <strong className="text-[#0F172A]">
                        ${(project.budget * 0.05).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Charter Tab */}
        {activeTab === 'charter' && (
          <Card className="p-6 bg-white space-y-6">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">
                  Research Charter — Version {charter?.version || 1}.0
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Cryptographically referenced legal terms. Hash:{' '}
                  <code className="text-[#1D4ED8]">a4f981e...c902b</code>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#15803D] font-semibold bg-[#F0FDF4] px-2 py-1 rounded border border-[#DCFCE7] flex items-center gap-1">
                  <CheckCircle2 size={13} /> Active Version
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs text-[#334155] leading-relaxed">
              <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1">
                <h4 className="font-bold text-[#0F172A]">Clause 1: Intellectual Property & Attribution</h4>
                <p>
                  All contributions submitted to this repository are hash-chained to the contributor's
                  ResearchMesh identity. Proprietary assets contributed by the Organization remain under exclusive
                  license, while novel algorithmic improvements are subject to joint-authorship rules.
                </p>
              </div>

              <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1">
                <h4 className="font-bold text-[#0F172A]">Clause 2: AI Assistance & Disclosure</h4>
                <p>
                  Any code, literature review, or dataset transformed by AI must be logged through the
                  ResearchMesh AI Policy Gateway. Pure AI generation cannot earn human credit points; credits are
                  solely allocated for human review, verification, and critical direction.
                </p>
              </div>

              <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1">
                <h4 className="font-bold text-[#0F172A]">Clause 3: Confidentiality & Data Residency</h4>
                <p>
                  Data marked Sensitivity: High or Critical shall not leave the isolated edge container or be sent
                  to third-party LLM providers. Violations trigger immediate revocation of workspace access and
                  disciplinary ledger logging.
                </p>
              </div>

              <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1">
                <h4 className="font-bold text-[#0F172A]">Clause 4: Dispute Resolution</h4>
                <p>
                  Disputes regarding authorship percentage, milestone acceptance, or credit allocation shall be
                  decided by the designated Mentor and Workspace Manager, subject to final review by the Admin
                  Dispute Council.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
              <span className="text-xs text-[#64748B]">
                Accepted by all {members.length} active workspace members.
              </span>
              {!charterAccepted && (
                <Button size="sm" onClick={() => setCharterAccepted(true)}>
                  Accept Charter v1
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Milestones Tab */}
        {activeTab === 'milestones' && (
          <div className="space-y-4">
            {milestones.map((m, index) => (
              <Card key={m.id} className="p-5 bg-white">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded">
                        Milestone {index + 1}
                      </span>
                      <StatusBadge status={m.status} />
                    </div>
                    <h3 className="text-base font-bold text-[#0F172A]">{m.title}</h3>
                    <p className="text-xs text-[#475569]">{m.description}</p>

                    <div className="pt-2">
                      <span className="text-xs font-semibold text-[#0F172A] block mb-1">
                        Deliverables:
                      </span>
                      <ul className="list-disc list-inside text-xs text-[#64748B] space-y-0.5">
                        {m.deliverables.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-2.5 bg-[#F8FAFC] rounded border border-[#E2E8F0] text-xs">
                      <span className="font-semibold text-[#0F172A]">Acceptance Criteria: </span>
                      <span className="text-[#475569]">{m.acceptance_criteria}</span>
                    </div>
                  </div>

                  <div className="md:w-48 text-right space-y-1 shrink-0">
                    <span className="text-[10px] text-[#64748B] uppercase font-semibold">
                      Budget Allocation
                    </span>
                    <p className="text-base font-bold text-[#0F172A]">
                      ${m.budget_allocation.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-[#64748B]">
                      Due: {new Date(m.due_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* AI Policy Tab */}
        {activeTab === 'ai-policy' && (
          <Card className="p-6 bg-white space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <Bot size={18} className="text-[#1D4ED8]" /> AI Governance & Gateway Configuration
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Every AI prompt, response, and agent action is bounded by these rules.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#0F172A]">Cloud LLM Permitted</span>
                  <span className={project.ai_policy.cloud_allowed ? 'text-[#15803D] font-bold' : 'text-[#B91C1C] font-bold'}>
                    {project.ai_policy.cloud_allowed ? 'YES (Public Only)' : 'BLOCKED'}
                  </span>
                </div>
                <p className="text-[#64748B]">
                  {project.ai_policy.cloud_allowed
                    ? 'Cloud models (Claude, GPT-4) may be queried for non-sensitive public literature.'
                    : 'External cloud APIs are blocked at the network gateway level to prevent data leakage.'}
                </p>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#0F172A]">Local Execution Required</span>
                  <span className={project.ai_policy.local_required ? 'text-[#15803D] font-bold' : 'text-[#64748B] font-bold'}>
                    {project.ai_policy.local_required ? 'ENFORCED (Ollama/Local)' : 'OPTIONAL'}
                  </span>
                </div>
                <p className="text-[#64748B]">
                  {project.ai_policy.local_required
                    ? 'All prompt inferences run locally on air-gapped or on-premise compute nodes.'
                    : 'Standard compute execution models permitted.'}
                </p>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#0F172A]">Approved Models</span>
                  <span className="font-mono text-[#0F172A]">
                    {project.ai_policy.approved_models.length > 0
                      ? project.ai_policy.approved_models.join(', ')
                      : 'All Standard Open Models'}
                  </span>
                </div>
                <p className="text-[#64748B]">
                  Only models evaluated for hallucination bounds and privacy certifications are allowed.
                </p>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#0F172A]">Human Review Gateway</span>
                  <span className={project.ai_policy.human_approval_required ? 'text-[#B45309] font-bold' : 'text-[#64748B] font-bold'}>
                    {project.ai_policy.human_approval_required ? 'MANDATORY' : 'RECOMMENDED'}
                  </span>
                </div>
                <p className="text-[#64748B]">
                  AI generated artifacts must receive explicit human verification before recording on the ledger.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Apply Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply to Research Project"
        subtitle={project.title}
        maxWidth="lg"
      >
        <form onSubmit={handleApply} className="space-y-4">
          <div className="p-3 bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg text-xs space-y-1">
            <span className="font-bold text-[#1D4ED8] flex items-center gap-1">
              <Sparkles size={13} /> AI Matching Compatibility: 94%
            </span>
            <p className="text-[#1E40AF]">
              Your profile skills (Python, PyTorch, Computer Vision) match 4/4 required skills for this project.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1.5">
              Applying As
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setApplyRole('student')}
                className={`p-3 text-left rounded-lg border text-xs cursor-pointer ${
                  applyRole === 'student'
                    ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8] font-semibold'
                    : 'border-[#E2E8F0] text-[#64748B]'
                }`}
              >
                Student Contributor
                <span className="block text-[10px] font-normal text-[#64748B] mt-0.5">
                  Earn verified credits, stipend, and co-authorship
                </span>
              </button>
              <button
                type="button"
                onClick={() => setApplyRole('mentor')}
                className={`p-3 text-left rounded-lg border text-xs cursor-pointer ${
                  applyRole === 'mentor'
                    ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8] font-semibold'
                    : 'border-[#E2E8F0] text-[#64748B]'
                }`}
              >
                Research Mentor
                <span className="block text-[10px] font-normal text-[#64748B] mt-0.5">
                  Supervise milestones, review submissions & guide team
                </span>
              </button>
            </div>
          </div>

          <Textarea
            label="Statement of Interest & Relevant Experience"
            placeholder="Explain how your background fits this research project..."
            rows={4}
            value={applyMessage}
            onChange={(e) => setApplyMessage(e.target.value)}
            required
          />

          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[11px] text-[#64748B]">
            By applying, you agree to review and accept the Research Charter v1 upon acceptance into the workspace.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsApplyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
