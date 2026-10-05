import { useState, useEffect } from 'react';
import {
  Bot, Shield, Send, Sparkles, AlertCircle,
  Clock, CheckCircle2, Lock, Cpu, Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { fetchProjects, queryAIGateway } from '../../lib/api';

export function AIPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<'developer' | 'research' | 'reviewer'>('developer');
  const [prompt, setPrompt] = useState('');
  const [chat, setChat] = useState<
    { sender: 'user' | 'agent'; text: string; model?: string; executionType?: string; promptHash?: string }[]
  >([
    {
      sender: 'agent',
      text: 'AI Policy Gateway initialized. I am your ResearchMesh AI assistant. Depending on the sensitivity level of your selected project, queries are executed either on local air-gapped models (Ollama Llama-3) or authorized cloud providers. How can I help your research today?',
      model: 'llama3-8b-instruct [LOCAL AIR-GAPPED CONTAINER]',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setProjectsLoading(true);
      try {
        const projs = await fetchProjects();
        setProjects(projs || []);
        if (projs && projs.length > 0) {
          setSelectedProjectId(projs[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setProjectsLoading(false);
      }
    }
    load();
  }, []);

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || prompt;
    if (!q.trim() || loading || !activeProject || !user) return;

    setChat((prev) => [
      ...prev,
      { sender: 'user', text: q, model: 'User Prompt' },
    ]);
    setPrompt('');
    setLoading(true);

    try {
      const res = await queryAIGateway({
        project_id: activeProject.id,
        user_id: user.id,
        agent_type: selectedAgent,
        prompt: q,
        project_sensitivity: activeProject.sensitivity_level || 'high',
        target_hardware: 'Raspberry Pi 4 / NVIDIA Jetson Nano',
      });

      if (res) {
        setChat((prev) => [
          ...prev,
          {
            sender: 'agent',
            text: res.response,
            model: res.model_used,
            executionType: res.execution_type,
            promptHash: res.prompt_hash,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (projectsLoading) {
    return (
      <div className="py-24 text-center">
        <Loader2 size={36} className="mx-auto text-[#1D4ED8] animate-spin mb-3" />
        <h3 className="text-sm font-semibold text-[#0F172A]">Loading AI policy gateway...</h3>
      </div>
    );
  }

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
        {projects.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#64748B]">Project Context:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.sensitivity_level?.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Gateway Status Banner */}
      {activeProject && (
        <Card className="p-4 bg-white border-[#CBD5E1]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#1D4ED8]">
                <Shield size={18} />
              </div>
              <div>
                <span className="font-bold text-[#0F172A] block">Sensitivity Level</span>
                <span className="text-[#64748B] capitalize">{activeProject.sensitivity_level || 'high'} Sensitivity</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F0FDF4] flex items-center justify-center text-[#15803D]">
                <Cpu size={18} />
              </div>
              <div>
                <span className="font-bold text-[#0F172A] block">Compute Routing</span>
                <span className="text-[#64748B]">
                  {activeProject.sensitivity_level === 'high' || activeProject.sensitivity_level === 'critical'
                    ? 'Isolated Edge Container (Ollama)'
                    : 'Cloud Model Permitted'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#FFFBEB] flex items-center justify-center text-[#B45309]">
                <Lock size={18} />
              </div>
              <div>
                <span className="font-bold text-[#0F172A] block">Audit Integrity</span>
                <span className="text-[#64748B]">SHA-256 Provenance Chained</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main Chat Interface */}
      <Card className="p-5 bg-white space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex gap-2">
            {(['developer', 'research', 'reviewer'] as const).map((agent) => (
              <button
                key={agent}
                onClick={() => setSelectedAgent(agent)}
                className={`px-3 py-1.5 rounded-md text-xs capitalize cursor-pointer ${
                  selectedAgent === agent
                    ? 'bg-[#1D4ED8] text-white font-semibold'
                    : 'bg-[#F1F5F9] text-[#64748B]'
                }`}
              >
                {agent} Agent
              </button>
            ))}
          </div>
        </div>

        {/* Chat Log */}
        <div className="space-y-3 h-96 overflow-y-auto p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
          {chat.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-lg text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[#1D4ED8] text-white'
                    : 'bg-white border border-[#CBD5E1] text-[#0F172A] shadow-xs'
                }`}
              >
                {m.sender === 'agent' && (
                  <div className="text-[10px] font-bold text-[#1D4ED8] mb-1 flex items-center gap-1">
                    <Bot size={12} /> {m.model || 'Policy Gateway'}
                  </div>
                )}
                <pre className="whitespace-pre-wrap font-sans">{m.text}</pre>
                {m.promptHash && (
                  <div className="mt-2 pt-1 border-t border-[#E2E8F0] text-[9px] font-mono text-[#64748B]">
                    Prompt SHA-256: {m.promptHash.slice(0, 16)}...
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#64748B] p-2">
              <Loader2 size={14} className="animate-spin text-[#1D4ED8]" />
              <span>Routing prompt through AI Policy Gateway...</span>
            </div>
          )}
        </div>

        {/* Prompt Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type your research prompt (e.g., Explain CLAHE green-channel normalization on fundus scans)..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
          />
          <Button size="sm" onClick={() => handleSend()} disabled={loading}>
            <Send size={14} />
          </Button>
        </div>
      </Card>
    </div>
  );
}
