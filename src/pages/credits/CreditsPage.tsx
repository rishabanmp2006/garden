import { useState } from 'react';
import {
  Coins, Wallet, ArrowUpRight, Award, Shield,
  CheckCircle2, Clock, Info, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  DEMO_CREDITS, DEMO_ESCROW, DEMO_PROJECTS
} from '../../lib/demo-data';

export function CreditsPage() {
  const { user } = useAuth();
  const [escrowList, setEscrowList] = useState(DEMO_ESCROW);
  const [releasedNotification, setReleasedNotification] = useState<string | null>(null);

  const userCredits = DEMO_CREDITS.filter(
    (c) => c.user_id === user?.id || user?.role === 'admin' || user?.role === 'organization'
  );
  const totalUserCredits = userCredits.reduce((sum, c) => sum + c.amount, 0);

  const handleReleaseEscrow = (escrowId: string) => {
    setEscrowList((prev) =>
      prev.map((e) => (e.id === escrowId ? { ...e, status: 'released', released_at: new Date().toISOString() } : e))
    );
    setReleasedNotification(`Milestone Escrow ${escrowId} successfully released to verified contributors!`);
    setTimeout(() => setReleasedNotification(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
            <Coins size={22} className="text-[#B45309]" /> Credits & Escrow Economics
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Transparent reputation points, meritocratic authorship weights, and simulated multi-party escrow.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#FFFBEB] border border-[#FDE68A] px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#92400E]">
          <Award size={15} /> Verified Tier: Senior Research Contributor
        </div>
      </div>

      {releasedNotification && (
        <div className="p-3 bg-[#F0FDF4] border border-[#86EFAC] rounded-lg text-xs font-semibold text-[#15803D] flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} />
          <span>{releasedNotification}</span>
        </div>
      )}

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-white border-[#CBD5E1]">
          <span className="text-xs font-semibold text-[#64748B] block mb-1">
            Total Verified Credits Earned
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#0F172A]">{totalUserCredits || 195}</span>
            <span className="text-xs text-[#15803D] font-medium">+95 this month</span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2">
            Determines publication co-authorship thresholds (&gt;15% project weight).
          </p>
        </Card>

        <Card className="p-5 bg-white border-[#CBD5E1]">
          <span className="text-xs font-semibold text-[#64748B] block mb-1">
            Active Simulated Escrow
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#0F172A]">$60,000</span>
            <span className="text-xs text-[#B45309] font-medium">2 Active Milestones</span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2">
            Locked in multi-sig simulated contract until mentor milestone sign-off.
          </p>
        </Card>

        <Card className="p-5 bg-white border-[#CBD5E1]">
          <span className="text-xs font-semibold text-[#64748B] block mb-1">
            Released Contributor Funds
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#15803D]">$20,000</span>
            <span className="text-xs text-[#64748B] font-medium">Milestone 1</span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2">
            Distributed across 3 student contributors and 1 mentor.
          </p>
        </Card>
      </div>

      {/* Simulated Escrow Architecture Box */}
      <Card className="p-6 bg-white space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <Wallet size={18} className="text-[#1D4ED8]" /> Simulated Escrow Distribution Engine
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Simulates automated fund release based on acceptance criteria and multi-sig milestone sign-off.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#64748B] bg-[#F1F5F9] px-2 py-1 rounded">
            SIMULATION MODE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {escrowList.map((esc) => {
            const project = DEMO_PROJECTS.find((p) => p.id === esc.project_id);
            const isReleased = esc.status === 'released';

            return (
              <div
                key={esc.id}
                className={`p-4 rounded-lg border text-xs space-y-3 ${
                  isReleased ? 'border-[#86EFAC] bg-[#F0FDF4]' : 'border-[#CBD5E1] bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#0F172A]">
                    Milestone: {esc.milestone_id.toUpperCase()}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      isReleased ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEF3C7] text-[#B45309]'
                    }`}
                  >
                    {esc.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-[#475569]">{project?.title}</p>

                <div className="space-y-1.5 pt-2 border-t border-[#E2E8F0] text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Total Escrow Value:</span>
                    <strong className="text-[#0F172A]">${esc.total_amount.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Contributor Pool (60%):</span>
                    <span className="text-[#15803D] font-semibold">${esc.contributor_pool.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Expert / Mentor Allocation (25%):</span>
                    <span className="text-[#1D4ED8] font-semibold">${esc.expert_allocation.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">AI Compute & Model Reserve (10%):</span>
                    <span className="text-[#B45309] font-semibold">${esc.ai_compute_reserve.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Platform Maintenance Fee (5%):</span>
                    <span className="text-[#64748B]">${esc.platform_fee.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0]">
                  {isReleased ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#15803D] font-medium">
                      <CheckCircle2 size={13} /> Released on {new Date(esc.released_at || '').toLocaleDateString()}
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full justify-center text-xs"
                      onClick={() => handleReleaseEscrow(esc.id)}
                    >
                      Simulate Milestone Approval & Fund Release
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Credit Transactions Table */}
      <Card className="p-6 bg-white space-y-4">
        <h3 className="text-base font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3">
          Verified Credit Transaction History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Deliverable / Milestone</th>
                <th className="py-2.5 px-3">Project</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-right">Credits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {DEMO_CREDITS.map((credit) => (
                <tr key={credit.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-2.5 px-3 text-[#64748B]">
                    {new Date(credit.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[#0F172A]">{credit.reason}</td>
                  <td className="py-2.5 px-3 text-[#475569]">Nova Biotech Retina Edge</td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-semibold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded">
                      VERIFIED MERIT
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#15803D]">
                    +{credit.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
