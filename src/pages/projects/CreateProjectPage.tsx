import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, Shield, Plus, X, Lock, CheckCircle2
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { SensitivityBadge, EngagementBadge } from '../../components/ui/Badge';
import { DEMO_PROJECTS, DEMO_ORGANIZATIONS } from '../../lib/demo-data';
import type { Project, SensitivityLevel, EngagementModel } from '../../types';

export function CreateProjectPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [publicSummary, setPublicSummary] = useState('');
  const [confidentialBrief, setConfidentialBrief] = useState('');
  const [domain, setDomain] = useState('Healthcare AI');
  const [skills, setSkills] = useState<string[]>(['Python', 'PyTorch']);
  const [newSkill, setNewSkill] = useState('');
  const [engagementModel, setEngagementModel] = useState<EngagementModel>('funded');
  const [budget, setBudget] = useState(50000);
  const [durationDays, setDurationDays] = useState(120);
  const [sensitivityLevel, setSensitivityLevel] = useState<SensitivityLevel>('high');

  // AI Policy
  const [cloudAllowed, setCloudAllowed] = useState(false);
  const [localRequired, setLocalRequired] = useState(true);
  const [humanApprovalRequired, setHumanApprovalRequired] = useState(true);
  const [approvedModels, setApprovedModels] = useState('llama3, codellama');

  // IP & Terms
  const [ipOwnership, setIpOwnership] = useState(
    'Shared — Organization retains core IP; contributors retain novel algorithms with license-back.'
  );
  const [authorshipRules, setAuthorshipRules] = useState(
    'Co-authorship for contributors exceeding 15% verified ledger credits.'
  );

  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (s: string) => {
    setSkills(skills.filter((item) => item !== s));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      org_id: 'org-1',
      organization: DEMO_ORGANIZATIONS[0],
      title: title || 'Untitled Research Project',
      public_summary: publicSummary,
      confidential_brief: confidentialBrief,
      domain,
      required_skills: skills,
      engagement_model: engagementModel,
      budget: Number(budget) || 0,
      sensitivity_level: sensitivityLevel,
      ai_policy: {
        cloud_allowed: cloudAllowed,
        local_required: localRequired,
        approved_models: approvedModels.split(',').map((m) => m.trim()).filter(Boolean),
        human_approval_required: humanApprovalRequired,
      },
      ip_ownership: ipOwnership,
      authorship_rules: authorshipRules,
      duration_days: Number(durationDays) || 90,
      status: 'open',
      created_at: new Date().toISOString(),
      member_count: 1,
    };

    DEMO_PROJECTS.unshift(newProject);
    navigate(`/projects/${newProject.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to projects
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Post New Research Project</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Establish research problem boundaries, privacy thresholds, and AI governance terms.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-white space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2">
              1. Basic Project Information
            </h3>

            <Input
              label="Project Title"
              placeholder="e.g., Deep Learning for Autonomous Navigation in GPS-denied Environments"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Research Domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                options={[
                  { value: 'Healthcare AI', label: 'Healthcare AI' },
                  { value: 'Education Technology', label: 'Education Technology' },
                  { value: 'Climate & Sustainability', label: 'Climate & Sustainability' },
                  { value: 'Cybersecurity', label: 'Cybersecurity' },
                  { value: 'Quantum & Hardware', label: 'Quantum & Hardware' },
                ]}
              />

              <Input
                label="Target Duration (Days)"
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                required
              />
            </div>

            <Textarea
              label="Public Problem Summary"
              placeholder="Explain the research question and objectives publicly visible to prospective candidates..."
              rows={3}
              value={publicSummary}
              onChange={(e) => setPublicSummary(e.target.value)}
              required
              helperText="This text is public and visible in the project exploration index."
            />

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Required Technical Skills
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Add skill (e.g., PyTorch, Rust, ROS)..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={handleAddSkill}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-md"
                />
                <Button type="button" size="sm" variant="secondary" onClick={handleAddSkill}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[#EFF6FF] text-[#1D4ED8] font-medium"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s)}
                      className="hover:text-[#B91C1C]"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* Privacy & Sensitivity Card */}
          <Card className="p-6 bg-white space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2 flex items-center justify-between">
              <span>2. Data Confidentiality & Sensitivity</span>
              <SensitivityBadge level={sensitivityLevel} />
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Sensitivity Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['low', 'medium', 'high', 'critical'] as SensitivityLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setSensitivityLevel(lvl);
                      if (lvl === 'high' || lvl === 'critical') {
                        setCloudAllowed(false);
                        setLocalRequired(true);
                      }
                    }}
                    className={`p-2.5 rounded-lg border text-left text-xs capitalize cursor-pointer ${
                      sensitivityLevel === lvl
                        ? 'border-[#1D4ED8] bg-[#EFF6FF] font-bold text-[#1D4ED8]'
                        : 'border-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              label="Confidential Research Brief (Locked behind Charter)"
              placeholder="Describe proprietary datasets, trade secrets, patient health information boundaries, or regulatory constraints..."
              rows={3}
              value={confidentialBrief}
              onChange={(e) => setConfidentialBrief(e.target.value)}
              helperText="Only verified contributors who sign Charter v1 can inspect this text."
            />
          </Card>

          {/* AI Policy Gateway Card */}
          <Card className="p-6 bg-white space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2 flex items-center gap-2">
              <Shield size={16} className="text-[#1D4ED8]" />
              3. AI Policy Gateway Configuration
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-[#0F172A] block">
                    Allow Cloud AI Models (Claude, OpenAI)
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Permits external cloud APIs for literature queries and non-confidential tasks.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={cloudAllowed}
                  onChange={(e) => setCloudAllowed(e.target.checked)}
                  className="rounded text-[#1D4ED8] focus:ring-[#1D4ED8]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-[#0F172A] block">
                    Enforce Local Execution (Ollama / Llama-3)
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Routes all prompt data through local edge containers to guarantee zero data egress.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={localRequired}
                  onChange={(e) => setLocalRequired(e.target.checked)}
                  className="rounded text-[#1D4ED8] focus:ring-[#1D4ED8]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-[#0F172A] block">
                    Require Human Verification for AI Artifacts
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    AI-assisted contributions cannot be committed without human reviewer sign-off.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={humanApprovalRequired}
                  onChange={(e) => setHumanApprovalRequired(e.target.checked)}
                  className="rounded text-[#1D4ED8] focus:ring-[#1D4ED8]"
                />
              </label>

              <Input
                label="Approved Local Model List"
                value={approvedModels}
                onChange={(e) => setApprovedModels(e.target.value)}
                helperText="Comma separated list of approved local model tags."
              />
            </div>
          </Card>

          {/* Engagement & Governance */}
          <Card className="p-6 bg-white space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2">
              4. Engagement & Governance
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Engagement Model"
                value={engagementModel}
                onChange={(e) => setEngagementModel(e.target.value as EngagementModel)}
                options={[
                  { value: 'funded', label: 'Funded (Escrow Milestones)' },
                  { value: 'stipend', label: 'Stipend' },
                  { value: 'knowledge_sharing', label: 'Non-Monetary (Credit & Co-authorship)' },
                  { value: 'institutional_credit', label: 'Institutional Academic Credit' },
                ]}
              />

              <Input
                label="Total Escrow Budget ($ USD)"
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                disabled={engagementModel === 'knowledge_sharing'}
              />
            </div>

            <Textarea
              label="IP Ownership Charter Terms"
              rows={2}
              value={ipOwnership}
              onChange={(e) => setIpOwnership(e.target.value)}
            />

            <Textarea
              label="Authorship & Credit Rules"
              rows={2}
              value={authorshipRules}
              onChange={(e) => setAuthorshipRules(e.target.value)}
            />
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/projects')}>
              Cancel
            </Button>
            <Button type="submit" size="lg" icon={<Plus size={16} />}>
              Publish Research Project
            </Button>
          </div>
        </form>

        {/* Live Preview Card */}
        <div className="space-y-4">
          <div className="sticky top-6">
            <h3 className="text-xs uppercase font-bold text-[#64748B] tracking-wider mb-2">
              Live Preview
            </h3>
            <Card className="p-5 bg-white border-[#CBD5E1] space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Building2 size={13} className="text-[#64748B]" />
                <span className="text-xs font-semibold text-[#0F172A]">Nova Biotech Labs</span>
                <span className="text-xs font-semibold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded ml-auto">
                  {domain}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#0F172A]">
                  {title || 'Your Research Title Here'}
                </h4>
                <p className="text-xs text-[#64748B] mt-1 line-clamp-3">
                  {publicSummary || 'Public problem summary will appear here for candidates...'}
                </p>
              </div>

              <div className="flex flex-wrap gap-1">
                {skills.map((s) => (
                  <span key={s} className="text-[10px] bg-[#F1F5F9] text-[#334155] px-1.5 py-0.5 rounded">
                    {s}
                  </span>
                ))}
              </div>

              <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[#64748B] uppercase block">Sensitivity</span>
                  <SensitivityBadge level={sensitivityLevel} />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#64748B] uppercase block">Budget</span>
                  <strong className="text-[#0F172A]">${Number(budget || 0).toLocaleString()}</strong>
                </div>
              </div>

              <div className="p-2.5 bg-[#F8FAFC] rounded text-[11px] text-[#64748B] border border-[#E2E8F0]">
                {localRequired ? (
                  <span className="text-[#B45309] font-medium flex items-center gap-1">
                    <Lock size={12} /> Local AI isolation enforced
                  </span>
                ) : (
                  <span className="text-[#15803D] font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} /> Cloud AI queries enabled
                  </span>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
