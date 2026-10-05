import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, Shield, Plus, X, Lock, CheckCircle2, Upload, FileText, AlertCircle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { SensitivityBadge, EngagementBadge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { createProjectApi } from '../../lib/api';
import type { SensitivityLevel, EngagementModel } from '../../types';

export function CreateProjectPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [title, setTitle] = useState('');
  const [publicSummary, setPublicSummary] = useState('');
  const [confidentialBrief, setConfidentialBrief] = useState('');
  const [domain, setDomain] = useState('Healthcare AI');
  const [skills, setSkills] = useState<string[]>(['Python', 'PyTorch', 'Computer Vision']);
  const [newSkill, setNewSkill] = useState('');
  const [engagementModel, setEngagementModel] = useState<EngagementModel>('funded');
  const [budget, setBudget] = useState(100000);
  const [withdrawalThreshold, setWithdrawalThreshold] = useState(50);
  const [durationDays, setDurationDays] = useState(120);
  const [sensitivityLevel, setSensitivityLevel] = useState<SensitivityLevel>('high');

  // AI Policy
  const [cloudAllowed, setCloudAllowed] = useState(false);
  const [localRequired, setLocalRequired] = useState(true);
  const [humanApprovalRequired, setHumanApprovalRequired] = useState(true);
  const [approvedModels, setApprovedModels] = useState('llama3, codellama');

  // IP & Terms
  const [ipOwnership, setIpOwnership] = useState(
    'Shared IP — Organization retains proprietary assets; contributors retain novel algorithms with license-back.'
  );
  const [authorshipRules, setAuthorshipRules] = useState(
    'Co-authorship for contributors exceeding >15% verified ledger credits.'
  );

  // Files
  const [publicFiles, setPublicFiles] = useState<string[]>(['sample_fundus_metadata.csv', 'problem_specification.pdf']);
  const [newPublicFile, setNewPublicFile] = useState('');
  const [confidentialFiles, setConfidentialFiles] = useState<string[]>(['proprietary_preprocessing_dataset.tar.gz', 'fda_validation_raw_labels.json']);
  const [newConfidentialFile, setNewConfidentialFile] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const handleAddPublicFile = (e: React.MouseEvent | React.KeyboardEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (newPublicFile.trim() && !publicFiles.includes(newPublicFile.trim())) {
      setPublicFiles([...publicFiles, newPublicFile.trim()]);
      setNewPublicFile('');
    }
  };

  const handleAddConfidentialFile = (e: React.MouseEvent | React.KeyboardEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (newConfidentialFile.trim() && !confidentialFiles.includes(newConfidentialFile.trim())) {
      setConfidentialFiles([...confidentialFiles, newConfidentialFile.trim()]);
      setNewConfidentialFile('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('You must be logged in to create a research project.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await createProjectApi({
        org_id: user.id,
        org_name: profile?.org_name || profile?.display_name || 'Research Organization',
        title: title || 'Low-cost Diabetic Retinopathy Detection on Edge Devices',
        public_summary: publicSummary,
        confidential_brief: confidentialBrief,
        domain,
        required_skills: skills,
        sensitivity_level: sensitivityLevel,
        engagement_model: engagementModel,
        budget: Number(budget) || 100000,
        withdrawal_threshold: Number(withdrawalThreshold) || 50,
        duration_days: Number(durationDays) || 120,
        ai_policy: {
          cloud_allowed: cloudAllowed,
          local_required: localRequired,
          approved_models: approvedModels.split(',').map((m) => m.trim()).filter(Boolean),
          human_approval_required: humanApprovalRequired,
        },
        ip_ownership: ipOwnership,
        authorship_rules: authorshipRules,
        public_files: publicFiles,
        confidential_files: confidentialFiles,
      });

      navigate(`/projects/${res.project_id}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to create research project.');
    } finally {
      setIsSubmitting(false);
    }
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Withdrawal / Reward Threshold (Credits)"
                type="number"
                value={withdrawalThreshold}
                onChange={(e) => setWithdrawalThreshold(Number(e.target.value))}
                helperText="Minimum verified credits a contributor must accumulate before payout unlock."
                required
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

          {/* 5. Data Room Initial Attachments */}
          <Card className="p-6 bg-white space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2 flex items-center gap-2">
              <Upload size={16} className="text-[#1D4ED8]" />
              5. Data Room Setup (Public vs. Confidential)
            </h3>

            {/* Public Files */}
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                Public Dataset & Problem Specification Files
              </label>
              <p className="text-[11px] text-[#64748B] mb-2">Visible to all exploring candidates before applying.</p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. sample_retina_data.csv, problem_statement.pdf"
                  value={newPublicFile}
                  onChange={(e) => setNewPublicFile(e.target.value)}
                  onKeyDown={handleAddPublicFile}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-md"
                />
                <Button type="button" size="sm" variant="secondary" onClick={handleAddPublicFile}>
                  Add Public File
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {publicFiles.map((f) => (
                  <span key={f} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A]">
                    <FileText size={12} className="text-[#1D4ED8]" />
                    {f}
                    <button type="button" onClick={() => setPublicFiles(publicFiles.filter((x) => x !== f))} className="text-[#94A3B8] hover:text-[#EF4444]">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Confidential Files */}
            <div className="pt-3 border-t border-[#F1F5F9]">
              <label className="block text-xs font-semibold text-[#B45309] mb-1 flex items-center gap-1">
                <Lock size={12} /> Confidential Files (Locked behind Charter Acceptance)
              </label>
              <p className="text-[11px] text-[#64748B] mb-2">
                Restricted to accepted team members who have signed Charter v1.0. Download watermarking enforced.
              </p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. proprietary_preprocessing_dataset.tar.gz, private_model_weights.onnx"
                  value={newConfidentialFile}
                  onChange={(e) => setNewConfidentialFile(e.target.value)}
                  onKeyDown={handleAddConfidentialFile}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-md"
                />
                <Button type="button" size="sm" variant="secondary" onClick={handleAddConfidentialFile}>
                  Add Confidential File
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {confidentialFiles.map((f) => (
                  <span key={f} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FEF3C7] border border-[#FDE68A] text-xs text-[#92400E]">
                    <Lock size={12} className="text-[#D97706]" />
                    {f}
                    <button type="button" onClick={() => setConfidentialFiles(confidentialFiles.filter((x) => x !== f))} className="text-[#92400E] hover:text-[#EF4444]">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {errorMsg && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg text-xs text-[#991B1B] flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/projects')}>
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={isSubmitting} icon={<Plus size={16} />}>
              {isSubmitting ? 'Publishing to Ledger...' : 'Publish Research Project'}
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
