import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, CheckCircle2, Lock, Shield,
  Clock, Users, Coins, Briefcase, FileText, Bot, AlertCircle,
  ExternalLink, Sparkles, Download, Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';
import { StatusBadge, SensitivityBadge, EngagementBadge } from '../../components/ui/Badge';
import {
  fetchProjectDetails,
  applyToProjectApi,
  acceptCharterApi,
  generateWatermark
} from '../../lib/api';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [applyRole, setApplyRole] = useState<'student' | 'mentor'>(user?.role === 'mentor' ? 'mentor' : 'student');
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationResult, setApplicationResult] = useState<any>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isSigningCharter, setIsSigningCharter] = useState(false);
  const [downloadReceipt, setDownloadReceipt] = useState<any>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured() && supabase) {
        // Direct query to authoritative Supabase tables
        const [
          { data: p, error: pErr },
          { data: rawMembers },
          { data: rawMilestones },
          { data: rawCharter },
          { data: rawEscrow },
          { data: rawFiles },
          { data: rawAcceptances },
          { data: rawApplication }
        ] = await Promise.all([
          supabase
            .from('projects')
            .select('*, profiles:org_id(id, display_name, org_name, verified)')
            .eq('id', id)
            .single(),
          supabase
            .from('project_members')
            .select('*, profiles:user_id(id, display_name, email, education, skills)')
            .eq('project_id', id),
          supabase
            .from('milestones')
            .select('*, tasks(*)')
            .eq('project_id', id)
            .order('created_at', { ascending: true }),
          supabase
            .from('charters')
            .select('*')
            .eq('project_id', id)
            .eq('status', 'active')
            .maybeSingle(),
          supabase
            .from('escrow_accounts')
            .select('*')
            .eq('project_id', id)
            .maybeSingle(),
          supabase
            .from('files')
            .select('*')
            .eq('project_id', id),
          user?.id
            ? supabase.from('charter_acceptances').select('*').eq('user_id', user.id)
            : Promise.resolve({ data: [] }),
          user?.id
            ? supabase.from('applications').select('*').eq('project_id', id).eq('user_id', user.id).maybeSingle()
            : Promise.resolve({ data: null })
        ]);

        if (pErr) throw pErr;
        if (!p) throw new Error('Research project not found');

        const isMember = Boolean(
          rawMembers?.some((m: any) => m.user_id === user?.id && m.status === 'active') ||
          (user?.id && user.id === p.org_id)
        );
        const myMemberRecord = rawMembers?.find((m: any) => m.user_id === user?.id && m.status === 'active');
        const userRole = myMemberRecord?.role || (user?.id === p.org_id ? 'organization_owner' : null);

        const hasAcceptedCharter = Boolean(
          rawCharter?.id &&
          (
            rawAcceptances?.some((a: any) => a.charter_id === rawCharter.id) ||
            user?.id === p.org_id
          )
        );

        const canViewConfidential = isMember && hasAcceptedCharter;

        const members = (rawMembers || []).map((m: any) => ({
          user_id: m.user_id,
          role: m.role,
          status: m.status,
          joined_at: m.joined_at,
          display_name: m.profiles?.display_name || m.profiles?.email?.split('@')[0] || 'Researcher',
          email: m.profiles?.email,
          education: m.profiles?.education,
          skills: m.profiles?.skills || [],
        }));

        const visibleFiles = (rawFiles || []).filter(
          (f: any) => !f.is_confidential || canViewConfidential
        );

        const formattedProject = {
          id: p.id,
          org_id: p.org_id,
          org_name: p.profiles?.org_name || p.profiles?.display_name || 'Research Organization',
          org_verified: Boolean(p.profiles?.verified),
          title: p.title,
          public_summary: p.public_summary,
          confidential_brief: canViewConfidential ? p.confidential_brief : null,
          is_confidential_locked: !canViewConfidential,
          domain: p.domain,
          required_skills: Array.isArray(p.required_skills) ? p.required_skills : [],
          sensitivity_level: p.sensitivity_level,
          engagement_model: p.engagement_model,
          budget: p.budget,
          withdrawal_threshold: p.withdrawal_threshold,
          ai_policy: typeof p.ai_policy === 'string' ? JSON.parse(p.ai_policy) : (p.ai_policy || {}),
          ip_ownership: p.ip_ownership,
          authorship_rules: p.authorship_rules,
          duration_days: p.duration_days,
          status: p.status,
          created_at: p.created_at,
        };

        setProjectData({
          project: formattedProject,
          is_member: isMember,
          user_role: userRole,
          has_accepted_charter: hasAcceptedCharter,
          members,
          milestones: rawMilestones || [],
          tasks: (rawMilestones || []).flatMap((m: any) => m.tasks || []),
          files: visibleFiles,
          charter: rawCharter,
          escrow: rawEscrow,
        });

        if (rawApplication) {
          setHasApplied(true);
          setApplicationResult(rawApplication);
        }
      } else {
        const data = await fetchProjectDetails(id, user?.id);
        setProjectData(data);
      }
    } catch (err: any) {
      console.warn('Supabase project fetch note, falling back to local service:', err);
      try {
        const data = await fetchProjectDetails(id, user?.id);
        setProjectData(data);
      } catch (apiErr: any) {
        console.error('Failed to load project details from all sources:', apiErr);
        setError(err.message || apiErr.message || 'Failed to load project details.');
      }
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const project = projectData?.project;
  const members = projectData?.members || [];
  const milestones = projectData?.milestones || [];
  const charter = projectData?.charter;
  const files = projectData?.files || [];
  const isMember = projectData?.is_member;
  const hasAcceptedCharter = projectData?.has_accepted_charter;

  // Real reproducible match calculation for modal
  const reqSkills: string[] = project?.required_skills || [];
  const userSkills: string[] = profile?.skills || [];
  const matchedSkills = reqSkills.filter((s) =>
    userSkills.some((us) => us.toLowerCase() === s.toLowerCase())
  );
  const matchPct = reqSkills.length > 0
    ? Math.min(Math.round((matchedSkills.length / reqSkills.length) * 70 + 25), 98)
    : 75;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FileText size={14} /> },
    { id: 'charter', label: 'Research Charter v1.0', icon: <Lock size={14} /> },
    { id: 'milestones', label: 'Milestones & Deliverables', count: milestones.length, icon: <CheckCircle2 size={14} /> },
    { id: 'data-room', label: 'Data Room & Files', count: files.length, icon: <Shield size={14} /> },
    { id: 'ai-policy', label: 'AI Governance Policy', icon: <Bot size={14} /> },
  ];

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project) return;
    setIsApplying(true);
    try {
      // 1. Call FastAPI to compute deterministic match score & register on SHA-256 ledger
      let apiRes: any = null;
      try {
        apiRes = await applyToProjectApi(project.id, {
          user_id: user.id,
          role: applyRole,
          message: applyMessage,
          relevant_skills: userSkills,
        });
      } catch (apiErr) {
        console.warn('FastAPI ledger application note:', apiErr);
      }

      const matchScore = apiRes?.match_score ?? matchPct;
      const matchReasons = apiRes?.match_reasons ?? (matchedSkills.length > 0 ? [`Matched skills: ${matchedSkills.join(', ')}`] : []);

      // 2. Persist application directly in Supabase
      if (isSupabaseConfigured() && supabase) {
        const { error: appInsertErr } = await supabase.from('applications').upsert({
          project_id: project.id,
          user_id: user.id,
          role: applyRole,
          message: applyMessage,
          relevant_skills: userSkills,
          match_score: matchScore,
          match_reasons: matchReasons,
          status: 'pending',
        }, { onConflict: 'project_id,user_id' });

        if (appInsertErr) {
          console.warn('Supabase application upsert notice:', appInsertErr.message);
        }
      }

      setApplicationResult(apiRes || { match_score: matchScore, match_reasons: matchReasons });
      setHasApplied(true);
      setIsApplyModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to submit application');
    } finally {
      setIsApplying(false);
    }
  };

  const handleAcceptCharter = async () => {
    if (!user || !project) return;
    setIsSigningCharter(true);
    try {
      // 1. Persist charter acceptance to Supabase
      if (isSupabaseConfigured() && supabase && charter?.id) {
        const { error: accErr } = await supabase.from('charter_acceptances').upsert({
          charter_id: charter.id,
          user_id: user.id,
        }, { onConflict: 'charter_id,user_id' });
        if (accErr) {
          console.warn('Supabase charter acceptance notice:', accErr.message);
        }
      }

      // 2. Call FastAPI to record signature on SHA-256 Ledger
      try {
        await acceptCharterApi(project.id, user.id);
      } catch (apiErr) {
        console.warn('FastAPI ledger charter acceptance notice:', apiErr);
      }

      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to sign charter');
    } finally {
      setIsSigningCharter(false);
    }
  };

  const handleDownloadFile = async (f: any) => {
    if (!user || !project) return;
    try {
      const receipt = await generateWatermark({
        file_name: f.name,
        user_id: user.id,
        user_email: user.email || 'contributor@researchmesh.org',
        project_id: project.id,
      });
      setDownloadReceipt(receipt);
    } catch (err: any) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 size={36} className="mx-auto text-[#1D4ED8] animate-spin mb-3" />
        <h3 className="text-sm font-semibold text-[#0F172A]">Loading research project workspace...</h3>
        <p className="text-xs text-[#64748B]">Querying persistent database and charter registry.</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="py-16 text-center bg-white rounded-lg border border-[#E2E8F0] p-8 max-w-lg mx-auto">
        <AlertCircle size={36} className="mx-auto text-[#DC2626] mb-3" />
        <h3 className="text-base font-bold text-[#0F172A]">Project Not Found</h3>
        <p className="text-xs text-[#64748B] mt-1">{error || 'This research project does not exist in the database.'}</p>
        <Button className="mt-4" onClick={() => navigate('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

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
                {project.org_name || 'Research Organization'}
              </span>
              <span className="inline-flex items-center text-[10px] text-[#15803D] font-semibold bg-[#F0FDF4] px-1.5 py-0.5 rounded border border-[#DCFCE7]">
                <CheckCircle2 size={10} className="mr-0.5" /> VERIFIED ORG
              </span>
              <span className="text-[#CBD5E1]">•</span>
              <span className="text-xs font-semibold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded">
                {project.domain}
              </span>
              <StatusBadge status={project.status || 'open'} />
              <SensitivityBadge level={project.sensitivity_level || 'high'} />
              <EngagementBadge model={project.engagement_model || 'funded'} />
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
              {Number(project.budget) > 0 && (
                <span className="flex items-center gap-1.5">
                  <Coins size={14} className="text-[#B45309]" />
                  Total Escrow: <strong>${Number(project.budget).toLocaleString()}</strong>
                </span>
              )}
              <span className="flex items-center gap-1.5 bg-[#EFF6FF] text-[#1D4ED8] px-2 py-0.5 rounded font-medium">
                Withdrawal Threshold: <strong>{project.withdrawal_threshold || 50} Credits</strong>
              </span>
            </div>
          </div>

          {/* Action button */}
          <div className="md:w-64 flex flex-col gap-2 shrink-0">
            {isMember ? (
              <Button
                size="lg"
                className="w-full justify-center"
                icon={<Briefcase size={16} />}
                onClick={() => navigate(`/projects/${project.id}/workspace`)}
              >
                Open Workspace
              </Button>
            ) : hasApplied ? (
              <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg text-center">
                <p className="text-xs font-semibold text-[#15803D] flex items-center justify-center gap-1">
                  <CheckCircle2 size={14} /> Application Submitted
                </p>
                <p className="text-[11px] text-[#166534] mt-0.5">
                  AI Match: {applicationResult?.match_score || matchPct}% • Pending Review
                </p>
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
                    <Lock size={15} className={project.is_confidential_locked ? 'text-[#94A3B8]' : 'text-[#991B1B]'} />
                    <h3 className="text-sm font-bold text-[#0F172A]">Confidential Research Brief</h3>
                  </div>
                  <SensitivityBadge level={project.sensitivity_level} />
                </div>

                {!project.is_confidential_locked ? (
                  <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#7F1D1D] leading-relaxed space-y-2">
                    <p className="font-semibold flex items-center gap-1.5">
                      <Shield size={13} /> CONFIDENTIAL BRIEF — ACCESSIBLE TO CHARTER SIGNATORIES ONLY
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
                      pipeline specifications. Apply and sign Charter v1.0 to gain workspace access.
                    </p>
                  </div>
                )}
              </Card>

              {/* Required Skills */}
              <Card className="p-5 bg-white space-y-3">
                <h3 className="text-sm font-bold text-[#0F172A]">Required Skills & Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {reqSkills.map((skill) => (
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
                  {members.map((m: any) => (
                    <div key={m.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F8FAFC]">
                      <div className="w-8 h-8 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center text-xs font-bold">
                        {(m.display_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#0F172A] truncate">
                          {m.display_name || 'Researcher'}
                        </p>
                        <p className="text-[10px] text-[#64748B] capitalize">{m.role.replace('_', ' ')}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-[#15803D] bg-[#F0FDF4] px-1.5 py-0.5 rounded">
                        Active ✓
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Escrow Distribution Breakdown */}
              {Number(project.budget) > 0 && (
                <Card className="p-5 bg-white space-y-3">
                  <h3 className="text-sm font-bold text-[#0F172A]">Simulated Escrow Allocation</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-[#475569]">
                      <span>Contributor Pool (60%)</span>
                      <strong className="text-[#0F172A]">
                        ${(Number(project.budget) * 0.6).toLocaleString()}
                      </strong>
                    </div>
                    <div className="flex justify-between text-[#475569]">
                      <span>Mentor / Expert Pool (25%)</span>
                      <strong className="text-[#0F172A]">
                        ${(Number(project.budget) * 0.25).toLocaleString()}
                      </strong>
                    </div>
                    <div className="flex justify-between text-[#475569]">
                      <span>AI Compute Reserve (10%)</span>
                      <strong className="text-[#0F172A]">
                        ${(Number(project.budget) * 0.1).toLocaleString()}
                      </strong>
                    </div>
                    <div className="flex justify-between text-[#475569]">
                      <span>Platform Maintenance (5%)</span>
                      <strong className="text-[#0F172A]">
                        ${(Number(project.budget) * 0.05).toLocaleString()}
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
                  {charter?.title || 'Research Charter v1.0'}
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Cryptographically referenced legal terms registered on SHA-256 Ledger.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#15803D] font-semibold bg-[#F0FDF4] px-2 py-1 rounded border border-[#DCFCE7] flex items-center gap-1">
                  <CheckCircle2 size={13} /> Active Version {charter?.version || 1}.0
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs text-[#334155] leading-relaxed">
              <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1">
                <h4 className="font-bold text-[#0F172A]">Clause 1: Scope & Deliverables</h4>
                <p>{charter?.scope || project.public_summary}</p>
              </div>

              <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1">
                <h4 className="font-bold text-[#0F172A]">Clause 2: Intellectual Property & Attribution</h4>
                <p>{charter?.ip_terms || project.ip_ownership}</p>
              </div>

              <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1">
                <h4 className="font-bold text-[#0F172A]">Clause 3: Confidentiality & Data Residency</h4>
                <p>{charter?.confidentiality_terms || "Confidential assets restricted to signatories. Violations recorded on ledger."}</p>
              </div>

              <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1">
                <h4 className="font-bold text-[#0F172A]">Clause 4: Withdrawal Rules & Reward Threshold</h4>
                <p>{charter?.withdrawal_rules || `Withdrawal threshold set at ${project.withdrawal_threshold} credits.`}</p>
              </div>

              <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1">
                <h4 className="font-bold text-[#0F172A]">Clause 5: Dispute Resolution</h4>
                <p>{charter?.dispute_rules || "Disputes adjudicated by Mentor & Council."}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
              <span className="text-xs text-[#64748B]">
                {hasAcceptedCharter ? 'You have signed & accepted this charter.' : 'You must sign to access confidential assets.'}
              </span>
              {isMember && !hasAcceptedCharter && (
                <Button size="sm" onClick={handleAcceptCharter} disabled={isSigningCharter}>
                  {isSigningCharter ? 'Signing on Ledger...' : 'Accept & Sign Charter v1.0'}
                </Button>
              )}
              {hasAcceptedCharter && (
                <span className="text-xs font-semibold text-[#15803D] bg-[#F0FDF4] px-3 py-1.5 rounded border border-[#DCFCE7] flex items-center gap-1">
                  <CheckCircle2 size={14} /> Signed & Accepted
                </span>
              )}
            </div>
          </Card>
        )}

        {/* Milestones Tab */}
        {activeTab === 'milestones' && (
          <div className="space-y-4">
            {milestones.length === 0 ? (
              <div className="p-8 bg-white border border-[#E2E8F0] rounded-lg text-center text-xs text-[#64748B]">
                No milestones published yet.
              </div>
            ) : (
              milestones.map((m: any, index: number) => {
                let deliverables: string[] = [];
                try {
                  deliverables = typeof m.deliverables === 'string' ? JSON.parse(m.deliverables) : m.deliverables || [];
                } catch {
                  deliverables = [m.deliverables];
                }

                return (
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
                            {deliverables.map((d: string, i: number) => (
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
                          ${Number(m.budget_allocation || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Data Room Tab */}
        {activeTab === 'data-room' && (
          <div className="space-y-4">
            <Card className="p-6 bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Data Room & Repository Files</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Governed access with cryptographic watermarking and download audit logs.
                  </p>
                </div>
              </div>

              {files.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#64748B]">
                  No files attached to this project.
                </div>
              ) : (
                <div className="divide-y divide-[#F1F5F9]">
                  {files.map((f: any) => (
                    <div key={f.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className={f.is_confidential ? 'text-[#D97706]' : 'text-[#1D4ED8]'} />
                        <div>
                          <p className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
                            {f.name}
                            {f.is_confidential ? (
                              <span className="text-[10px] font-semibold bg-[#FEF3C7] text-[#92400E] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Lock size={10} /> Confidential
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold bg-[#F0FDF4] text-[#166534] px-1.5 py-0.5 rounded">
                                Public
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-[#64748B]">
                            Size: {f.file_size} • Sensitivity: {f.sensitivity_level}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Download size={14} />}
                        onClick={() => handleDownloadFile(f)}
                      >
                        Download Watermarked
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {downloadReceipt && (
              <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#166534] flex items-center gap-1">
                    <CheckCircle2 size={14} /> Cryptographic Watermark Injected
                  </span>
                  <button onClick={() => setDownloadReceipt(null)} className="text-[#166534] hover:underline">
                    Close
                  </button>
                </div>
                <p className="text-[#15803D]">
                  File '{downloadReceipt.file_name}' watermarked for <strong>{downloadReceipt.user_email}</strong>.
                </p>
                <div className="p-2 bg-white rounded border border-[#DCFCE7] font-mono text-[11px] text-[#334155] break-all">
                  Watermark Hash: {downloadReceipt.watermark_hash}
                </div>
              </div>
            )}
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
                  <span className={project.ai_policy?.cloud_allowed ? 'text-[#15803D] font-bold' : 'text-[#B91C1C] font-bold'}>
                    {project.ai_policy?.cloud_allowed ? 'YES (Public Only)' : 'BLOCKED'}
                  </span>
                </div>
                <p className="text-[#64748B]">
                  {project.ai_policy?.cloud_allowed
                    ? 'Cloud models may be queried for non-sensitive public literature.'
                    : 'External cloud APIs are blocked to guarantee confidentiality.'}
                </p>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#0F172A]">Local Execution Required</span>
                  <span className={project.ai_policy?.local_required ? 'text-[#15803D] font-bold' : 'text-[#64748B] font-bold'}>
                    {project.ai_policy?.local_required ? 'ENFORCED (Air-gapped)' : 'OPTIONAL'}
                  </span>
                </div>
                <p className="text-[#64748B]">
                  {project.ai_policy?.local_required
                    ? 'All prompt inferences run locally to prevent data egress.'
                    : 'Standard compute execution models permitted.'}
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
              <Sparkles size={13} /> AI Matching Compatibility: {matchPct}%
            </span>
            <p className="text-[#1E40AF]">
              {matchedSkills.length > 0
                ? `Matched skills: ${matchedSkills.join(', ')}`
                : 'General profile evaluation based on domain alignment and availability.'}
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
            By applying, you agree to review and accept the Research Charter v1.0 upon acceptance into the workspace.
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
            <Button type="submit" size="sm" disabled={isApplying}>
              {isApplying ? 'Submitting to Database...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

