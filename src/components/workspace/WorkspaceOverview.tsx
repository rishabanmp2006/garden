import React from 'react';
import {
  CheckCircle2,
  GitCommitHorizontal,
  Users,
  ArrowRight,
  FileText,
  Calendar
} from 'lucide-react';
import { Button } from '../ui/Button';
import { StatusBadge, SensitivityBadge } from '../ui/Badge';
import type { WorkspaceTabId } from './WorkspaceSidebar';

interface WorkspaceOverviewProps {
  project: any;
  milestones: any[];
  tasks: any[];
  contributions: any[];
  members: any[];
  onNavigateTab: (tab: WorkspaceTabId) => void;
}

export function WorkspaceOverview({
  project,
  milestones,
  tasks,
  contributions,
  members,
  onNavigateTab,
}: WorkspaceOverviewProps) {
  const openTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'approved');
  const activeMilestone = milestones.find((m) => m.status === 'in_progress') || milestones[0];
  const recentContribs = contributions.slice(0, 5);
  const activeMembers = members.filter((m) => m.status === 'active');

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full">
      {/* Project Summary Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={project.status || 'active'} />
              <SensitivityBadge level={project.sensitivity_level || 'high'} />
              <span className="text-xs font-semibold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#DBEAFE]">
                {project.domain}
              </span>
            </div>

            <h1 className="text-xl font-bold text-[#0F172A] pt-1">
              {project.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => onNavigateTab('discussions')}
            >
              Open Discussions
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onNavigateTab('tasks')}
            >
              View Tasks
            </Button>
          </div>
        </div>

        <p className="text-xs text-[#475569] leading-relaxed">
          {project.public_summary}
        </p>

        {/* Real Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#F1F5F9]">
          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#F1F5F9]">
            <p className="text-[11px] font-medium text-[#64748B]">Active Team</p>
            <p className="text-lg font-bold text-[#0F172A] mt-0.5">{activeMembers.length}</p>
          </div>
          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#F1F5F9]">
            <p className="text-[11px] font-medium text-[#64748B]">Open Tasks</p>
            <p className="text-lg font-bold text-[#0F172A] mt-0.5">{openTasks.length}</p>
          </div>
          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#F1F5F9]">
            <p className="text-[11px] font-medium text-[#64748B]">Milestones</p>
            <p className="text-lg font-bold text-[#0F172A] mt-0.5">{milestones.length}</p>
          </div>
          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#F1F5F9]">
            <p className="text-[11px] font-medium text-[#64748B]">Contributions</p>
            <p className="text-lg font-bold text-[#0F172A] mt-0.5">{contributions.length}</p>
          </div>
        </div>
      </div>

      {/* Grid: Milestones & Tasks + Team */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Milestones & Open Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Milestone Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#0F172A] uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#1D4ED8]" />
                Current Milestone
              </h2>
              {activeMilestone && (
                <StatusBadge status={activeMilestone.status} />
              )}
            </div>

            {activeMilestone ? (
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-2">
                <h3 className="text-xs font-semibold text-[#0F172A]">
                  {activeMilestone.title}
                </h3>
                <p className="text-xs text-[#64748B]">
                  {activeMilestone.description || 'Milestone deliverables and progress tracking.'}
                </p>
                {activeMilestone.target_date && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] pt-1">
                    <Calendar size={12} />
                    Target: {new Date(activeMilestone.target_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#64748B]">No active milestone defined.</p>
            )}
          </div>

          {/* Open Tasks Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#0F172A] uppercase tracking-wide flex items-center gap-1.5">
                <FileText size={14} className="text-[#1D4ED8]" />
                Open Tasks ({openTasks.length})
              </h2>
              <button
                onClick={() => onNavigateTab('tasks')}
                className="text-xs text-[#1D4ED8] hover:underline font-medium inline-flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </button>
            </div>

            {openTasks.length === 0 ? (
              <p className="text-xs text-[#64748B]">No open tasks pending.</p>
            ) : (
              <div className="space-y-2">
                {openTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-[#0F172A] truncate">
                        {task.title}
                      </p>
                      <p className="text-[11px] text-[#64748B] truncate">
                        {task.description || 'Task assignment'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {task.credits_reward && (
                        <span className="text-[10px] font-semibold text-[#B45309] bg-[#FEF3C7] px-1.5 py-0.5 rounded">
                          {task.credits_reward} Credits
                        </span>
                      )}
                      <StatusBadge status={task.status || 'open'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Team Roster & Recent Contributions */}
        <div className="space-y-6">
          {/* Team Roster */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#0F172A] uppercase tracking-wide flex items-center gap-1.5">
                <Users size={14} className="text-[#1D4ED8]" />
                Team Roster ({activeMembers.length})
              </h2>
              <button
                onClick={() => onNavigateTab('team')}
                className="text-xs text-[#1D4ED8] hover:underline font-medium inline-flex items-center gap-1"
              >
                View <ArrowRight size={12} />
              </button>
            </div>

            <div className="space-y-2">
              {activeMembers.map((m) => {
                const name = m.profiles?.display_name || m.profiles?.email?.split('@')[0] || 'Researcher';
                const role = m.role || 'Contributor';
                return (
                  <div key={m.id} className="flex items-center gap-2.5 p-1.5 rounded hover:bg-[#F8FAFC]">
                    <div className="w-7 h-7 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[#1D4ED8] flex items-center justify-center text-[10px] font-bold">
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#0F172A] truncate">{name}</p>
                      <p className="text-[10px] text-[#64748B] capitalize">{role.replace('_', ' ')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Contributions */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#0F172A] uppercase tracking-wide flex items-center gap-1.5">
                <GitCommitHorizontal size={14} className="text-[#1D4ED8]" />
                Recent Work ({contributions.length})
              </h2>
              <button
                onClick={() => onNavigateTab('contributions')}
                className="text-xs text-[#1D4ED8] hover:underline font-medium inline-flex items-center gap-1"
              >
                Log <ArrowRight size={12} />
              </button>
            </div>

            {recentContribs.length === 0 ? (
              <p className="text-xs text-[#64748B]">No contributions logged yet.</p>
            ) : (
              <div className="space-y-2">
                {recentContribs.map((c) => (
                  <div key={c.id} className="p-2 bg-[#F8FAFC] rounded border border-[#E2E8F0] text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-[#0F172A] truncate">{c.file_name || 'Deliverable'}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    {c.description && (
                      <p className="text-[10px] text-[#64748B] truncate mt-0.5">{c.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
