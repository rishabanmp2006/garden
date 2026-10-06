import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, FolderKanban, Users, CheckSquare, Coins,
  CheckCircle2, AlertCircle, Briefcase, Loader2, Wallet
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface AnalyticsData {
  projectCount: number;
  activeProjectCount: number;
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  totalMilestones: number;
  acceptedMilestones: number;
  inProgressMilestones: number;
  pendingMilestones: number;
  totalTasks: number;
  completedTasks: number;
  totalContributions: number;
  verifiedContributions: number;
  totalCreditsAwarded: number;
  totalEscrowBalance: number;
  totalEscrowFunded: number;
  domainCounts: Record<string, number>;
}

export function AnalyticsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<AnalyticsData>({
    projectCount: 0,
    activeProjectCount: 0,
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
    totalMilestones: 0,
    acceptedMilestones: 0,
    inProgressMilestones: 0,
    pendingMilestones: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalContributions: 0,
    verifiedContributions: 0,
    totalCreditsAwarded: 0,
    totalEscrowBalance: 0,
    totalEscrowFunded: 0,
    domainCounts: {},
  });

  useEffect(() => {
    async function loadAnalytics() {
      if (!user || !supabase || !isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        // 1. Fetch Projects for this user
        let projectQuery = supabase.from('projects').select('id, title, domain, status, org_id');
        if (user.role === 'organization') {
          projectQuery = projectQuery.eq('org_id', user.id);
        }

        const { data: projects, error: pErr } = await projectQuery;
        if (pErr) throw pErr;

        const projectList = projects || [];
        const projectIds = projectList.map((p) => p.id);

        if (projectIds.length === 0) {
          setData({
            projectCount: 0,
            activeProjectCount: 0,
            totalApplications: 0,
            pendingApplications: 0,
            acceptedApplications: 0,
            rejectedApplications: 0,
            totalMilestones: 0,
            acceptedMilestones: 0,
            inProgressMilestones: 0,
            pendingMilestones: 0,
            totalTasks: 0,
            completedTasks: 0,
            totalContributions: 0,
            verifiedContributions: 0,
            totalCreditsAwarded: 0,
            totalEscrowBalance: 0,
            totalEscrowFunded: 0,
            domainCounts: {},
          });
          setLoading(false);
          return;
        }

        // Domain breakdown
        const domainCounts: Record<string, number> = {};
        projectList.forEach((p) => {
          const dom = p.domain || 'Uncategorized';
          domainCounts[dom] = (domainCounts[dom] || 0) + 1;
        });

        // 2. Fetch associated records across the user's projects
        const [
          appsRes,
          milestonesRes,
          tasksRes,
          contribsRes,
          escrowRes,
        ] = await Promise.all([
          supabase.from('applications').select('id, status').in('project_id', projectIds),
          supabase.from('milestones').select('id, status, budget_allocation').in('project_id', projectIds),
          supabase.from('tasks').select('id, status, credits_reward').in('project_id', projectIds),
          supabase.from('contributions').select('id, status').in('project_id', projectIds),
          supabase.from('escrow_accounts').select('balance, total_funded').in('project_id', projectIds),
        ]);

        if (appsRes.error) console.warn('Applications fetch warning:', appsRes.error.message);
        if (milestonesRes.error) console.warn('Milestones fetch warning:', milestonesRes.error.message);
        if (tasksRes.error) console.warn('Tasks fetch warning:', tasksRes.error.message);
        if (contribsRes.error) console.warn('Contributions fetch warning:', contribsRes.error.message);
        if (escrowRes.error) console.warn('Escrow fetch warning:', escrowRes.error.message);

        const apps = appsRes.data || [];
        const milestones = milestonesRes.data || [];
        const tasks = tasksRes.data || [];
        const contribs = contribsRes.data || [];
        const escrows = escrowRes.data || [];

        // Credits awarded (sum of approved/completed tasks or explicit credits)
        const creditsSum = tasks
          .filter((t) => t.status === 'completed' || t.status === 'approved')
          .reduce((sum, t) => sum + (t.credits_reward || 0), 0);

        const totalFunded = escrows.reduce((sum, e) => sum + (e.total_funded || 0), 0);
        const totalBalance = escrows.reduce((sum, e) => sum + (e.balance || 0), 0);

        setData({
          projectCount: projectList.length,
          activeProjectCount: projectList.filter((p) => p.status !== 'archived').length,
          totalApplications: apps.length,
          pendingApplications: apps.filter((a) => a.status === 'pending').length,
          acceptedApplications: apps.filter((a) => a.status === 'accepted').length,
          rejectedApplications: apps.filter((a) => a.status === 'rejected').length,
          totalMilestones: milestones.length,
          acceptedMilestones: milestones.filter((m) => m.status === 'accepted').length,
          inProgressMilestones: milestones.filter((m) => m.status === 'in_progress').length,
          pendingMilestones: milestones.filter((m) => m.status === 'pending').length,
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t) => t.status === 'completed' || t.status === 'approved').length,
          totalContributions: contribs.length,
          verifiedContributions: contribs.filter((c) => c.status === 'approved' || c.status === 'accepted').length,
          totalCreditsAwarded: creditsSum,
          totalEscrowBalance: totalBalance,
          totalEscrowFunded: totalFunded,
          domainCounts,
        });
      } catch (err: any) {
        console.error('Analytics loading error:', err);
        setError(err.message || 'Failed to calculate analytics metrics.');
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [user]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 size={28} className="mx-auto text-[#1D4ED8] animate-spin mb-3" />
        <p className="text-xs text-[#64748B]">Calculating research analytics...</p>
      </div>
    );
  }

  const milestoneCompletionRate =
    data.totalMilestones > 0
      ? Math.round((data.acceptedMilestones / data.totalMilestones) * 100)
      : 0;

  const taskCompletionRate =
    data.totalTasks > 0
      ? Math.round((data.completedTasks / data.totalTasks) * 100)
      : 0;

  const appAcceptanceRate =
    data.totalApplications > 0
      ? Math.round((data.acceptedApplications / data.totalApplications) * 100)
      : 0;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <BarChart3 size={20} className="text-[#1D4ED8]" />
            Organization Research Analytics
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time pipeline metrics, researcher participation, and milestone progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/projects')}
          >
            View Projects
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/milestones')}
          >
            Manage Milestones
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-[#FEF2F2] border border-[#FEE2E2] rounded-lg">
          <AlertCircle size={14} className="text-[#B91C1C] flex-shrink-0" />
          <p className="text-xs text-[#B91C1C]">{error}</p>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Active Projects</p>
              <p className="text-2xl font-bold text-[#0F172A] mt-1">{data.activeProjectCount}</p>
              <p className="text-[11px] text-[#64748B] mt-1">
                {data.projectCount} total registered
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#1D4ED8]">
              <FolderKanban size={18} />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Milestone Rate</p>
              <p className="text-2xl font-bold text-[#0F172A] mt-1">{milestoneCompletionRate}%</p>
              <p className="text-[11px] text-[#15803D] mt-1 flex items-center gap-1 font-medium">
                <CheckCircle2 size={11} />
                {data.acceptedMilestones} of {data.totalMilestones} completed
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#F0FDF4] flex items-center justify-center text-[#15803D]">
              <CheckSquare size={18} />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Applicants</p>
              <p className="text-2xl font-bold text-[#0F172A] mt-1">{data.totalApplications}</p>
              <p className="text-[11px] text-[#B45309] mt-1 font-medium">
                {data.pendingApplications} awaiting review
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#FFFBEB] flex items-center justify-center text-[#B45309]">
              <Users size={18} />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Credits Distributed</p>
              <p className="text-2xl font-bold text-[#0F172A] mt-1">{data.totalCreditsAwarded}</p>
              <p className="text-[11px] text-[#64748B] mt-1">
                {data.verifiedContributions} verified outputs
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#FEF3C7] flex items-center justify-center text-[#92400E]">
              <Coins size={18} />
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milestone & Task Execution */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <CheckSquare size={16} className="text-[#1D4ED8]" />
                Milestone Execution Pipeline
              </span>
            </CardTitle>
          </CardHeader>

          <div className="space-y-4">
            {/* Visual Bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-[#0F172A]">Overall Milestones Progress</span>
                <span className="text-[#1D4ED8]">{milestoneCompletionRate}%</span>
              </div>
              <div className="w-full h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden flex">
                <div
                  className="bg-[#15803D] h-full"
                  style={{ width: `${milestoneCompletionRate}%` }}
                />
                <div
                  className="bg-[#1D4ED8] h-full"
                  style={{
                    width: `${data.totalMilestones > 0 ? (data.inProgressMilestones / data.totalMilestones) * 100 : 0}%`,
                  }}
                />
                <div
                  className="bg-[#CBD5E1] h-full"
                  style={{
                    width: `${data.totalMilestones > 0 ? (data.pendingMilestones / data.totalMilestones) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Breakdown counts */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg">
                <p className="text-[10px] uppercase font-bold text-[#15803D]">Accepted</p>
                <p className="text-xl font-bold text-[#15803D] mt-0.5">{data.acceptedMilestones}</p>
                <p className="text-[10px] text-[#64748B]">Approved work</p>
              </div>

              <div className="p-3 bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg">
                <p className="text-[10px] uppercase font-bold text-[#1D4ED8]">In Progress</p>
                <p className="text-xl font-bold text-[#1D4ED8] mt-0.5">{data.inProgressMilestones}</p>
                <p className="text-[10px] text-[#64748B]">Active research</p>
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <p className="text-[10px] uppercase font-bold text-[#64748B]">Pending</p>
                <p className="text-xl font-bold text-[#0F172A] mt-0.5">{data.pendingMilestones}</p>
                <p className="text-[10px] text-[#64748B]">Scheduled</p>
              </div>
            </div>

            {/* Sub-tasks performance */}
            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
              <span className="text-[#64748B]">Sub-tasks completed across projects:</span>
              <span className="font-semibold text-[#0F172A]">
                {data.completedTasks} / {data.totalTasks} ({taskCompletionRate}%)
              </span>
            </div>
          </div>
        </Card>

        {/* Applicant Funnel */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Users size={16} className="text-[#1D4ED8]" />
                Researcher Application Funnel
              </span>
            </CardTitle>
          </CardHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#0F172A]">Pending Review</span>
                  <span className="text-[#B45309]">{data.pendingApplications}</span>
                </div>
                <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div
                    className="bg-[#F59E0B] h-full"
                    style={{
                      width: `${data.totalApplications > 0 ? (data.pendingApplications / data.totalApplications) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#0F172A]">Accepted Researchers</span>
                  <span className="text-[#15803D]">{data.acceptedApplications}</span>
                </div>
                <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div
                    className="bg-[#10B981] h-full"
                    style={{
                      width: `${data.totalApplications > 0 ? (data.acceptedApplications / data.totalApplications) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#0F172A]">Rejected / Closed</span>
                  <span className="text-[#64748B]">{data.rejectedApplications}</span>
                </div>
                <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div
                    className="bg-[#94A3B8] h-full"
                    style={{
                      width: `${data.totalApplications > 0 ? (data.rejectedApplications / data.totalApplications) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
              <span className="text-[#64748B]">Admission Acceptance Rate:</span>
              <span className="font-semibold text-[#0F172A]">{appAcceptanceRate}%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Domain Breakdown & Financials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domains Breakdown */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Briefcase size={16} className="text-[#1D4ED8]" />
                Research Domains Distribution
              </span>
            </CardTitle>
          </CardHeader>

          {Object.keys(data.domainCounts).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(data.domainCounts).map(([domain, count]) => {
                const pct = Math.round((count / data.projectCount) * 100);
                return (
                  <div key={domain}>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-[#0F172A]">{domain}</span>
                      <span className="text-[#64748B]">{count} projects ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                      <div
                        className="bg-[#1D4ED8] h-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-[#94A3B8] italic py-4 text-center">
              No research projects created yet.
            </p>
          )}
        </Card>

        {/* Financial & Escrow Overview */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Wallet size={16} className="text-[#1D4ED8]" />
                Escrow & Research Funding
              </span>
            </CardTitle>
          </CardHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <p className="text-[10px] uppercase font-bold text-[#64748B]">Total Funded</p>
                <p className="text-lg font-bold text-[#0F172A] mt-0.5">
                  ${data.totalEscrowFunded.toLocaleString()}
                </p>
                <p className="text-[10px] text-[#64748B]">Committed capital</p>
              </div>

              <div className="p-3 bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg">
                <p className="text-[10px] uppercase font-bold text-[#1D4ED8]">Escrow Balance</p>
                <p className="text-lg font-bold text-[#1D4ED8] mt-0.5">
                  ${data.totalEscrowBalance.toLocaleString()}
                </p>
                <p className="text-[10px] text-[#64748B]">Available for release</p>
              </div>
            </div>

            <div className="text-xs text-[#64748B] bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
              <p className="font-semibold text-[#0F172A] mb-1">Charter-Governed Escrow</p>
              <p className="text-[11px] leading-relaxed">
                Funds are held in smart milestone escrow accounts and released only upon verified completion of deliverables and IP charter confirmation.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
