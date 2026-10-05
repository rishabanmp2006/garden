import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Briefcase, Lock, Shield, Bot, GitCommitHorizontal,
  CheckCircle2, AlertTriangle, FileText, Download,
  Send, Sparkles, Plus, Clock, Users, ArrowLeft, RefreshCw, Eye, Check, X, Code, Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { StatusBadge, SensitivityBadge } from '../../components/ui/Badge';
import {
  fetchProjectDetails,
  fetchContributionsApi,
  createTaskApi,
  submitWorkApi,
  reviewWorkApi,
  fetchLedger,
  verifyLedger,
  tamperLedger,
  restoreLedger,
  queryAIGateway,
  generateWatermark
} from '../../lib/api';

const DEFAULT_PREPROCESSING_CODE = `import cv2
import numpy as np

def preprocess_retinal_fundus(image_path: str, target_size=(512, 512)):
    """
    Green-channel Contrast Limited Adaptive Histogram Equalization (CLAHE)
    Optimized for diabetic retinopathy lesion detection on edge devices.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Invalid fundus image stream")

    # Resize to standardized inference resolution
    resized = cv2.resize(img, target_size)

    # Extract green channel (highest contrast for microaneurysms)
    green_ch = resized[:, :, 1]

    # Apply CLAHE to amplify blood vessel and hard exudate visibility
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(green_ch)

    # Normalize matrix to [-1.0, 1.0] for INT8 TensorRT inference
    normalized = (enhanced.astype(np.float32) / 127.5) - 1.0
    return normalized
`;

