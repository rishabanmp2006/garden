import React, { useState } from 'react';
import {
  Activity,
  ShieldCheck,
  User,
  Bot,
  Cpu,
  Clock,
  ChevronDown,
  ChevronUp,
  Hash,
  ExternalLink
} from 'lucide-react';

interface LedgerEntry {
  id?: number | string;
  action: string;
  actor_id?: string;
  actor_type?: 'human' | 'ai_agent' | 'system';
  timestamp?: string;
  entry_hash?: string;
  content_hash?: string;
  previous_hash?: string;
  metadata?: any;
}

interface WorkspaceActivityProps {
  entries: LedgerEntry[];
  isLoading?: boolean;
}

export function WorkspaceActivity({ entries, isLoading = false }: WorkspaceActivityProps) {
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  const formatTime = (ts?: string) => {
    if (!ts) return 'Recent';
    try {
      const d = new Date(ts);
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return ts;
    }
  };

  const getActorIcon = (actorType?: string) => {
    switch (actorType) {
      case 'ai_agent':
        return <Bot size={14} className="text-[#1D4ED8]" />;
      case 'system':
        return <Cpu size={14} className="text-[#059669]" />;
      case 'human':
      default:
        return <User size={14} className="text-[#475569]" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full">
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-[#15803D]" />
          <h2 className="text-sm font-bold text-[#0F172A]">
            Project Provenance Activity
          </h2>
        </div>
        <p className="text-xs text-[#64748B] leading-relaxed">
          Verifiable audit trail recorded in the immutable SHA-256 ledger. Every milestone action, team change, and deliverable submission is cryptographically timestamped.
        </p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-[#64748B]">
          Loading activity timeline...
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center text-xs text-[#64748B]">
          <Activity size={20} className="mx-auto text-[#94A3B8] mb-2" />
          No provenance entries recorded yet for this project.
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0]">
            {entries.map((entry, idx) => {
              const entryKey = entry.id || idx;
              const isExpanded = expandedId === entryKey;

              return (
                <div key={entryKey} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-[#1D4ED8] flex items-center justify-center text-[10px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-[#F1F5F9]">
                          {getActorIcon(entry.actor_type)}
                        </span>
                        <span className="text-xs font-semibold text-[#0F172A]">
                          {entry.action}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                        <Clock size={12} />
                        <span>{formatTime(entry.timestamp)}</span>
                      </div>
                    </div>

                    {/* Expandable technical details */}
                    {(entry.entry_hash || entry.content_hash) && (
                      <div className="pt-1">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : entryKey)}
                          className="text-[11px] font-medium text-[#1D4ED8] hover:underline inline-flex items-center gap-1"
                        >
                          <Hash size={11} />
                          <span>{isExpanded ? 'Hide cryptographic proof' : 'Verify cryptographic proof'}</span>
                          {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-[11px] font-mono text-[#475569] space-y-1.5">
                            {entry.entry_hash && (
                              <div className="truncate">
                                <span className="text-[#94A3B8]">Entry Hash: </span>
                                <span className="text-[#0F172A]">{entry.entry_hash}</span>
                              </div>
                            )}
                            {entry.content_hash && (
                              <div className="truncate">
                                <span className="text-[#94A3B8]">Content Hash: </span>
                                <span>{entry.content_hash}</span>
                              </div>
                            )}
                            {entry.previous_hash && (
                              <div className="truncate">
                                <span className="text-[#94A3B8]">Previous Hash: </span>
                                <span>{entry.previous_hash}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
