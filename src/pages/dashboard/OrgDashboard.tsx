import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, Users, Wallet, BarChart3,
  ArrowRight, CheckSquare, AlertCircle,
  Clock, Bot, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, StatCard } from '../../components/ui/Card';
import { StatusBadge, EngagementBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/EmptyState';
import {
  DEMO_PROJECTS, DEMO_MILESTONES, DEMO_APPLICATIONS,
  DEMO_ESCROW, DEMO_CONTRIBUTIONS, DEMO_MEMBERSHIPS,
} from '../../lib/demo-data';

export function OrgDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const orgProjects = DEMO_PROJECTS.filter(p => p.organization?.owner_id === user.id || p.org_id === 'org-1');
  const pendingApps = DEMO_APPLICATIONS.filter(a =>
    orgProjects.some(p => p.id === a.project_id) && a.status === 'pending'
  );
  const activeMilestones = DEMO_MILESTONES.filter(m => m.status === 'in_progress');
  const totalBudget = orgProjects.reduce((sum, p) => sum + p.budget, 0);
  const totalMembers = new Set(
    DEMO_MEMBERSHIPS.filter(m => orgProjects.some(p => p.id === m.project_id)).map(m => m.user_id)
  ).size;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Organization Dashboard"
        description="Manage your research projects and teams"
        actions={
          <Button onClick={() => navigate('/projects/create')} icon={<FolderOpen size={16} />}>
            Create Project
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Projects" value={orgProjects.filter(p => p.status === 'active').length} icon={<FolderOpen size={18} />} />
        <StatCard label="Team Members" value={totalMembers} icon={<Users size={18} />} />
        <StatCard label="Total Budget" value={`₹${(totalBudget / 1000).toFixed(0)}K`} subtitle="Across all projects" icon={<Wallet size={18} />} />
        <StatCard label="Pending Applications" value={pendingApps.length} icon={<AlertCircle size={18} />} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Projects */}
        <div className="col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Projects</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
                View all <ArrowRight size={14} />
              </Button>
            </CardHeader>
            <div className="space-y-3">
              {orgProjects.map(project => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/workspace/${project.id}`)}
                  className="flex items-center justify-between p-3 border border-[#E2E8F0] rounded-lg cursor-pointer hover:border-[#CBD5E1] hover:bg-[#F8FAFC] transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-[#0F172A]">{project.title}</p>
                      <StatusBadge status={project.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#64748B]">
                      <EngagementBadge model={project.engagement_model} />
                      <span>{project.domain}</span>
                      <span>·</span>
                      <span>{project.member_count} members</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-[#94A3B8]" />
                </div>
              ))}
            </div>
          </Card>

          {/* Milestones */}
          <Card>
            <CardHeader>
              <CardTitle>Milestone Progress</CardTitle>
            </CardHeader>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Milestone</th>
                  <th>Project</th>
                  <th>Budget</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_MILESTONES.slice(0, 4).map(ms => {
                  const proj = DEMO_PROJECTS.find(p => p.id === ms.project_id);
                  return (
                    <tr key={ms.id}>
                      <td className="font-medium">{ms.title}</td>
                      <td className="text-[#64748B]">{proj?.title?.slice(0, 30)}...</td>
                      <td>₹{(ms.budget_allocation / 1000).toFixed(0)}K</td>
                      <td className="text-[#64748B]">{new Date(ms.due_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</td>
                      <td><StatusBadge status={ms.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Pending Applications */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Applications</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/applicants')}>
                Review <ArrowRight size={14} />
              </Button>
            </CardHeader>
            {pendingApps.length === 0 ? (
              <p className="text-xs text-[#64748B]">No pending applications</p>
            ) : (
              pendingApps.map(app => (
                <div key={app.id} className="p-3 border border-[#E2E8F0] rounded-lg mb-2">
                  <p className="text-sm font-medium text-[#0F172A]">{app.role}</p>
                  <p className="text-xs text-[#64748B] mt-1 line-clamp-2">{app.message}</p>
                  {app.match_score && (
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp size={12} className="text-[#1D4ED8]" />
                      <span className="text-xs font-medium text-[#1D4ED8]">{Math.round(app.match_score * 100)}% match</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </Card>

          {/* Escrow Status */}
          <Card>
            <CardHeader>
              <CardTitle>Escrow Status</CardTitle>
              <span className="text-[10px] font-medium text-[#B45309] bg-[#FFFBEB] border border-[#FEF3C7] px-2 py-0.5 rounded">SIMULATED</span>
            </CardHeader>
            {DEMO_ESCROW.map(e => (
              <div key={e.id} className="p-3 border border-[#E2E8F0] rounded-lg mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#64748B]">{DEMO_MILESTONES.find(m => m.id === e.milestone_id)?.title}</span>
                  <StatusBadge status={e.status} />
                </div>
                <p className="text-sm font-semibold text-[#0F172A]">₹{e.total_amount.toLocaleString()}</p>
                <div className="mt-2 space-y-1">
                  <EscrowLine label="Contributor Pool" value={e.contributor_pool} total={e.total_amount} />
                  <EscrowLine label="Expert Allocation" value={e.expert_allocation} total={e.total_amount} />
                  <EscrowLine label="AI Compute" value={e.ai_compute_reserve} total={e.total_amount} />
                  <EscrowLine label="Platform Fee" value={e.platform_fee} total={e.total_amount} />
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

function EscrowLine({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = ((value / total) * 100).toFixed(0);
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[#64748B]">{label}</span>
      <span className="text-[#0F172A] font-medium">₹{value.toLocaleString()} ({pct}%)</span>
    </div>
  );
}
