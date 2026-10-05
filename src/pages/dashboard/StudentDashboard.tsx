import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, GitCommitHorizontal, Coins, Star, Bot,
  ArrowRight, Clock, CheckCircle2, AlertCircle, FileText,
  TrendingUp, CreditCard, ShieldCheck, Loader2, ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, StatCard } from '../../components/ui/Card';
import { Badge, StatusBadge, EngagementBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/EmptyState';
import { fetchUserDashboard, requestWithdrawalApi } from '../../lib/api';

export function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Withdrawal Modal State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawProject, setWithdrawProject] = useState<any>(null);
  const [accountHolder, setAccountHolder] = useState(user?.display_name || 'Student Researcher');
  const [maskedAccount, setMaskedAccount] = useState('•••• •••• 8842');
  const [bankName, setBankName] = useState('Research Demo Bank');
  const [demoIfsc, setDemoIfsc] = useState('DEMO0004521');
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      const data = await fetchUserDashboard(user.id);
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
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
        <h3 className="text-sm font-semibold text-[#0F172A]">Loading student workspace metrics...</h3>
        <p className="text-xs text-[#64748B]">Querying verified credits, tasks, and withdrawal progress.</p>
      </div>
    );
  }

  const totalCredits = dashboardData?.total_credits || 0;
  const joinedProjects = dashboardData?.joined_projects || [];
  const tasks = dashboardData?.tasks || [];
  const recentCredits = dashboardData?.recent_credits || [];
  const withdrawals = dashboardData?.withdrawals || [];

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawProject) return;
    setIsSubmittingWithdrawal(true);
    try {
      await requestWithdrawalApi(withdrawProject.id, {
        student_id: user.id,
        amount: Math.min(totalCredits, withdrawProject.withdrawal_threshold || 50),
        credits_exchanged: Math.min(totalCredits, withdrawProject.withdrawal_threshold || 50),
        account_holder: accountHolder,
        masked_account: maskedAccount,
        demo_ifsc: demoIfsc,
      });
      setIsWithdrawModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Withdrawal request failed');
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Student Researcher: ${user.display_name || user.email}`}
        description="Verified research contributions, inner task progress, and withdrawal rewards"
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Joined Projects"
          value={joinedProjects.length}
          icon={<Briefcase size={18} className="text-[#1D4ED8]" />}
        />
        <StatCard
          label="Assigned Tasks"
          value={tasks.length}
          subtitle={`${tasks.filter((t: any) => t.status === 'completed').length} completed`}
          icon={<GitCommitHorizontal size={18} className="text-[#0D9488]" />}
        />
        <StatCard
          label="Verified Credits"
          value={totalCredits}
          subtitle="Earned on SHA-256 Ledger"
          icon={<Coins size={18} className="text-[#D97706]" />}
        />
        <StatCard
          label="Simulated Payouts"
          value={withdrawals.filter((w: any) => w.status === 'paid').length}
          subtitle={`${withdrawals.filter((w: any) => w.status === 'pending').length} pending approval`}
          icon={<CreditCard size={18} className="text-[#15803D]" />}
        />
      </div>

      {/* Withdrawal Threshold & Progression Section */}
      {joinedProjects.length > 0 && (
        <Card className="p-6 bg-white space-y-4 border-[#CBD5E1]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <Coins size={16} className="text-[#D97706]" />
                Project Reward & Withdrawal Threshold Tracker
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Organizations set a verified credit threshold. Upon reaching it, simulated payout unlock becomes active.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#1D4ED8] bg-[#EFF6FF] px-2.5 py-1 rounded">
              Current Balance: {totalCredits} Credits
            </span>
          </div>

          <div className="space-y-4">
            {joinedProjects.map((p: any) => {
              const threshold = p.withdrawal_threshold || 50;
              const progressPct = Math.min(Math.round((totalCredits / threshold) * 100), 100);
              const isEligible = totalCredits >= threshold;

              return (
                <div key={p.id} className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">{p.title}</p>
                      <p className="text-[11px] text-[#64748B]">
                        Withdrawal Threshold: <strong className="text-[#0F172A]">{threshold} credits</strong> • Budget: ${Number(p.budget).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      {isEligible ? (
                        <Button
                          size="sm"
                          icon={<ArrowUpRight size={14} />}
                          onClick={() => {
                            setWithdrawProject(p);
                            setIsWithdrawModalOpen(true);
                          }}
                        >
                          Request Withdrawal (${threshold} Simulated)
                        </Button>
                      ) : (
                        <span className="text-xs font-semibold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded border border-[#E2E8F0]">
                          {threshold - totalCredits} more credits to unlock payout
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Real Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-[#475569]">
                        Progress: {totalCredits} / {threshold} Credits
                      </span>
                      <span className={isEligible ? 'text-[#15803D]' : 'text-[#1D4ED8]'}>
                        {progressPct}% {isEligible && '• ELIGIBLE FOR WITHDRAWAL'}
                      </span>
                    </div>
                    <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isEligible ? 'bg-[#16A34A]' : 'bg-[#2563EB]'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Main Grid: Active Workspaces & Inner Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Active Projects */}
          <Card className="p-5 bg-white space-y-3">
            <CardHeader className="p-0 pb-3 border-b border-[#E2E8F0]">
              <CardTitle>Active Research Workspaces</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
                Explore Projects <ArrowRight size={14} />
              </Button>
            </CardHeader>

            {joinedProjects.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B] space-y-2">
                <p>You have not joined any research workspaces yet.</p>
                <Button size="sm" onClick={() => navigate('/projects')}>
                  Discover Open Research Projects
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {joinedProjects.map((p: any) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/workspace/${p.id}`)}
                    className="flex items-center justify-between p-3.5 border border-[#E2E8F0] rounded-lg cursor-pointer hover:border-[#94A3B8] hover:bg-[#F8FAFC] transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">{p.title}</p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Joined: {new Date(p.joined_at).toLocaleDateString()} • Withdrawal Threshold: {p.withdrawal_threshold} cr
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

          {/* Assigned Tasks */}
          <Card className="p-5 bg-white space-y-3">
            <CardHeader className="p-0 pb-3 border-b border-[#E2E8F0]">
              <CardTitle>Your Assigned Milestone Tasks</CardTitle>
            </CardHeader>

            {tasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B]">
                No tasks currently assigned. Enter an active workspace to claim tasks.
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {tasks.map((t: any) => (
                  <div key={t.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#0F172A]">{t.title}</p>
                      <p className="text-[11px] text-[#64748B]">Project: {t.project_title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded">
                        +{t.credits_reward || 25} cr
                      </span>
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Ledger Credits & Simulated Payout History */}
        <div className="space-y-6">
          {/* Simulated Payout Status */}
          <Card className="p-5 bg-white space-y-3">
            <CardHeader className="p-0 pb-3 border-b border-[#E2E8F0]">
              <CardTitle>Simulated Payout Requests</CardTitle>
            </CardHeader>

            {withdrawals.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#64748B]">
                No withdrawal requests submitted yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {withdrawals.map((w: any) => (
                  <div key={w.id} className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F172A]">${w.amount} USD</span>
                      <StatusBadge status={w.status} />
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      Exchanged: {w.credits_exchanged} credits
                    </p>
                    <p className="text-[10px] text-[#15803D] font-medium">
                      {w.status === 'paid' ? 'Simulated Escrow Released ✓' : 'Under Organization Review'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Credits Ledger History */}
          <Card className="p-5 bg-white space-y-3">
            <CardHeader className="p-0 pb-3 border-b border-[#E2E8F0]">
              <CardTitle>Verified Credit Ledger</CardTitle>
            </CardHeader>

            {recentCredits.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#64748B]">
                0 credits awarded. Complete tasks and receive mentor approval to earn verified credits.
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {recentCredits.map((c: any) => (
                  <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-[#0F172A]">{c.reason}</p>
                      <p className="text-[10px] text-[#64748B]">{new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="font-bold text-[#15803D]">+{c.amount} cr</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Simulated Withdrawal Request Modal */}
      <Modal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        title="Request Simulated Reward Payout"
        subtitle={`Threshold reached for ${withdrawProject?.title || 'Project'}`}
      >
        <form onSubmit={handleRequestWithdrawal} className="space-y-4">
          <div className="p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-lg text-xs space-y-1 text-[#92400E]">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck size={14} /> SIMULATED PAYOUT DEMONSTRATION
            </p>
            <p className="text-[11px]">
              No real monetary or banking transactions occur. This prototypes the release of simulated escrow funds to student contributors upon mentor verification.
            </p>
          </div>

          <Input
            label="Account Holder Name"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Masked Account Identifier"
              value={maskedAccount}
              onChange={(e) => setMaskedAccount(e.target.value)}
              helperText="Demo placeholder only"
              required
            />
            <Input
              label="Demo Bank / IFSC"
              value={demoIfsc}
              onChange={(e) => setDemoIfsc(e.target.value)}
              required
            />
          </div>

          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs flex justify-between items-center">
            <span className="text-[#64748B]">Simulated Payout Amount:</span>
            <strong className="text-base text-[#0F172A]">
              ${withdrawProject?.withdrawal_threshold || 50} USD ({withdrawProject?.withdrawal_threshold || 50} Credits)
            </strong>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsWithdrawModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmittingWithdrawal}>
              {isSubmittingWithdrawal ? 'Submitting to Ledger...' : 'Confirm Simulated Withdrawal'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