export function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [projectData, setProjectData] = useState<any>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('tasks');

  // AI Assistant State
  const [selectedAgent, setSelectedAgent] = useState<'developer' | 'research' | 'reviewer'>('developer');
  const [chatMessages, setChatMessages] = useState<
    { sender: 'user' | 'agent'; text: string; model?: string; executionType?: string; promptHash?: string; responseHash?: string }[]
  >([
    {
      sender: 'agent',
      text: `Hello! I am your ResearchMesh ${selectedAgent.toUpperCase()} agent. I enforce policy boundaries: Local container routing is enforced for confidential assets. How can I assist you with your milestone task?`,
      model: 'llama3-8b-instruct [AIR-GAPPED LOCAL CONTAINER]',
    },
  ]);
  const [promptInput, setPromptInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Ledger state & Tamper Simulation
  const [isTampered, setIsTampered] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    broken_block_id?: number;
    message: string;
    total_blocks?: number;
  } | null>(null);

  // Task Creation Modal (Org / Mentor)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskReward, setTaskReward] = useState(25);
  const [taskMilestoneId, setTaskMilestoneId] = useState('');

  // Submit Work Modal (Student)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [fileName, setFileName] = useState('preprocessing.py');
  const [fileContent, setFileContent] = useState(DEFAULT_PREPROCESSING_CODE);
  const [submissionDesc, setSubmissionDesc] = useState(
    'Implemented green-channel CLAHE normalization for retinal fundus scans with INT8 quantization for edge deployment.'
  );
  const [aiInvolvement, setAiInvolvement] = useState<'none' | 'ai_assisted' | 'ai_generated'>('ai_assisted');
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);

  // Review Modal (Mentor)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeReviewContrib, setActiveReviewContrib] = useState<any>(null);
  const [reviewVerdict, setReviewVerdict] = useState<'approved' | 'rejected'>('approved');
  const [reviewComment, setReviewComment] = useState('Code verified. Passes FDA Class II sensitivity requirements with zero edge data leakage.');
  const [isReviewing, setIsReviewing] = useState(false);

  // Watermark Modal Receipt
  const [watermarkedReceipt, setWatermarkedReceipt] = useState<any>(null);

  const loadAll = async () => {
    if (!id) return;
    try {
      const [projRes, contribRes, ledgerRes] = await Promise.all([
        fetchProjectDetails(id, user?.id),
        fetchContributionsApi(id).catch(() => []),
        fetchLedger(id).catch(() => []),
      ]);
      setProjectData(projRes);
      setContributions(contribRes);
      setLedgerEntries(ledgerRes);
      if (projRes?.milestones?.length > 0 && !taskMilestoneId) {
        setTaskMilestoneId(projRes.milestones[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [id, user?.id]);

  const project = projectData?.project;
  const milestones = projectData?.milestones || [];
  const tasks = projectData?.tasks || [];
  const members = projectData?.members || [];
  const files = projectData?.files || [];
  const charter = projectData?.charter;
  const escrow = projectData?.escrow;

  const isOrgOwner = user?.id === project?.org_id;
  const isMentor = members.some((m: any) => m.user_id === user?.id && m.role === 'mentor') || user?.role === 'mentor';
  const isStudent = user?.role === 'student' || (!isOrgOwner && !isMentor);

  // Tab definitions
  const tabs = [
    { id: 'tasks', label: 'Milestones & Tasks', count: tasks.length, icon: <CheckCircle2 size={14} /> },
    { id: 'reviews', label: 'Mentor Review Queue', count: contributions.filter((c: any) => c.status === 'under_review').length, icon: <Eye size={14} /> },
    { id: 'contributions', label: 'Contributions Log', count: contributions.length, icon: <GitCommitHorizontal size={14} /> },
    { id: 'data-room', label: 'Confidential Data Room', count: files.length, icon: <Lock size={14} /> },
    { id: 'ai-gateway', label: 'AI Policy Gateway', icon: <Bot size={14} /> },
    { id: 'ledger', label: 'SHA-256 Ledger', count: ledgerEntries.length, icon: <Shield size={14} /> },
    { id: 'charter', label: 'Charter & Team', icon: <FileText size={14} /> },
  ];

  // 1. Task Creation
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      await createTaskApi(project.id, {
        milestone_id: taskMilestoneId || milestones[0]?.id || 'ms-1',
        title: taskTitle,
        description: taskDescription,
        credits_reward: Number(taskReward) || 25,
      });
      setIsTaskModalOpen(false);
      setTaskTitle('');
      setTaskDescription('');
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    }
  };

  // 2. Submit Work on Task (Student Upload)
  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTaskId) return;
    setIsSubmittingWork(true);
    try {
      await submitWorkApi(selectedTaskId, {
        contributor_id: user.id,
        file_name: fileName,
        file_content: fileContent,
        description: submissionDesc,
        ai_involvement: aiInvolvement,
      });
      setIsSubmitModalOpen(false);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to submit work deliverable');
    } finally {
      setIsSubmittingWork(false);
    }
  };

  // 3. Mentor Review Action
  const handleReviewWork = async () => {
    if (!user || !activeReviewContrib) return;
    setIsReviewing(true);
    try {
      await reviewWorkApi(activeReviewContrib.id, {
        reviewer_id: user.id,
        verdict: reviewVerdict,
        comment: reviewComment,
      });
      setIsReviewModalOpen(false);
      setActiveReviewContrib(null);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Review failed');
    } finally {
      setIsReviewing(false);
    }
  };

  // 4. AI Gateway Query
  const handleSendPrompt = async (presetText?: string) => {
    const textToSend = presetText || promptInput;
    if (!textToSend.trim() || isAiLoading || !project || !user) return;

    const userMsg = { sender: 'user' as const, text: textToSend };
    setChatMessages((prev) => [...prev, userMsg]);
    setPromptInput('');
    setIsAiLoading(true);

    try {
      const res = await queryAIGateway({
        project_id: project.id,
        user_id: user.id,
        agent_type: selectedAgent,
        prompt: textToSend,
        project_sensitivity: project.sensitivity_level || 'high',
        target_hardware: 'Raspberry Pi 4 / NVIDIA Jetson Nano',
      });

      if (res) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'agent',
            text: res.response,
            model: res.model_used,
            executionType: res.execution_type,
            promptHash: res.prompt_hash,
            responseHash: res.response_hash,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // 5. Ledger Integrity Verification
  const handleVerifyLedger = async () => {
    try {
      const res = await verifyLedger();
      if (res) {
        setVerificationResult(res);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateTamper = async () => {
    try {
      const res = await tamperLedger(2, '[UNAUTHORIZED EDIT] Forged Credit Award: +9999 Credits');
      setIsTampered(true);
      await loadAll();
      await handleVerifyLedger();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestoreLedger = async () => {
    try {
      await restoreLedger();
      setIsTampered(false);
      setVerificationResult(null);
      await loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  // 6. Watermarked Download
  const handleDownloadFile = async (f: any) => {
    if (!user || !project) return;
    try {
      const receipt = await generateWatermark({
        file_name: f.name,
        user_id: user.id,
        user_email: user.email || 'researcher@researchmesh.org',
        project_id: project.id,
      });
      setWatermarkedReceipt(receipt);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 size={36} className="mx-auto text-[#1D4ED8] animate-spin mb-3" />
        <h3 className="text-sm font-semibold text-[#0F172A]">Loading research workspace...</h3>
        <p className="text-xs text-[#64748B]">Synchronizing inner tasks, review queue, and SHA-256 ledger.</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="py-16 text-center bg-white rounded-lg border border-[#E2E8F0] p-8 max-w-lg mx-auto">
        <AlertTriangle size={36} className="mx-auto text-[#DC2626] mb-3" />
        <h3 className="text-base font-bold text-[#0F172A]">Workspace Not Found</h3>
        <p className="text-xs text-[#64748B] mt-1">{error || 'This project workspace does not exist.'}</p>
        <Button className="mt-4" onClick={() => navigate('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(`/projects/${project.id}`)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors mb-1 cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Project Details
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-[#0F172A]">{project.title}</h1>
            <SensitivityBadge level={project.sensitivity_level} />
            <StatusBadge status={project.status} />
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Governed Research Workspace • Active Charter Signatory: <strong className="text-[#0F172A]">{user?.display_name || user?.email}</strong> ({user?.role?.toUpperCase()})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(isOrgOwner || isMentor) && (
            <Button
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setIsTaskModalOpen(true)}
            >
              Create Task
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            icon={<Bot size={14} />}
            onClick={() => setActiveTab('ai-gateway')}
          >
            AI Policy Gateway
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: Milestones & Tasks Board */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {/* Milestones Horizontal Progress */}
          <Card className="p-5 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F172A]">Milestone Roadmap & Escrow Status</h3>
              {escrow && (
                <span className="text-xs font-semibold text-[#15803D] bg-[#F0FDF4] px-2.5 py-1 rounded border border-[#DCFCE7]">
                  Escrow Available: ${Number(escrow.available_balance).toLocaleString()} • Released: ${Number(escrow.released_balance).toLocaleString()}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {milestones.map((m: any, idx: number) => (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                    m.status === 'completed'
                      ? 'border-[#86EFAC] bg-[#F0FDF4]'
                      : m.status === 'in_progress'
                      ? 'border-[#93C5FD] bg-[#EFF6FF]'
                      : 'border-[#E2E8F0] bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0F172A]">Milestone {idx + 1}</span>
                    <StatusBadge status={m.status} />
                  </div>
                  <p className="font-semibold text-[#0F172A] line-clamp-1">{m.title}</p>
                  <p className="text-[11px] text-[#64748B] line-clamp-2">{m.acceptance_criteria}</p>
                  <div className="pt-1 border-t border-[#CBD5E1]/40 flex justify-between font-medium">
                    <span className="text-[#64748B]">Escrow Allocation</span>
                    <strong className="text-[#0F172A]">${Number(m.budget_allocation || 0).toLocaleString()}</strong>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Kanban / Task Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column: Todo */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  To Do ({tasks.filter((t: any) => t.status === 'todo').length})
                </span>
              </div>
              <div className="space-y-2">
                {tasks
                  .filter((t: any) => t.status === 'todo')
                  .map((task: any) => (
                    <Card key={task.id} className="p-3.5 bg-white border-[#E2E8F0] space-y-2">
                      <p className="text-xs font-semibold text-[#0F172A]">{task.title}</p>
                      <p className="text-[11px] text-[#64748B]">{task.description}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] text-[11px]">
                        <span className="font-medium text-[#1D4ED8]">+{task.credits_reward || 25} Credits</span>
                        {isStudent && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-6 text-[11px] px-2 py-0"
                            onClick={() => {
                              setSelectedTaskId(task.id);
                              setIsSubmitModalOpen(true);
                            }}
                          >
                            Claim & Work
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
              </div>
            </div>

            {/* Column: In Progress / Under Review */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">
                  Under Review ({tasks.filter((t: any) => t.status === 'under_review' || t.status === 'in_progress').length})
                </span>
              </div>
              <div className="space-y-2">
                {tasks
                  .filter((t: any) => t.status === 'under_review' || t.status === 'in_progress')
                  .map((task: any) => (
                    <Card key={task.id} className="p-3.5 bg-white border-[#93C5FD] space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-[#0F172A]">{task.title}</p>
                        <span className="text-[10px] font-semibold bg-[#EFF6FF] text-[#1D4ED8] px-1.5 py-0.5 rounded">
                          Review Pending
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B]">{task.description}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] text-[11px]">
                        <span className="text-[#64748B]">Reward: {task.credits_reward || 25} cr</span>
                        {isStudent && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-6 text-[11px] px-2 py-0"
                            onClick={() => {
                              setSelectedTaskId(task.id);
                              setIsSubmitModalOpen(true);
                            }}
                          >
                            Update Code
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
              </div>
            </div>

            {/* Column: Completed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#15803D]">
                  Completed & Verified ({tasks.filter((t: any) => t.status === 'completed').length})
                </span>
              </div>
              <div className="space-y-2">
                {tasks
                  .filter((t: any) => t.status === 'completed')
                  .map((task: any) => (
                    <Card key={task.id} className="p-3.5 bg-white border-[#86EFAC] space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-[#0F172A]">{task.title}</p>
                        <CheckCircle2 size={14} className="text-[#15803D]" />
                      </div>
                      <p className="text-[11px] text-[#64748B]">{task.description}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] text-[11px]">
                        <span className="font-semibold text-[#15803D]">Verified on Ledger ✓</span>
                        <span className="font-bold text-[#0F172A]">+{task.credits_reward || 25} cr</span>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Mentor Review Queue */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <Card className="p-6 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Pending Deliverable Reviews</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Mentor inspection queue. Approving releases verified credits and logs a block to the SHA-256 ledger.
                </p>
              </div>
            </div>

            {contributions.filter((c: any) => c.status === 'under_review').length === 0 ? (
              <div className="p-12 text-center text-xs text-[#64748B]">
                <CheckCircle2 size={32} className="mx-auto text-[#15803D] mb-2" />
                <p className="font-semibold text-[#0F172A]">No submissions pending review</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  When contributors submit code deliverables, they appear here for mentor evaluation.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {contributions
                  .filter((c: any) => c.status === 'under_review')
                  .map((c: any) => (
                    <div key={c.id} className="p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                            <Code size={14} className="text-[#1D4ED8]" />
                            {c.file_name} — {c.task_title || 'Milestone Task'}
                          </p>
                          <p className="text-[11px] text-[#64748B] mt-0.5">
                            Contributor: <strong className="text-[#0F172A]">{c.display_name || c.contributor_id}</strong> • AI Involvement: <code className="text-[#0F172A]">{c.ai_involvement}</code>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setActiveReviewContrib(c);
                              setIsReviewModalOpen(true);
                            }}
                          >
                            Inspect & Review
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-[#334155]">{c.description}</p>
                      <div className="p-2 bg-white rounded border border-[#E2E8F0] text-[10px] font-mono text-[#64748B] truncate">
                        SHA-256 Content Hash: {c.content_hash}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: Contributions Log */}
      {activeTab === 'contributions' && (
        <div className="space-y-4">
          <Card className="p-6 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">All Verified Work Contributions</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Permanent record of approved code, data artifacts, and milestone deliverables.
                </p>
              </div>
            </div>

            {contributions.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#64748B]">
                No contributions logged yet. Students can submit deliverables from the Milestones & Tasks tab.
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {contributions.map((c: any) => (
                  <div key={c.id} className="py-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code size={14} className="text-[#1D4ED8]" />
                        <span className="text-xs font-bold text-[#0F172A]">{c.file_name}</span>
                        <StatusBadge status={c.status} />
                      </div>
                      {c.credits_awarded > 0 && (
                        <span className="text-xs font-bold text-[#15803D] bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#DCFCE7]">
                          +{c.credits_awarded} Credits Awarded
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#475569]">{c.description}</p>
                    <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                      <span>Contributor: {c.display_name || c.contributor_id}</span>
                      <span className="font-mono text-[10px]">Hash: {c.content_hash?.slice(0, 16)}...</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 4: Confidential Data Room */}
      {activeTab === 'data-room' && (
        <div className="space-y-4">
          <Card className="p-6 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Protected Data Room</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Downloads are dynamically stamped with a cryptographic watermark and recorded on the ledger.
                </p>
              </div>
            </div>

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
          </Card>

          {watermarkedReceipt && (
            <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#166534] flex items-center gap-1">
                  <CheckCircle2 size={14} /> Cryptographic Watermark Injected
                </span>
                <button onClick={() => setWatermarkedReceipt(null)} className="text-[#166534] hover:underline">
                  Dismiss
                </button>
              </div>
              <p className="text-[#15803D]">
                File '{watermarkedReceipt.file_name}' signed for authorized signatory <strong>{watermarkedReceipt.user_email}</strong>.
              </p>
              <div className="p-2 bg-white rounded border border-[#DCFCE7] font-mono text-[11px] text-[#334155] break-all">
                Watermark Hash: {watermarkedReceipt.watermark_hash}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AI Policy Gateway */}
      {activeTab === 'ai-gateway' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-5 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <Bot size={16} className="text-[#1D4ED8]" /> AI Policy Gateway Assistant
                </h3>
                <p className="text-[11px] text-[#64748B]">
                  Policy: {project.sensitivity_level === 'high' || project.sensitivity_level === 'critical' ? 'LOCAL AIR-GAPPED CONTAINER (Ollama Llama-3)' : 'CLOUD REASONING ROUTER'}
                </p>
              </div>
              <div className="flex gap-1.5">
                {(['developer', 'research', 'reviewer'] as const).map((agent) => (
                  <button
                    key={agent}
                    onClick={() => setSelectedAgent(agent)}
                    className={`px-2.5 py-1 rounded text-xs capitalize cursor-pointer ${
                      selectedAgent === agent
                        ? 'bg-[#1D4ED8] text-white font-semibold'
                        : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}
                  >
                    {agent}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="space-y-3 h-80 overflow-y-auto p-2 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-lg text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#1D4ED8] text-white'
                        : 'bg-white border border-[#CBD5E1] text-[#0F172A] shadow-sm'
                    }`}
                  >
                    {msg.sender === 'agent' && (
                      <div className="text-[10px] font-bold text-[#1D4ED8] mb-1 flex items-center gap-1">
                        <Bot size={11} /> {msg.model || 'ResearchMesh Gateway'}
                      </div>
                    )}
                    <pre className="whitespace-pre-wrap font-sans">{msg.text}</pre>
                    {msg.promptHash && (
                      <div className="mt-2 pt-1 border-t border-[#E2E8F0] text-[9px] font-mono text-[#64748B]">
                        Audit Hash: {msg.promptHash.slice(0, 16)}...
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isAiLoading && (
                <div className="flex items-center gap-2 text-xs text-[#64748B] p-2">
                  <Loader2 size={14} className="animate-spin text-[#1D4ED8]" />
                  <span>Processing through isolated edge policy gateway...</span>
                </div>
              )}
            </div>

            {/* Prompt Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask AI assistant about dataset preprocessing, edge inference or benchmark tests..."
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
                className="flex-1 px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#0F172A]"
              />
              <Button size="sm" onClick={() => handleSendPrompt()} disabled={isAiLoading}>
                <Send size={14} />
              </Button>
            </div>
          </Card>

          {/* Policy Overview Sidebar */}
          <div className="space-y-4">
            <Card className="p-5 bg-white space-y-3">
              <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Active Governance Rules
              </h4>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-[#EFF6FF] rounded border border-[#DBEAFE] space-y-1">
                  <span className="font-bold text-[#1D4ED8] block">Air-gapped Edge Model</span>
                  <p className="text-[11px] text-[#1E40AF]">
                    Ollama / Llama-3 running on private container. High-sensitivity dataset prompts cannot leave the network.
                  </p>
                </div>
                <div className="p-2.5 bg-[#FEF3C7] rounded border border-[#FDE68A] space-y-1">
                  <span className="font-bold text-[#92400E] block">Human Review Required</span>
                  <p className="text-[11px] text-[#92400E]">
                    AI output alone cannot earn ledger credits without mentor validation.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 6: SHA-256 Provenance Ledger */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          <Card className="p-6 bg-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <Shield size={16} className="text-[#1D4ED8]" /> Cryptographic Provenance Ledger
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Sequential SHA-256 hash-chained blocks recording all project creation, submissions, reviews, and rewards.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={handleVerifyLedger}>
                  Verify Ledger Integrity
                </Button>
                {!isTampered ? (
                  <Button size="sm" variant="danger" onClick={handleSimulateTamper}>
                    Simulate Tampering
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleRestoreLedger}>
                    Restore Canonical Ledger
                  </Button>
                )}
              </div>
            </div>

            {/* Verification Status Alert */}
            {verificationResult && (
              <div
                className={`p-4 rounded-lg border text-xs space-y-1 ${
                  verificationResult.valid
                    ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#15803D]'
                    : 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {verificationResult.valid ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{verificationResult.message}</span>
                </div>
                {!verificationResult.valid && (
                  <p className="text-[11px] text-[#7F1D1D]">
                    Tamper detected at Block #{verificationResult.broken_block_id}. The calculated cryptographic hash does not match stored block content.
                  </p>
                )}
              </div>
            )}

            {/* Ledger Blocks List */}
            <div className="space-y-3 pt-2">
              {ledgerEntries.map((block) => (
                <div
                  key={block.id}
                  className={`p-4 rounded-lg border text-xs font-mono space-y-2 transition-colors ${
                    block.is_tampered || (isTampered && block.id === 2)
                      ? 'border-[#EF4444] bg-[#FEF2F2]'
                      : 'border-[#E2E8F0] bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center justify-between font-sans">
                    <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                      Block #{block.id} • {block.action}
                    </span>
                    <span className="text-[10px] text-[#64748B]">
                      {new Date(block.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] break-all">
                    <div>
                      <span className="text-[#64748B] block">Previous Hash:</span>
                      <code className="text-[#334155]">{block.previous_hash}</code>
                    </div>
                    <div>
                      <span className="text-[#64748B] block">Entry Hash (SHA-256):</span>
                      <code className="text-[#1D4ED8] font-bold">{block.entry_hash}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 7: Charter & Team */}
      {activeTab === 'charter' && (
        <div className="space-y-6">
          <Card className="p-6 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Project Charter Terms (Version 1.0)</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Governed legal agreement accepted by all active team members.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[#334155]">
              <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                <strong className="text-[#0F172A] block mb-1">Clause 1: Scope & Problem Statement</strong>
                <p>{charter?.scope || project.public_summary}</p>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                <strong className="text-[#0F172A] block mb-1">Clause 2: Intellectual Property & Attribution</strong>
                <p>{charter?.ip_terms || project.ip_ownership}</p>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                <strong className="text-[#0F172A] block mb-1">Clause 3: Confidentiality & Data Residency</strong>
                <p>{charter?.confidentiality_terms || "Confidential assets restricted to signatories. Violations recorded on ledger."}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0]">
              <h4 className="text-xs font-bold text-[#0F172A] mb-3">Project Team Members</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {members.map((m: any) => (
                  <div key={m.user_id} className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center text-xs font-bold">
                      {(m.display_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#0F172A]">{m.display_name || 'Researcher'}</p>
                      <p className="text-[10px] text-[#64748B] capitalize">{m.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL 1: Create Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Create Research Task"
        subtitle={project.title}
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Task Title"
            placeholder="e.g. Build preprocessing script"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            required
          />

          <Textarea
            label="Task Description & Acceptance Criteria"
            placeholder="Describe technical implementation requirements..."
            rows={3}
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Reward Credits"
              type="number"
              value={taskReward}
              onChange={(e) => setTaskReward(Number(e.target.value))}
              required
            />
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">Milestone</label>
              <select
                value={taskMilestoneId}
                onChange={(e) => setTaskMilestoneId(e.target.value)}
                className="w-full h-10 px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-md"
              >
                {milestones.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Create Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Submit Work Modal (Code Upload) */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Code Deliverable"
        subtitle="Upload source code for mentor review and verified ledger credits"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitWork} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="File Name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              required
            />
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">AI Involvement</label>
              <select
                value={aiInvolvement}
                onChange={(e) => setAiInvolvement(e.target.value as any)}
                className="w-full h-10 px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-md"
              >
                <option value="none">None (100% Human Authored)</option>
                <option value="ai_assisted">AI-Assisted (Policy Gateway Verified)</option>
                <option value="ai_generated">AI-Generated with Human Oversight</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Python Code Implementation (preprocessing.py)
            </label>
            <textarea
              rows={10}
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              className="w-full p-3 font-mono text-xs bg-[#0F172A] text-[#F8FAFC] rounded-lg border border-[#334155] focus:outline-none"
              required
            />
          </div>

          <Textarea
            label="Submission Notes & Benchmark Results"
            value={submissionDesc}
            onChange={(e) => setSubmissionDesc(e.target.value)}
            rows={2}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmittingWork}>
              {isSubmittingWork ? 'Hashing & Submitting...' : 'Submit to Mentor Review Queue'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Mentor Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Review Code Deliverable"
        subtitle={activeReviewContrib?.file_name}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1">
            <p className="font-semibold text-[#0F172A]">
              Contributor: {activeReviewContrib?.display_name || activeReviewContrib?.contributor_id}
            </p>
            <p className="text-[#64748B]">{activeReviewContrib?.description}</p>
            <p className="font-mono text-[10px] text-[#1D4ED8]">
              Hash: {activeReviewContrib?.content_hash}
            </p>
          </div>

          <div>
            <label className="block font-semibold text-[#334155] mb-1">Review Outcome</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReviewVerdict('approved')}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                  reviewVerdict === 'approved'
                    ? 'border-[#15803D] bg-[#F0FDF4] text-[#15803D]'
                    : 'border-[#E2E8F0] text-[#64748B]'
                }`}
              >
                <Check size={14} /> Approve & Award Credits
              </button>
              <button
                type="button"
                onClick={() => setReviewVerdict('rejected')}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                  reviewVerdict === 'rejected'
                    ? 'border-[#B91C1C] bg-[#FEF2F2] text-[#B91C1C]'
                    : 'border-[#E2E8F0] text-[#64748B]'
                }`}
              >
                <X size={14} /> Request Revisions
              </button>
            </div>
          </div>

          <Textarea
            label="Mentor Feedback"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            rows={3}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleReviewWork} disabled={isReviewing}>
              {isReviewing ? 'Writing to Ledger...' : 'Commit Review Decision'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
