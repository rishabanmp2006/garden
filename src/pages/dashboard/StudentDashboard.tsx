import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, GitCommitHorizontal, Coins, Star, Bot,
  ArrowRight, Clock, CheckCircle2, AlertCircle, FileText,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, StatCard } from '../../components/ui/Card';
import { Badge, StatusBadge, EngagementBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/EmptyState';
import {
  DEMO_PROJECTS, DEMO_CONTRIBUTIONS, DEMO_CREDITS,
  DEMO_AI_LOGS, DEMO_APPLICATIONS, getUserProjects,
  getUserCredits, getDemoProfile, DEMO_MEMBERSHIPS,
} from '../../lib/demo-data';

export function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const profile = getDemoProfile(user.id);
  const myProjects = getUserProjects(user.id);
  const totalCredits = getUserCredits(user.id);
  const myContributions = DEMO_CONTRIBUTIONS.filter(c => c.contributor_id === user.id);
  const myApplications = DEMO_APPLICATIONS.filter(a => a.user_id === user.id);
  const recentAILogs = DEMO_AI_LOGS.filter(l => l.human_owner_id === user.id).slice(0, 3);
  const approvedContribs = myContributions.filter(c => c.status === 'approved');

  // Recommended projects (projects user is NOT a member of)
  const memberProjectIds = DEMO_MEMBERSHIPS
    .filter(m => m.user_id === user.id)
    .map(m => m.project_id);
  const recommendedProjects = DEMO_PROJECTS.filter(p => !memberProjectIds.includes(p.id) && p.status === 'open');

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welcome back, ${user.display_name.split(' ')[0]}`}
        description="Your research activity overview"
      />

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Active Projects"
          value={myProjects.length}
          icon={<Briefcase size={18} />}
        />
        <StatCard
          label="Contributions"
          value={approvedContribs.length}
          subtitle="Verified"
          icon={<GitCommitHorizontal size={18} />}
        />
        <StatCard
          label="Total Credits"
          value={totalCredits}
          icon={<Coins size={18} />}
        />
        <StatCard
          label="Reputation"
          value="4.8"
          subtitle="12 ratings"
          icon={<Star size={18} />}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Current Workspaces */}
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Active Workspaces</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/workspaces')}>
                View all <ArrowRight size={14} />
              </Button>
            </CardHeader>
            {myProjects.length === 0 ? (
              <p className="text-sm text-[#64748B]">No active workspaces yet.</p>
            ) : (
              <div className="space-y-3">
                {myProjects.map(project => {
                  const membership = DEMO_MEMBERSHIPS.find(
                    m => m.project_id === project.id && m.user_id === user.id
                  );
                  return (
                    <div
                      key={project.id}
                      onClick={() => navigate(`/workspace/${project.id}`)}
                      className="flex items-center justify-between p-3 border border-[#E2E8F0] rounded-lg cursor-pointer hover:border-[#CBD5E1] hover:bg-[#F8FAFC] transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-[#0F172A] truncate">{project.title}</p>
                          <EngagementBadge model={project.engagement_model} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#64748B]">
                          <span>{project.organization?.name}</span>
                          <span>·</span>
                          <span className="capitalize">{membership?.role || 'member'}</span>
                          <span>·</span>
                          <StatusBadge status={project.status} />
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-[#94A3B8]" />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Recent Contributions */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Recent Contributions</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/contributions')}>
                View all <ArrowRight size={14} />
              </Button>
            </CardHeader>
            <div className="space-y-0">
              {myContributions.slice(0, 4).map(contrib => (
                <div key={contrib.id} className="activity-item">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    contrib.status === 'approved' ? 'bg-[#F0FDF4] text-[#15803D]' : 'bg-[#FFFBEB] text-[#B45309]'
                  }`}>
                    {contrib.status === 'approved' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#0F172A]">{contrib.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[#64748B] capitalize">{contrib.type}</span>
                      {contrib.ai_involvement !== 'none' && (
                        <Badge variant="info">AI-assisted</Badge>
                      )}
                      {contrib.credits_awarded > 0 && (
                        <span className="text-xs font-medium text-[#B45309]">+{contrib.credits_awarded} credits</span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={contrib.status} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Pending Applications */}
          {myApplications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Applications</CardTitle>
              </CardHeader>
              {myApplications.filter(a => a.status === 'pending').map(app => {
                const project = DEMO_PROJECTS.find(p => p.id === app.project_id);
                return (
                  <div key={app.id} className="p-3 border border-[#E2E8F0] rounded-lg mb-2">
                    <p className="text-sm font-medium text-[#0F172A]">{project?.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusBadge status="pending" />
                      {app.match_score && (
                        <span className="text-xs font-medium text-[#1D4ED8]">{Math.round(app.match_score * 100)}% match</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </Card>
          )}

          {/* Recommended Projects */}
          {recommendedProjects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommended for You</CardTitle>
              </CardHeader>
              {recommendedProjects.map(project => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="p-3 border border-[#E2E8F0] rounded-lg cursor-pointer hover:border-[#CBD5E1] transition-all mb-2"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-[#0F172A]">{project.title}</p>
                  </div>
                  <p className="text-xs text-[#64748B] line-clamp-2">{project.public_summary}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <EngagementBadge model={project.engagement_model} />
                    <span className="text-xs text-[#64748B]">{project.domain}</span>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* AI Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent AI Activity</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/ai')}>
                <Bot size={14} />
              </Button>
            </CardHeader>
            {recentAILogs.length === 0 ? (
              <p className="text-xs text-[#64748B]">No recent AI activity</p>
            ) : (
              <div className="space-y-2">
                {recentAILogs.map(log => (
                  <div key={log.id} className="p-2 border border-[#E2E8F0] rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <Bot size={12} className="text-[#64748B]" />
                      <span className="text-xs font-medium text-[#0F172A] capitalize">{log.agent_type} Agent</span>
                      <StatusBadge status={log.approval_status} />
                    </div>
                    <p className="text-xs text-[#64748B] truncate">{log.request}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[#94A3B8]">{log.model}</span>
                      <span className="text-[10px] text-[#94A3B8]">·</span>
                      <span className="text-[10px] text-[#94A3B8]">{log.provider}</span>
                      {log.fallback_used && (
                        <Badge variant="pending">Fallback</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Skills */}
          {profile && (
            <Card>
              <CardHeader>
                <CardTitle>Your Skills</CardTitle>
              </CardHeader>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map(skill => (
                  <Badge key={skill} variant="neutral">{skill}</Badge>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
