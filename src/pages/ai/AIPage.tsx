import { useState } from 'react';
import {
  Bot, Shield, Send, Sparkles, AlertCircle,
  Clock, CheckCircle2, Lock, Cpu
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DEMO_PROJECTS, DEMO_AI_LOGS } from '../../lib/demo-data';

export function AIPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(DEMO_PROJECTS[0].id);
  const [selectedAgent, setSelectedAgent] = useState<'research' | 'developer' | 'reviewer'>('research');
  const [prompt, setPrompt] = useState('');
  const [chat, setChat] = useState<
    { sender: 'user' | 'agent'; text: string; model: string; sensitivity: string; approved?: boolean }[]
  >([
    {
      sender: 'agent',
      text: 'AI Policy Gateway initialized. I am your Researchmesh AI agent. Depending on the sensitivity of your selected project, queries are executed either on local air-gapped models (Llama-3) or authorized cloud providers. How can I help your research today?',
      model: 'llama3-8b-instruct (Local Sandbox)',
      sensitivity: 'high',
      approved: true,
    },
  ]);
  const [loading, setLoading] = useState(false);

  const activeProject = DEMO_PROJECTS.find((p) => p.id === selectedProjectId) || DEMO_PROJECTS[0];

  const handleSend = (textToSend?: string) => {
    const q = textToSend || prompt;
    if (!q.trim() || loading) return;

    setChat((prev) => [
      ...prev,
      { sender: 'user', text: q, model: 'User Prompt', sensitivity: activeProject.sensitivity_level },
    ]);
    setPrompt('');
    setLoading(true);

    setTimeout(() => {
      let reply = '';
      if (activeProject.sensitivity_level === 'high' || activeProject.sensitivity_level === 'critical') {
        reply = `[ENFORCING LOCAL POLICY: ZERO DATA EGRESS]\n\nModel: Llama-3-8B-Instruct (Edge Isolated Node)\n\nResponse to: "${q}"\n\n1. Analysis: The requested deliverable complies with the project's IP Charter.\n2. Recommendation: When running edge inference on Jetson Nano, convert the PyTorch checkpoint to ONNX with FP16 precision. This achieves an estimated 82 FPS with 42MB memory footprint.\n3. Human Review Flag: Please have the designated mentor sign off on this architectural update before committing to the ledger.`;
      } else {
        reply = `[CLOUD REASONING MODEL PERMITTED - OPEN RESEARCH DOMAIN]\n\nAnalysis for "${q}":\n\nAll literature survey and code templates generated for this module are licensed under open MIT conditions as defined in Charter v1.0. Multi-agent cross-validation complete with 0 policy flags.`;
      }

      setChat((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: reply,
          model: activeProject.ai_policy.local_required
            ? 'llama3-8b-instruct (Local Edge Node)'
            : 'Claude 3.5 Sonnet (Cloud Router)',
          sensitivity: activeProject.sensitivity_level,
          approved: false,
        },
      ]);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
            <Bot size={22} className="text-[#1D4ED8]" /> Controlled AI Research Assistant
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Policy-guided agent workspace with privacy-bounded routing, local execution, and provenance logging.
          </p>
        </div>

        {/* Project Context Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#64748B]">Project Context:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
          >
            {DEMO_PROJECTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.sensitivity_level.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Gateway Status Banner */}
      <Card className="p-4 bg-white border-[#CBD5E1]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#1D4ED8]">
              <Shield size={18} />
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">
                Gateway Status
              </span>
              <strong className="text-[#0F172A]">
                {activeProject.ai_policy.local_required ? 'Local Isolation Enforced' : 'Cloud Hybrid Mode'}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F8FAFC] flex items-center justify-center text-[#475569]">
              <Cpu size={18} />
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">
                Active Execution Model
              </span>
              <strong className="text-[#0F172A]">
                {activeProject.ai_policy.local_required ? 'Llama-3-8B Local (Ollama)' : 'Cloud AI Router'}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FEF3C7] flex items-center justify-center text-[#B45309]">
              <Lock size={18} />
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">
                Data Sensitivity Level
              </span>
              <strong className="text-[#B45309] uppercase">{activeProject.sensitivity_level}</strong>
            </div>
          </div>
        </div>
      </Card>

      {/* Chat Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Agent persona tabs */}
          <div className="flex gap-2">
            {(['research', 'developer', 'reviewer'] as const).map((agent) => (
              <button
                key={agent}
                onClick={() => setSelectedAgent(agent)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-colors ${
                  selectedAgent === agent
                    ? 'bg-[#0F172A] text-white'
                    : 'bg-white border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {agent} Agent
              </button>
            ))}
          </div>

          <Card className="h-[460px] flex flex-col bg-white border-[#CBD5E1]">
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {chat.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#1D4ED8] text-white'
                        : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A]'
                    }`}
                  >
                    <div className="text-[10px] font-mono text-[#64748B] mb-1 flex items-center gap-1.5">
                      <Bot size={11} /> {msg.model}
                    </div>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-[#64748B] p-2">
                  <div className="w-2 h-2 rounded-full bg-[#1D4ED8] animate-ping" />
                  <span>Processing query through Policy Gateway...</span>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Consult ${selectedAgent} agent regarding experimental setups, edge code, or literature...`}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1 px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
                />
                <Button size="sm" icon={<Send size={14} />} onClick={() => handleSend()}>
                  Run Query
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <span className="text-[#64748B] self-center">Presets:</span>
                {[
                  'What edge inference optimizations apply to Raspberry Pi 4?',
                  'Verify clinical sensitivity thresholds for FDA Class II',
                  'Summarize literature on contrast normalization for diabetic retinopathy',
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(preset)}
                    className="bg-white border border-[#CBD5E1] text-[#475569] px-2 py-0.5 rounded hover:bg-[#F1F5F9] cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: AI Activity Log */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            System AI Provenance Logs
          </h3>
          <Card className="p-4 bg-white space-y-3">
            <p className="text-[11px] text-[#64748B]">
              Every prompt and inference token is cryptographically attributable to a human requester.
            </p>
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto">
              {DEMO_AI_LOGS.map((log) => (
                <div key={log.id} className="p-2.5 rounded border border-[#E2E8F0] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0F172A] capitalize">{log.agent_type}</span>
                    <span className="text-[10px] font-mono text-[#64748B]">{log.model}</span>
                  </div>
                  <p className="text-[#475569] line-clamp-1 italic">"{log.request}"</p>
                  <div className="flex items-center justify-between text-[10px] text-[#64748B] pt-1 border-t border-[#F8FAFC]">
                    <span>Sensitivity: <strong className="uppercase">{log.data_sensitivity}</strong></span>
                    <span className="text-[#15803D] font-semibold">APPROVED ✓</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
