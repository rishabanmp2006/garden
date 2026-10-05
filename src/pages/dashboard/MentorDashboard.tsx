import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, ClipboardList, GitCommitHorizontal, Coins,
  ArrowRight, Clock, CheckCircle2, Users, Code, Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, StatCard } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/EmptyState';
import { fetchUserDashboard } from '../../lib/api';

export function MentorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    try {
      const data = await fetchUserDashboard(user.id);
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load mentor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 size={36} className="mx-auto text-[#1D4ED8] animate-spin mb-3" />
        <h3 className="text-sm font-semibold text-[#0F172A]">Loading mentor console...</h3>
        <p className="text-xs text-[#64748B]">Querying assigned research projects and student deliverable queue.</p>
      </div>
    );
  }

  const projectsAssigned = dashboardData?.projects_assigned || [];
  const pendingReviews = dashboardData?.pending_reviews || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Research Mentor: ${user.display_name || user.email}`}
        description="Milestone oversight, deliverable code inspection, and credit validation"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Supervised Projects"
          value={projectsAssigned.length}
          icon={<Briefcase size={18} className="text-[#1D4ED8]" />}
        />
        <StatCard
          label="Deliverables Pending Review"
          value={pendingReviews.length}
          subtitle="Code & artifacts awaiting sign-off"
          icon={<ClipboardList size={18} className="text-[#D97706]" />}
        />
        <StatCard
          label="Verification Authority"
          value="Charter v1.0"
          subtitle="Signatory active on ledger"
          icon={<CheckCircle2 size={18} className="text-[#15803D]" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Assigned Projects */}
          <Card className="p-5 bg-white space-y-3">
            <CardHeader className="p-0 pb-3 border-b border-[#E2E8F0]">
              <CardTitle>Supervised Research Workspaces</CardTitle>
            </CardHeader>
            {projectsAssigned.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B] space-y-2">
                <p>You have not been assigned to any research projects as a mentor yet.</p>
                <Button size="sm" onClick={() => navigate('/projects')}>
                  Explore Projects & Apply as Mentor
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {projectsAssigned.map((project: any) => (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/workspace/${project.id}`)}
                    className="flex items-center justify-between p-3.5 border border-[#E2E8F0] rounded-lg cursor-pointer hover:border-[#94A3B8] hover:bg-[#F8FAFC] transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">{project.title}</p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Domain: {project.domain} • Withdrawal Threshold: {project.withdrawal_threshold} cr
                      </p>
                    </div>
                    <Button size="sm" variant="secondary" className="pointer-events-none">
                      Open Workspace <ArrowRight size={12} className="ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pending Reviews Queue */}
          <Card className="p-5 bg-white space-y-3">
            <CardHeader className="p-0 pb-3 border-b border-[#E2E8F0]">
              <CardTitle>Pending Deliverable Review Queue</CardTitle>
            </CardHeader>

            {pendingReviews.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B]">
                All deliverable reviews are up to date across your workspaces.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReviews.map((c: any) => (
                  <div key={c.id} className="p-4 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                          <Code size={14} className="text-[#1D4ED8]" />
                          {c.file_name} — {c.task_title || 'Deliverable'}
                        </p>
                        <p className="text-[11px] text-[#64748B]">
                          Project: {c.project_title} • Submitted by: <strong className="text-[#0F172A]">{c.contributor_name}</strong>
                        </p>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => navigate(`/workspace/${c.project_id}`)}
                      >
                        Inspect & Review in Workspace
                      </Button>
                    </div>

                    <p className="text-xs text-[#334155]">{c.description}</p>
                    <div className="p-2 bg-white rounded border border-[#E2E8F0] font-mono text-[10px] text-[#64748B] truncate">
                      SHA-256 Hash: {c.content_hash}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right column: Mentoring Guidelines */}
        <div className="space-y-4">
          <Card className="p-5 bg-white space-y-3">
            <CardHeader className="p-0 pb-3 border-b border-[#E2E8F0]">
              <CardTitle>Charter v1.0 Review Standards</CardTitle>
            </CardHeader>
            <div className="space-y-2.5 text-xs text-[#475569]">
              <div className="p-2.5 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                <strong className="text-[#0F172A] block mb-0.5">1. Reproducible Artifacts</strong>
                <p className="text-[11px]">Ensure submissions pass clean execution without hardcoded fake responses.</p>
              </div>
              <div className="p-2.5 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                <strong className="text-[#0F172A] block mb-0.5">2. AI Policy Verification</strong>
                <p className="text-[11px]">Confirm that AI assistance was declared and generated artifacts were human-verified.</p>
              </div>
              <div className="p-2.5 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                <strong className="text-[#0F172A] block mb-0.5">3. Credit Authorization</strong>
                <p className="text-[11px]">Approvals irreversibly record credit assignments to the SHA-256 ledger.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
