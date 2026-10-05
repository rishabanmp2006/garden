import { useState, useEffect } from 'react';
import {
  Coins, Wallet, ArrowUpRight, Award, Shield,
  CheckCircle2, Clock, Info, RefreshCw, Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { fetchUserDashboard } from '../../lib/api';

export function CreditsPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      try {
        const data = await fetchUserDashboard(user.id);
        setDashboardData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 size={36} className="mx-auto text-[#1D4ED8] animate-spin mb-3" />
        <h3 className="text-sm font-semibold text-[#0F172A]">Loading verified credit economics...</h3>
      </div>
    );
  }

  const totalCredits = dashboardData?.total_credits || 0;
  const recentCredits = dashboardData?.recent_credits || [];
  const joinedProjects = dashboardData?.joined_projects || [];
  const withdrawals = dashboardData?.withdrawals || [];

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
          <Award size={15} /> Verified Ledger Balance: {totalCredits} Credits
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-white border-[#CBD5E1]">
          <span className="text-xs font-semibold text-[#64748B] block mb-1">
            Total Verified Credits Earned
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#0F172A]">{totalCredits}</span>
            <span className="text-xs text-[#15803D] font-medium">Recorded on SHA-256 Ledger</span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2">
            Credits are awarded strictly upon mentor approval of milestone deliverables.
          </p>
        </Card>

        <Card className="p-5 bg-white border-[#CBD5E1]">
          <span className="text-xs font-semibold text-[#64748B] block mb-1">
            Active Research Projects
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#0F172A]">{joinedProjects.length}</span>
            <span className="text-xs text-[#1D4ED8] font-medium">Workspaces</span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2">
            Governed by Project Charter v1.0 terms and configurable reward thresholds.
          </p>
        </Card>

        <Card className="p-5 bg-white border-[#CBD5E1]">
          <span className="text-xs font-semibold text-[#64748B] block mb-1">
            Simulated Payout Requests
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#15803D]">{withdrawals.length}</span>
            <span className="text-xs text-[#64748B] font-medium">History</span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-2">
            Prototype payout simulation without real monetary transfers.
          </p>
        </Card>
      </div>

      {/* Credit Award Ledger Entries */}
      <Card className="p-6 bg-white space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Verified Credit Award History</h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Every credit allocation corresponds to an approved deliverable on the immutable ledger.
            </p>
          </div>
        </div>

        {recentCredits.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#64748B]">
            <Coins size={32} className="mx-auto text-[#CBD5E1] mb-2" />
            <p className="font-semibold text-[#0F172A]">0 Verified Credits on Record</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Submit code or research deliverables in an active workspace. Once approved by a mentor, credits will be added here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {recentCredits.map((c: any) => (
              <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <p className="font-semibold text-[#0F172A]">{c.reason}</p>
                  <p className="text-[11px] text-[#64748B]">
                    Awarded by: {c.awarded_by || 'Mentor'} • {new Date(c.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#15803D] bg-[#F0FDF4] px-2.5 py-1 rounded border border-[#DCFCE7]">
                    +{c.amount} Credits
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
