import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Briefcase, Lock, Shield, Bot, GitCommitHorizontal,
  CheckCircle2, AlertTriangle, FileText, Download,
  Send, Sparkles, Plus, Clock, Users, ArrowLeft, RefreshCw, Eye
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { StatusBadge, SensitivityBadge } from '../../components/ui/Badge';
import {
  DEMO_PROJECTS, DEMO_MEMBERSHIPS, DEMO_MILESTONES,
  DEMO_LEDGER, DEMO_AI_LOGS, DEMO_CONTRIBUTIONS, DEMO_USERS
} from '../../lib/demo-data';
import type { LedgerEntry, AILog, Contribution } from '../../types';

export function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const project = DEMO_PROJECTS.find((p) => p.id === id) || DEMO_PROJECTS[0];
  const members = DEMO_MEMBERSHIPS.filter((m) => m.project_id === project.id);
  const milestones = DEMO_MILESTONES.filter((m) => m.project_id === project.id);

  const [activeTab, setActiveTab] = useState('tasks');

  // AI Assistant State
  const [selectedAgent, setSelectedAgent] = useState<'research' | 'developer' | 'reviewer'>('developer');
  const [chatMessages, setChatMessages] = useState<
    { sender: 'user' | 'agent'; text: string; model?: string; requiresApproval?: boolean; approved?: boolean }[]
  >([
    {
      sender: 'agent',
      text: `Hello! I am your workspace ${selectedAgent.toUpperCase()} agent. I am operating under Policy Gateway: LOCAL LLAMA-3 ONLY. No sensitive retinal dataset annotations will leave your isolated edge node. How can I assist you with Milestone 2?`,
      model: 'llama3-8b-instruct [LOCAL CONTAINER]',
    },
  ]);
  const [promptInput, setPromptInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiLogs, setAiLogs] = useState<AILog[]>(DEMO_AI_LOGS.filter((l) => l.project_id === project.id));

  // Ledger state & Tamper Simulation
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>(
    DEMO_LEDGER.filter((l) => l.project_id === project.id)
  );
  const [isTampered, setIsTampered] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    brokenIndex?: number;
    message: string;
  } | null>(null);

  // Contributions State
  const [contributions, setContributions] = useState<Contribution[]>(
    DEMO_CONTRIBUTIONS.filter((c) => c.project_id === project.id)
  );
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [contribType, setContribType] = useState('code');
  const [contribDesc, setContribDesc] = useState('');
  const [contribArtifact, setContribArtifact] = useState('');
  const [contribAiInvolvement, setContribAiInvolvement] = useState<'none' | 'ai_assisted' | 'ai_generated'>('ai_assisted');

  // Protected Files & Watermark Modal
  const [watermarkedFile, setWatermarkedFile] = useState<{ name: string; size: string; hash: string } | null>(null);

  // Interactive Task Board State
  const [tasks, setTasks] = useState([
    { id: 't-1', title: 'Implement NovaScan v3 normalization in PyTorch', assignee: 'Rishaban MP', status: 'completed', milestone: 'ms-1' },
    { id: 't-2', title: 'Data augmentation for blur and low-light retinal scans', assignee: 'Rishaban MP', status: 'completed', milestone: 'ms-1' },
    { id: 't-3', title: 'Design lightweight CNN/Transformer backbone for Jetson Nano', assignee: 'Rishaban MP', status: 'in_progress', milestone: 'ms-2' },
    { id: 't-4', title: 'Setup validation loss benchmark against FDA sensitivity bar (>90%)', assignee: 'Dr. Meera Krishnan', status: 'todo', milestone: 'ms-2' },
    { id: 't-5', title: 'Clinical edge inference latency test on Raspberry Pi 4', assignee: 'Priya Sharma', status: 'todo', milestone: 'ms-3' },
  ]);

  const tabs = [
    { id: 'tasks', label: 'Milestones & Tasks', icon: <CheckCircle2 size={14} /> },
    { id: 'ai-gateway', label: 'AI Policy Gateway', icon: <Bot size={14} /> },
    { id: 'files', label: 'Confidential Data Room', icon: <Lock size={14} /> },
    { id: 'contributions', label: 'Contributions Log', count: contributions.length, icon: <GitCommitHorizontal size={14} /> },
    { id: 'ledger', label: 'SHA-256 Ledger', count: ledgerEntries.length, icon: <Shield size={14} /> },
    { id: 'charter', label: 'Charter & Team', icon: <FileText size={14} /> },
  ];

  // Handle AI Agent Prompts
  const handleSendPrompt = (presetText?: string) => {
    const textToSend = presetText || promptInput;
    if (!textToSend.trim() || isAiLoading) return;

    const userMsg = { sender: 'user' as const, text: textToSend };
    setChatMessages((prev) => [...prev, userMsg]);
    setPromptInput('');
    setIsAiLoading(true);

    setTimeout(() => {
      let agentReply = '';
      let requiresApproval = false;

      if (textToSend.includes('retinal') || textToSend.includes('NovaScan') || textToSend.includes('normalization')) {
        agentReply = `[LOCAL MODEL EXECUTION - ZERO DATA LEAKAGE]\n\nAnalysis of NovaScan v3 normalization pipeline:\n- Normalizes fundus images to 512x512 with green-channel CLAHE (Contrast Limited Adaptive Histogram Equalization).\n- Mean RGB shifted to [0.485, 0.456, 0.406] and std [0.229, 0.224, 0.225].\n- Note: High Sensitivity data flag active. External cloud transmission blocked. Recommendation: Quantize to INT8 for Jetson Nano TensorRT engine to gain 3.4x throughput.`;
        requiresApproval = true;
      } else if (textToSend.includes('Raspberry') || textToSend.includes('edge') || textToSend.includes('RAM')) {
        agentReply = `[LOCAL MODEL EXECUTION - CODELLAMA-7B]\n\nEdge Hardware Constraints Check:\n- Raspberry Pi 4 (4GB RAM) has ~2.1GB headroom for model graph.\n- With ONNX Runtime + ARM NEON execution provider, a MobileNetV4 / TinyTransformer model consumes 38MB flash and 310MB peak RAM during FP16 inference.\n- Target latency estimated: 1.84s per scan (within <3s requirement).`;
        requiresApproval = true;
      } else {
        agentReply = `[POLICY GATEWAY PROCESSED]\n\nBased on Project Charter v1 specifications, the proposed architecture meets the milestone acceptance criteria. All intermediate outputs are tracked under local hash-chain logging.`;
        requiresApproval = false;
      }

      const agentMsg = {
        sender: 'agent' as const,
        text: agentReply,
        model: 'llama3-8b-instruct [LOCAL AIR-GAPPED]',
        requiresApproval,
        approved: false,
      };

      setChatMessages((prev) => [...prev, agentMsg]);
      setIsAiLoading(false);

      // Add to AI audit log
      const newLog: AILog = {
        id: `log-${Date.now()}`,
        agent_id: `agent-${selectedAgent}`,
        project_id: project.id,
        human_owner_id: user?.id || 'user-student-1',
        agent_type: selectedAgent,
        request: textToSend,
        response: agentReply.slice(0, 120) + '...',
        model: 'llama3-8b-instruct',
        provider: 'ollama_local',
        data_sensitivity: project.sensitivity_level,
        input_scope: 'milestone-2-edge-optimization',
        approval_status: requiresApproval ? 'pending' : 'approved',
        fallback_used: false,
        created_at: new Date().toISOString(),
      };
      setAiLogs((prev) => [newLog, ...prev]);
    }, 900);
  };

  // Ledger Verification & Tamper Simulation
  const handleVerifyLedger = () => {
    if (isTampered) {
      setVerificationResult({
        valid: false,
        brokenIndex: 2,
        message: 'CRITICAL ALERT: SHA-256 Hash Mismatch at Block #3! Content hash was modified without cascading cryptographic proof. Chain integrity compromised.',
      });
    } else {
      setVerificationResult({
        valid: true,
        message: `Ledger Integrity Verified: All ${ledgerEntries.length} blocks sequentially validated against previous hashes. Genesis root hash intact.`,
      });
    }
  };

  const handleSimulateTamper = () => {
    setIsTampered(true);
    setLedgerEntries((prev) =>
      prev.map((entry, idx) =>
        idx === 2
          ? {
              ...entry,
              action: '[UNAUTHORIZED EDIT] Awarded 500 Credits to External Actor',
              metadata: { ...entry.metadata, tampered: true },
            }
          : entry
      )
    );
    setVerificationResult({
      valid: false,
      brokenIndex: 2,
      message: 'SIMULATION ACTIVE: Block #3 was altered. Run "Verify Ledger Integrity" to trigger cryptographic detection.',
    });
  };

  const handleRestoreLedger = () => {
    setIsTampered(false);
    setLedgerEntries(DEMO_LEDGER.filter((l) => l.project_id === project.id));
    setVerificationResult(null);
  };

  // Record New Contribution
  const handleRecordContribution = (e: React.FormEvent) => {
    e.preventDefault();
    const newContrib: Contribution = {
      id: `contrib-${Date.now()}`,
      project_id: project.id,
      contributor_id: user?.id || 'user-student-1',
      role: 'student',
      type: contribType as any,
      description: contribDesc,
      artifact_url: contribArtifact || 'https://github.com/novabiotech/edge-retina/commit/8f2a1',
      ai_involvement: contribAiInvolvement,
      status: 'approved',
      credits_awarded: 25,
      created_at: new Date().toISOString(),
    };

    setContributions([newContrib, ...contributions]);

    // Append to ledger
    const lastEntry = ledgerEntries[ledgerEntries.length - 1];
    const newBlock: LedgerEntry = {
      id: ledgerEntries.length + 1,
      project_id: project.id,
      actor_id: user?.id || 'user-student-1',
      actor_type: 'human',
      action: `Recorded contribution: ${contribType} (${contribAiInvolvement})`,
      content_hash: '9f8e7d6c5b4a3210fe9876543210abcd',
      previous_hash: lastEntry?.entry_hash || '0000000000000000',
      entry_hash: '3a1b2c4d5e6f7a8b9c0d1e2f3a4b5c6d',
      timestamp: new Date().toISOString(),
      metadata: { contribution_id: newContrib.id, type: contribType },
    };
    setLedgerEntries([...ledgerEntries, newBlock]);

    setIsContributionModalOpen(false);
    setContribDesc('');
    setContribArtifact('');
  };

  // Move task status
  const handleAdvanceTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const nextStatus =
          t.status === 'todo' ? 'in_progress' : t.status === 'in_progress' ? 'completed' : 'completed';
        return { ...t, status: nextStatus };
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors mb-1 cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Projects
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-[#0F172A]">{project.title}</h1>
            <SensitivityBadge level={project.sensitivity_level} />
            <StatusBadge status={project.status} />
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Governed Research Workspace • Charter v1.0 Signatory Active • Organization:{' '}
            <strong className="text-[#0F172A]">{project.organization?.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={<Plus size={14} />}
            onClick={() => setIsContributionModalOpen(true)}
          >
            Log Contribution
          </Button>
          <Button
            size="sm"
            icon={<Bot size={14} />}
            onClick={() => setActiveTab('ai-gateway')}
          >
            AI Assistant
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
              <span className="text-xs font-semibold text-[#15803D] bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#DCFCE7]">
                Milestone 1 Completed ($20,000 Escrow Released)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {milestones.map((m, idx) => (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                    m.status === 'accepted'
                      ? 'border-[#86EFAC] bg-[#F0FDF4]'
                      : m.status === 'in_progress'
                      ? 'border-[#93C5FD] bg-[#EFF6FF]'
                      : 'border-[#E2E8F0] bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0F172A]">M{idx + 1}</span>
                    <StatusBadge status={m.status} />
                  </div>
                  <p className="font-semibold text-[#0F172A] line-clamp-1">{m.title}</p>
                  <p className="text-[11px] text-[#64748B] line-clamp-2">{m.acceptance_criteria}</p>
                  <div className="pt-1 border-t border-[#CBD5E1]/40 flex justify-between font-medium">
                    <span className="text-[#64748B]">Escrow Allocation</span>
                    <strong className="text-[#0F172A]">${m.budget_allocation.toLocaleString()}</strong>
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
                  To Do ({tasks.filter((t) => t.status === 'todo').length})
                </span>
              </div>
              <div className="space-y-2">
                {tasks
                  .filter((t) => t.status === 'todo')
                  .map((task) => (
                    <Card key={task.id} className="p-3.5 bg-white border-[#E2E8F0] hover:border-[#94A3B8] transition-colors">
                      <p className="text-xs font-semibold text-[#0F172A]">{task.title}</p>
                      <div className="flex items-center justify-between mt-3 text-[11px] text-[#64748B]">
                        <span>Assigned: {task.assignee}</span>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-6 text-[11px] px-2 py-0"
                          onClick={() => handleAdvanceTask(task.id)}
                        >
                          Start
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>

            {/* Column: In Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">
                  In Progress ({tasks.filter((t) => t.status === 'in_progress').length})
                </span>
              </div>
              <div className="space-y-2">
                {tasks
                  .filter((t) => t.status === 'in_progress')
                  .map((task) => (
                    <Card key={task.id} className="p-3.5 bg-white border-[#93C5FD] shadow-xs">
                      <p className="text-xs font-semibold text-[#0F172A]">{task.title}</p>
                      <div className="flex items-center justify-between mt-3 text-[11px] text-[#64748B]">
                        <span>Assigned: {task.assignee}</span>
                        <Button
                          size="sm"
                          className="h-6 text-[11px] px-2 py-0"
                          onClick={() => handleAdvanceTask(task.id)}
                        >
                          Complete & Log
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>

            {/* Column: Completed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#15803D]">
                  Completed & Verified ({tasks.filter((t) => t.status === 'completed').length})
                </span>
              </div>
              <div className="space-y-2">
                {tasks
                  .filter((t) => t.status === 'completed')
                  .map((task) => (
                    <Card key={task.id} className="p-3.5 bg-[#F0FDF4] border-[#BBF7D0]">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#166534]">
                        <CheckCircle2 size={13} />
                        <span>{task.title}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[11px] text-[#15803D]">
                        <span>Completed by {task.assignee}</span>
                        <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-[#86EFAC]">
                          Hash Locked ✓
                        </span>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI Policy Gateway & Assistant */}
      {activeTab === 'ai-gateway' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Chat Interface */}
          <div className="lg:col-span-2 space-y-4">
            {/* Policy Enforcement Banner */}
            <div className="p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-lg text-xs text-[#92400E] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-[#B45309]" />
                <span>
                  <strong>AI Policy Gateway Active:</strong> Sensitivity Level is{' '}
                  <span className="uppercase font-bold">{project.sensitivity_level}</span>.
                  External cloud LLM access is blocked. Running via air-gapped local container (Ollama / Llama-3).
                </span>
              </div>
              <span className="text-[10px] bg-[#92400E] text-white px-2 py-0.5 rounded font-mono">
                EGRESS: ZERO
              </span>
            </div>

            {/* Agent Persona Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#334155]">Active Agent:</span>
              {(['research', 'developer', 'reviewer'] as const).map((agent) => (
                <button
                  key={agent}
                  onClick={() => setSelectedAgent(agent)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer capitalize transition-colors ${
                    selectedAgent === agent
                      ? 'bg-[#0F172A] text-white'
                      : 'bg-white border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {agent} Agent
                </button>
              ))}
            </div>

            {/* Chat Box */}
            <Card className="h-[420px] flex flex-col bg-white border-[#CBD5E1]">
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#1D4ED8] text-white'
                          : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A]'
                      }`}
                    >
                      {msg.model && (
                        <div className="text-[10px] font-mono text-[#64748B] mb-1 flex items-center gap-1">
                          <Bot size={11} /> {msg.model}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    {msg.requiresApproval && (
                      <div className="mt-1 flex items-center gap-2 text-[11px]">
                        <span className="text-[#B45309] font-medium flex items-center gap-1">
                          <Clock size={11} /> Mentor Verification Required
                        </span>
                        {!msg.approved ? (
                          <button
                            onClick={() => {
                              setChatMessages((prev) =>
                                prev.map((m, idx) => (idx === i ? { ...m, approved: true } : m))
                              );
                            }}
                            className="text-[#15803D] font-bold hover:underline cursor-pointer"
                          >
                            [Approve Artifact & Sign]
                          </button>
                        ) : (
                          <span className="text-[#15803D] font-bold">✓ Approved & Logged</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex items-center gap-2 text-xs text-[#64748B] p-2">
                    <RefreshCw size={14} className="animate-spin text-[#1D4ED8]" />
                    <span>Executing local model inference inside edge sandbox...</span>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Ask ${selectedAgent} agent about code, architecture, or clinical benchmarks...`}
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
                    className="flex-1 px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
                  />
                  <Button
                    size="sm"
                    icon={<Send size={14} />}
                    onClick={() => handleSendPrompt()}
                    disabled={isAiLoading || !promptInput.trim()}
                  >
                    Send
                  </Button>
                </div>

                {/* Preset Prompt Buttons */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-[#64748B] self-center">Test Presets:</span>
                  {[
                    'Analyze NovaScan v3 normalization parameters',
                    'Check Raspberry Pi 4 RAM constraints for ONNX model',
                    'Draft clinical validation criteria for FDA Class II',
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendPrompt(p)}
                      className="text-[10px] bg-white text-[#475569] border border-[#CBD5E1] px-2 py-0.5 rounded hover:bg-[#F1F5F9] cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Col: AI Activity Audit Log */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              AI Activity Audit Log
            </h3>
            <Card className="p-4 bg-white space-y-3">
              <p className="text-[11px] text-[#64748B]">
                All AI queries are hashed and logged to ensure non-human generation is visibly attributed.
              </p>
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto">
                {aiLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded border border-[#E2E8F0] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F172A] capitalize">{log.agent_type} Agent</span>
                      <span className="text-[10px] font-mono text-[#64748B]">{log.model}</span>
                    </div>
                    <p className="text-[#334155] line-clamp-1 italic">"{log.request}"</p>
                    <div className="flex items-center justify-between pt-1 border-t border-[#F1F5F9] text-[10px]">
                      <span className="text-[#64748B]">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span
                        className={`font-semibold ${
                          log.approval_status === 'approved' ? 'text-[#15803D]' : 'text-[#B45309]'
                        }`}
                      >
                        {log.approval_status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: Confidential Data Room & Watermarked Download */}
      {activeTab === 'files' && (
        <Card className="p-6 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <Lock size={16} className="text-[#991B1B]" /> Confidential Research Data Room
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Protected proprietary assets. Every download is cryptographically watermarked and audited.
              </p>
            </div>
            <SensitivityBadge level="high" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">File Name</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Confidentiality</th>
                  <th className="py-2.5 px-3">Export Policy</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {[
                  { name: 'novascan_v3_preprocessing.py', size: '48 KB', sens: 'high', policy: 'Restricted (Air-gapped)' },
                  { name: 'retinal_annotations_sample_1000.csv', size: '2.4 MB', sens: 'critical', policy: 'Restricted (Signatories Only)' },
                  { name: 'edge_benchmark_jetson_nano.json', size: '12 KB', sens: 'medium', policy: 'Authorized Team' },
                  { name: 'researchmesh_charter_v1_signed.pdf', size: '180 KB', sens: 'low', policy: 'Open to Members' },
                ].map((file, i) => (
                  <tr key={i} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-3 font-semibold text-[#0F172A] flex items-center gap-2">
                      <FileText size={14} className="text-[#1D4ED8]" />
                      {file.name}
                    </td>
                    <td className="py-3 px-3 text-[#64748B]">{file.size}</td>
                    <td className="py-3 px-3">
                      <SensitivityBadge level={file.sens as any} />
                    </td>
                    <td className="py-3 px-3 text-[#64748B]">{file.policy}</td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Download size={13} />}
                        onClick={() =>
                          setWatermarkedFile({
                            name: file.name,
                            size: file.size,
                            hash: 'a7b8c9d0e1f234567890abcdef123456',
                          })
                        }
                      >
                        Protected Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: Contributions Provenance */}
      {activeTab === 'contributions' && (
        <Card className="p-6 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Contribution Provenance Log</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Every code commit, review, and AI-assisted artifact recorded with credit distribution.
              </p>
            </div>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setIsContributionModalOpen(true)}>
              Record Contribution
            </Button>
          </div>

          <div className="space-y-3">
            {contributions.map((c) => {
              const contributor = DEMO_USERS.find((u) => u.id === c.contributor_id);
              return (
                <div key={c.id} className="p-4 rounded-lg border border-[#E2E8F0] text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0F172A]">{contributor?.display_name || 'Contributor'}</span>
                      <span className="text-[11px] text-[#64748B] capitalize">({c.role})</span>
                      <span className="text-xs font-semibold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded capitalize">
                        {c.type}
                      </span>
                      {c.ai_involvement !== 'none' && (
                        <span className="text-[10px] font-semibold text-[#B45309] bg-[#FFFBEB] px-1.5 py-0.5 rounded border border-[#FEF3C7]">
                          AI-Assisted (Llama-3 Directed)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#0F172A]">+{c.credits_awarded} Credits</span>
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                  <p className="text-[#334155]">{c.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1">
                    <span>Artifact: <code className="text-[#1D4ED8]">{c.artifact_url}</code></span>
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* TAB 5: SHA-256 Tamper-Evident Ledger */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <Card className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <Shield size={16} className="text-[#1D4ED8]" /> Cryptographic SHA-256 Ledger
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Sequential hash chain proving origin, authorship, and tamper-resistance.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" icon={<RefreshCw size={14} />} onClick={handleVerifyLedger}>
                Verify Ledger Integrity
              </Button>
              {!isTampered ? (
                <Button size="sm" variant="danger" icon={<AlertTriangle size={14} />} onClick={handleSimulateTamper}>
                  Simulate Tampering
                </Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={handleRestoreLedger}>
                  Restore Ledger
                </Button>
              )}
            </div>
          </Card>

          {/* Verification Result Banner */}
          {verificationResult && (
            <div
              className={`p-4 rounded-lg border text-xs leading-relaxed ${
                verificationResult.valid
                  ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534]'
                  : 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
              }`}
            >
              <div className="flex items-center gap-2 font-bold mb-1">
                {verificationResult.valid ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{verificationResult.valid ? 'LEDGER VERIFIED INTACT' : 'TAMPER DETECTED BY CRYPTOGRAPHIC AUDIT'}</span>
              </div>
              <p>{verificationResult.message}</p>
            </div>
          )}

          {/* Block Chain Display */}
          <div className="space-y-3">
            {ledgerEntries.map((entry, index) => {
              const isCorrupted = isTampered && index === 2;
              return (
                <Card
                  key={entry.id}
                  className={`p-4 bg-white transition-all duration-150 ${
                    isCorrupted
                      ? 'border-[#EF4444] bg-[#FEF2F2] ring-2 ring-[#EF4444]'
                      : 'border-[#CBD5E1]'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 text-xs">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-[#0F172A] text-white px-2 py-0.5 rounded">
                          Block #{entry.id}
                        </span>
                        <span className="font-semibold text-[#0F172A]">{entry.action}</span>
                        {isCorrupted && (
                          <span className="text-[10px] font-bold text-[#B91C1C] bg-[#FEE2E2] px-1.5 py-0.5 rounded animate-pulse">
                            CORRUPTED ENTRY
                          </span>
                        )}
                      </div>

                      <div className="font-mono text-[11px] space-y-0.5 text-[#475569]">
                        <div>
                          <span className="text-[#94A3B8]">Content Hash: </span>
                          <span className="text-[#0F172A]">{entry.content_hash}</span>
                        </div>
                        <div>
                          <span className="text-[#94A3B8]">Prev Block Hash: </span>
                          <span className="text-[#64748B]">{entry.previous_hash}</span>
                        </div>
                        <div>
                          <span className="text-[#94A3B8]">Entry SHA-256: </span>
                          <strong className={isCorrupted ? 'text-[#B91C1C]' : 'text-[#1D4ED8]'}>
                            {entry.entry_hash}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-[#64748B] shrink-0">
                      <div>Actor: <strong className="text-[#0F172A]">{entry.actor_type.toUpperCase()}</strong></div>
                      <div>{new Date(entry.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: Charter & Team */}
      {activeTab === 'charter' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 p-6 bg-white space-y-4">
            <h3 className="text-base font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3">
              Research Charter Terms — Active Agreement
            </h3>
            <div className="space-y-3 text-xs text-[#334155] leading-relaxed">
              <p><strong>IP Allocation:</strong> {project.ip_ownership}</p>
              <p><strong>Authorship Threshold:</strong> {project.authorship_rules}</p>
              <p><strong>Commercialization:</strong> {project.commercialization_terms || 'Non-commercial open research.'}</p>
              <p><strong>AI Usage:</strong> All AI generated code and text must be processed via Policy Gateway with human sign-off.</p>
            </div>
          </Card>

          <Card className="p-6 bg-white space-y-4">
            <h3 className="text-base font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3">
              Workspace Team ({members.length})
            </h3>
            <div className="space-y-3">
              {members.map((m) => {
                const u = DEMO_USERS.find((usr) => usr.id === m.user_id);
                return (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center text-xs font-bold">
                      {u?.display_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">{u?.display_name}</p>
                      <p className="text-[10px] text-[#64748B] capitalize">{m.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Contribution Modal */}
      <Modal
        isOpen={isContributionModalOpen}
        onClose={() => setIsContributionModalOpen(false)}
        title="Record Research Contribution"
        subtitle="Cryptographically logged to append-only SHA-256 ledger"
      >
        <form onSubmit={handleRecordContribution} className="space-y-4">
          <Select
            label="Contribution Type"
            value={contribType}
            onChange={(e) => setContribType(e.target.value)}
            options={[
              { value: 'code', label: 'Code Implementation' },
              { value: 'research', label: 'Research Paper / Theoretical Analysis' },
              { value: 'dataset', label: 'Dataset Curation / Cleaning' },
              { value: 'review', label: 'Peer Review & Clinical Validation' },
              { value: 'experiment', label: 'Edge Benchmark & Experimentation' },
            ]}
          />

          <Select
            label="AI Involvement Disclosure"
            value={contribAiInvolvement}
            onChange={(e) => setContribAiInvolvement(e.target.value as any)}
            options={[
              { value: 'none', label: 'None (Pure Human Contribution)' },
              { value: 'ai_assisted', label: 'AI-Assisted (Human Directed & Reviewed)' },
              { value: 'ai_generated', label: 'AI-Generated (Requires Explicit Mentor Approval)' },
            ]}
          />

          <Textarea
            label="Contribution Description"
            placeholder="Describe the research deliverable, methodology, or PR details..."
            rows={3}
            value={contribDesc}
            onChange={(e) => setContribDesc(e.target.value)}
            required
          />

          <Input
            label="Artifact Repository URL or SHA-256 Hash"
            placeholder="e.g., https://github.com/novabiotech/retina-edge/commit/7a8b9c"
            value={contribArtifact}
            onChange={(e) => setContribArtifact(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsContributionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Commit to Ledger
            </Button>
          </div>
        </form>
      </Modal>

      {/* Watermarked Download Preview Modal */}
      <Modal
        isOpen={!!watermarkedFile}
        onClose={() => setWatermarkedFile(null)}
        title="Protected File Watermarking"
        subtitle={watermarkedFile?.name}
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-[#991B1B] space-y-2">
            <p className="font-bold flex items-center gap-1.5">
              <Lock size={14} /> DYNAMIC WATERMARK ATTACHED
            </p>
            <p className="font-mono text-[11px] bg-white p-2.5 rounded border border-[#FECACA]">
              CONFIDENTIAL • LICENSED TO: {user?.display_name.toUpperCase()} ({user?.email}) • TIMESTAMP: {new Date().toISOString()} • SHA-256 HASH: {watermarkedFile?.hash} • TAMPERING PROHIBITED BY CHARTER
            </p>
            <p className="text-[11px]">
              This file contains proprietary research data. Downloading logs an audit record to the admin security ledger.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="secondary" onClick={() => setWatermarkedFile(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              icon={<Download size={14} />}
              onClick={() => {
                alert(`Protected file "${watermarkedFile?.name}" downloaded with cryptographic watermark embedded.`);
                setWatermarkedFile(null);
              }}
            >
              Confirm & Download Watermarked File
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
