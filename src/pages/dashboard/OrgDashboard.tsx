import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, Users, Wallet,
  ArrowRight, AlertCircle,
  Check, CreditCard, ShieldCheck, Loader2, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, StatCard } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/EmptyState';
import {
  acceptApplicantApi,
  approveWithdrawalApi,
  fetchUserDashboard,
} from '../../lib/api';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export function OrgDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projectsOwned, setProjectsOwned] = useState<any[]>([]);
  const [pendingApps, setPendingApps] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured() && supabase) {
        // 1. Authoritative Supabase query for organization's owned projects
        const { data: myProjects, error: projErr } = await supabase
          .from('projects')
          .select('*, escrow_accounts(*)')
          .eq('org_id', user.id)
          .order('created_at', { ascending: false });

        if (projErr) throw projErr;
        const owned = myProjects || [];
        setProjectsOwned(owned);

        // 2. Authoritative Supabase query for pending applications across owned projects
        const projectIds = owned.map((p: any) => p.id);
        if (projectIds.length === 0) {
          setPendingApps([]);
        } else {
          const { data: rawApps, error: appsErr } = await supabase
            .from('applications')
            .select(`
              *,
              projects(title),
              profiles:user_id(
                id,
                display_name,
                email,
                skills
              )
            `)
            .in('project_id', projectIds)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

          if (appsErr) throw appsErr;

          const formattedApps = (rawApps || []).map((app: any) => ({
            ...app,
            project_title: app.projects?.title || 'Research Project',
            applicant_name: app.profiles?.display_name || app.profiles?.email?.split('@')[0] || 'Applicant',
            applicant_email: app.profiles?.email,
            applicant_skills: app.profiles?.skills || app.relevant_skills || [],
          }));
          setPendingApps(formattedApps);
        }

        // 3. Optional supporting service: fetch simulated withdrawals from FastAPI
        try {
          const apiDash = await fetchUserDashboard(user.id);
          if (apiDash?.pending_withdrawals) {
            setPendingWithdrawals(apiDash.pending_withdrawals);
          }
        } catch {
          // Supporting service offline / no withdrawals in local SQLite
          setPendingWithdrawals([]);
        }
      } else {
        // Fallback if Supabase not configured
        const data = await fetchUserDashboard(user.id);
        setProjectsOwned(data?.projects_owned || []);
        setPendingApps(data?.pending_applications || []);
        setPendingWithdrawals(data?.pending_withdrawals || []);
      }
    } catch (err: any) {
      console.error('Failed to load org dashboard:', err);
      setError(err.message || 'Failed to load organization research console.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const escrowStats = useMemo(() => {
    let totalFunded = 0;
    let totalAvailable = 0;
    let totalReleased = 0;

    for (const p of projectsOwned) {
      const esc = Array.isArray(p.escrow_accounts) ? p.escrow_accounts[0] : p.escrow_accounts;
      if (esc) {
        totalFunded += Number(esc.total_budget || 0);
        totalAvailable += Number(esc.available_balance || 0);
        totalReleased += Number(esc.released_balance || 0);
      } else {
        totalFunded += Number(p.budget || 0);
        totalAvailable += Number(p.budget || 0);
      }
    }

    return {
      total_funded: totalFunded,
      total_available: totalAvailable,
      total_released: totalReleased,
    };
  }, [projectsOwned]);

  if (!user) return null;

  const handleAcceptApplicant = async (appId: string) => {
    setActionInProgress(appId);
    try {
      const app = pendingApps.find((a: any) => a.id === appId);
      if (!app) throw new Error('Application record not found.');

      if (isSupabaseConfigured() && supabase) {
        const nowTs = new Date().toISOString();

        // 1. FIRST update Supabase public.applications
        const { error: appUpdateErr } = await supabase
          .from('applications')
          .update({
            status: 'accepted',
            reviewed_by: user.id,
            reviewed_at: nowTs,
          })
          .eq('id', appId);

        if (appUpdateErr) {
          throw new Error(`Failed to accept applicant in database: ${appUpdateErr.message}`);
        }

        // 2. Upsert public.project_members (workspace membership)
        const { error: memberUpsertErr } = await supabase
          .from('project_members')
          .upsert(
            {
              project_id: app.project_id,
              user_id: app.user_id,
              role: app.role || 'student',
              status: 'active',
            },
            { onConflict: 'project_id,user_id' }
          );

        if (memberUpsertErr) {
          throw new Error(`Failed to grant workspace membership: ${memberUpsertErr.message}`);
        }
      }

      // 3. Keep FastAPI call for SHA-256 ledger/provenance purposes
      try {
        await acceptApplicantApi(appId, user.id);
      } catch (ledgerErr) {
        console.warn('[OrgDashboard] SHA-256 ledger provenance logging note:', ledgerErr);
      }

      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to accept applicant');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleApproveWithdrawal = async (wdrId: string) => {
    setActionInProgress(wdrId);
    try {
      await approveWithdrawalApi(wdrId, {
        reviewer_id: user.id,
        action: 'approve',
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve simulated withdrawal');
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Organization Sponsor: ${user.display_name || user.email}`}
        description="Oversee research projects, admit qualified applicants, and approve verified milestone payouts"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={loadData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button onClick={() => navigate('/projects/create')} icon={<FolderOpen size={16} />}>
              Post Research Project
            </Button>
          </div>
        }
      />

      {/* Error state */}
      {error && (
        <Card className="p-4 bg-[#FEF2F2] border-[#FCA5A5] flex items-center justify-between text-xs text-[#991B1B]">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-[#DC2626] shrink-0" />
            <span>Database Error: {error}</span>
          </div>
          <Button size="sm" variant="secondary" onClick={loadData}>
            Retry
          </Button>
        </Card>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="py-24 text-center">
          <Loader2 size={36} className="mx-auto text-[#1D4ED8] animate-spin mb-3" />
          <h3 className="text-sm font-semibold text-[#0F172A]">Loading organization research console...</h3>
          <p className="text-xs text-[#64748B]">Querying funded projects, applicant pool, and simulated escrow accounts from database.</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Published Projects"
              value={projectsOwned.length}
              icon={<FolderOpen size={18} className="text-[#1D4ED8]" />}
            />
            <StatCard
              label="Pending Applications"
              value={pendingApps.length}
              subtitle="AI Match Scored"
              icon={<Users size={18} className="text-[#0D9488]" />}
            />
            <StatCard
              label="Simulated Escrow Available"
              value={`$${Number(escrowStats.total_available || 0).toLocaleString()}`}
              subtitle={`Total: $${Number(escrowStats.total_funded || 0).toLocaleString()}`}
              icon={<Wallet size={18} className="text-[#D97706]" />}
            />
            <StatCard
              label="Escrow Released (Paid)"
              value={`$${Number(escrowStats.total_released || 0).toLocaleString()}`}
              subtitle="Verified by SHA-256 Ledger"
              icon={<ShieldCheck size={18} className="text-[#15803D]" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Projects & Pending Applicants */}
            <div className="lg:col-span-2 space-y-6">
              {/* Published Projects */}
              <Card className="p-5 bg-white space-y-3">
                <CardHeader className="p-0 pb-3 border-b border-[#E2E8F0]">
                  <CardTitle>Your Research Projects</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
                    View all <ArrowRight size={14} />
                  </Button>
                </CardHeader>

                {projectsOwned.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#64748B] space-y-2">
                    <p>No research projects published yet.</p>
                    <Button size="sm" onClick={() => navigate('/projects/create')}>
                      Publish First Project
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projectsOwned.map((project: any) => (
                      <div
                        key={project.id}
                        onClick={() => navigate(`/projects/${project.id}/workspace`)}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border border-[#E2E8F0] rounded-lg cursor-pointer hover:border-[#94A3B8] hover:bg-[#F8FAFC] transition-all gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs font-bold text-[#0F172A]">{project.title}</p>
                            <StatusBadge status={project.status || 'open'} />
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                            <span className="font-semibold text-[#1D4ED8] bg-[#EFF6FF] px-1.5 py-0.5 rounded">{project.domain}</span>
                            <span>•</span>
                            <span>Threshold: {project.withdrawal_threshold} cr</span>
                            <span>•</span>
                            <span>Budget: ${Number(project.budget).toLocaleString()}</span>
                          </div>
                        </div>
                        <Button size="sm" variant="secondary" className="pointer-events-none self-end sm:self-auto">
                          Open Workspace <ArrowRight size={12} className="ml-1" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Pending Applications Review */}
              <Card className="p-5 bg-white space-y-3">
                <CardHeader className="p-0 pb-3 border-b border-[#E2E8F0]">
                  <CardTitle>Pending Contributor & Mentor Applications</CardTitle>
                </CardHeader>

                {pendingApps.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#64748B]">
                    No pending applications across your projects.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingApps.map((app: any) => (
                      <div key={app.id} className="p-4 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-[#0F172A]">
                              {app.applicant_name} — <span className="capitalize text-[#1D4ED8]">{app.role}</span>
                            </p>
                            <p className="text-[11px] text-[#64748B]">Applied to: {app.project_title}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#DBEAFE]">
                              AI Match: {app.match_score}%
                            </span>
                            <Button
                              size="sm"
                              icon={<Check size={14} />}
                              onClick={() => handleAcceptApplicant(app.id)}
                              disabled={actionInProgress === app.id}
                            >
                              {actionInProgress === app.id ? 'Admitting...' : 'Admit to Team'}
                            </Button>
                          </div>
                        </div>

                        <p className="text-xs text-[#334155] bg-white p-2.5 rounded border border-[#E2E8F0] italic">
                          "{app.message}"
                        </p>

                        {Array.isArray(app.match_reasons) && app.match_reasons.length > 0 && (
                          <div className="text-[11px] text-[#475569] space-y-0.5">
                            <strong className="text-[#0F172A]">AI Matching Breakdown:</strong>
                            <ul className="list-disc list-inside text-[#64748B]">
                              {app.match_reasons.map((r: string, i: number) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column: Simulated Payout Requests & Escrow Status */}
            <div className="space-y-6">
              {/* Simulated Payout Approval Queue */}
              <Card className="p-5 bg-white space-y-3 border-[#CBD5E1]">
                <CardHeader className="p-0 pb-3 border-b border-[#E2E8F0]">
                  <CardTitle className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
                    <CreditCard size={15} className="text-[#15803D]" />
                    Simulated Payout Requests
                  </CardTitle>
                </CardHeader>

                {pendingWithdrawals.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#64748B]">
                    No pending withdrawal requests awaiting approval.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingWithdrawals.map((w: any) => (
                      <div key={w.id} className="p-3.5 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0F172A]">{w.student_name}</span>
                          <span className="font-bold text-[#15803D]">${w.amount} USD</span>
                        </div>
                        <p className="text-[11px] text-[#64748B]">
                          Project: {w.project_title} • Exchanging: {w.credits_exchanged} Verified Credits
                        </p>

                        <div className="p-2 bg-white rounded border border-[#DCFCE7] text-[10px] space-y-0.5">
                          <p>Account: {w.payout_profile?.account_holder || w.student_name}</p>
                          <p className="font-mono text-[#64748B]">Identifier: {w.payout_profile?.masked_account}</p>
                        </div>

                        <div className="pt-1 flex justify-end">
                          <Button
                            size="sm"
                            className="w-full justify-center"
                            icon={<Check size={14} />}
                            onClick={() => handleApproveWithdrawal(w.id)}
                            disabled={actionInProgress === w.id}
                          >
                            {actionInProgress === w.id ? 'Releasing Escrow...' : 'Approve Simulated Payout'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Escrow Breakdown */}
              <Card className="p-5 bg-white space-y-3">
                <CardHeader className="p-0 pb-3 border-b border-[#E2E8F0]">
                  <CardTitle>Simulated Escrow Summary</CardTitle>
                </CardHeader>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                    <span className="text-[#64748B]">Total Budget Funded:</span>
                    <strong className="text-[#0F172A]">${Number(escrowStats.total_funded || 0).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between p-2 bg-[#EFF6FF] rounded border border-[#DBEAFE]">
                    <span className="text-[#1D4ED8]">Available in Escrow:</span>
                    <strong className="text-[#1D4ED8]">${Number(escrowStats.total_available || 0).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between p-2 bg-[#F0FDF4] rounded border border-[#DCFCE7]">
                    <span className="text-[#15803D]">Released to Students:</span>
                    <strong className="text-[#15803D]">${Number(escrowStats.total_released || 0).toLocaleString()}</strong>
                  </div>
                </div>

                <p className="text-[10px] text-[#94A3B8] italic pt-1">
                  Escrow release actions automatically log cryptographic transactions to the SHA-256 ledger.
                </p>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
