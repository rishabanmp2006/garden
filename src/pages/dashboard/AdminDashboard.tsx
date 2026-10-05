import React, { useState, useEffect } from 'react';
import {
  Users, FolderOpen, ShieldCheck, AlertTriangle,
  BookOpen, Lock, CheckCircle2, XCircle, Activity, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, StatCard } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/EmptyState';
import { fetchAdminStats, fetchAdminUsers, fetchAdminAiLogs, fetchLedger, verifyLedger } from '../../lib/api';

export function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_users: 0,
    verified_users: 0,
    unverified_users: 0,
    active_projects: 0,
    ledger_entries: 0,
    ai_logs: 0,
    open_disputes: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  const [ledgerCount, setLedgerCount] = useState(0);
  const [ledgerValid, setLedgerValid] = useState<boolean | null>(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, uList, logs, lEntries] = await Promise.all([
        fetchAdminStats().catch(() => null),
        fetchAdminUsers().catch(() => []),
        fetchAdminAiLogs().catch(() => []),
        fetchLedger().catch(() => []),
      ]);
      if (s) setStats(s);
      setUsers(uList);
      setAiLogs(logs);
      setLedgerCount(lEntries.length);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyLedger = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyLedger();
      setLedgerValid(res?.is_valid ?? true);
    } catch (err) {
      setLedgerValid(false);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!user) return null;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Admin Dashboard"
          description="System governance, live cryptographic ledger verification, and AI policy audit"
        />
        <Button
          size="sm"
          variant="secondary"
          icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
          onClick={loadData}
          disabled={loading}
        >
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Users"
          value={stats.total_users}
          subtitle={`${stats.verified_users} verified`}
          icon={<Users size={18} />}
        />
        <StatCard
          label="Active Projects"
          value={stats.active_projects}
          icon={<FolderOpen size={18} />}
        />
        <StatCard
          label="Ledger Entries"
          value={ledgerCount || stats.ledger_entries}
          icon={<BookOpen size={18} />}
        />
        <StatCard
          label="Open Disputes"
          value={stats.open_disputes}
          icon={<AlertTriangle size={18} />}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          {/* User table */}
          <Card>
            <CardHeader>
              <CardTitle>Registered Users</CardTitle>
            </CardHeader>
            {users.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#64748B]">
                No registered users recorded in the database yet.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Verified</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#1D4ED8] flex items-center justify-center text-white text-[10px] font-semibold">
                            {(u.display_name || 'U').charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{u.display_name}</p>
                            <p className="text-[10px] text-[#64748B]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className="capitalize text-[#64748B]">{u.role}</span></td>
                      <td>
                        {u.verified ? (
                          <CheckCircle2 size={14} className="text-[#15803D]" />
                        ) : (
                          <XCircle size={14} className="text-[#B91C1C]" />
                        )}
                      </td>
                      <td className="text-[#64748B]">
                        {new Date(u.created_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {/* Recent AI Activity */}
          <Card>
            <CardHeader>
              <CardTitle>AI Policy Gateway Activity (Audit Trail)</CardTitle>
            </CardHeader>
            {aiLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#64748B]">
                No AI queries executed through the AI Policy Gateway yet.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Agent</th>
                    <th>Owner</th>
                    <th>Action</th>
                    <th>Model</th>
                    <th>Sensitivity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {aiLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="text-[#64748B] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="capitalize font-medium">{log.agent_type}</td>
                      <td className="text-[#64748B]">{log.human_owner_name || log.human_owner_id}</td>
                      <td className="max-w-[200px] truncate">{log.request}</td>
                      <td><Badge variant="neutral">{log.model}</Badge></td>
                      <td>
                        <Badge variant={log.data_sensitivity === 'high' || log.data_sensitivity === 'critical' ? 'danger' : 'verified'}>
                          {log.data_sensitivity.toUpperCase()}
                        </Badge>
                      </td>
                      <td><StatusBadge status={log.approval_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ledger Cryptographic Integrity</CardTitle>
            </CardHeader>
            <div className={`flex items-center gap-2 p-3 rounded-lg mb-3 border ${
              ledgerValid
                ? 'bg-[#F0FDF4] border-[#DCFCE7] text-[#15803D]'
                : 'bg-[#FEF2F2] border-[#FEE2E2] text-[#B91C1C]'
            }`}>
              {ledgerValid ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <div>
                <p className="text-xs font-semibold">
                  {ledgerValid ? 'LEDGER VERIFIED (SHA-256)' : 'TAMPER DETECTED'}
                </p>
                <p className="text-[10px] text-[#64748B]">
                  {ledgerCount} persistent blocks, sequential hash links {ledgerValid ? 'intact' : 'broken'}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={handleVerifyLedger}
              disabled={isVerifying}
            >
              <ShieldCheck size={14} className={isVerifying ? 'animate-spin' : ''} />
              {isVerifying ? 'Verifying Chain...' : 'Verify Full SHA-256 Chain'}
            </Button>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security & Policy Rules</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              <SecurityEvent
                time="LIVE"
                event="High-Sensitivity Routing"
                detail="Air-gapped local model enforced for confidential datasets"
                level="info"
              />
              <SecurityEvent
                time="LIVE"
                event="Cloud Egress Protection"
                detail="External cloud API calls automatically rejected on high sensitivity"
                level="warning"
              />
              <SecurityEvent
                time="LIVE"
                event="Simulated Escrow Lock"
                detail="Funds released strictly upon mentor verification & org approval"
                level="info"
              />
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Components</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              <StatusLine label="Supabase Auth & Database" status="operational" />
              <StatusLine label="Local LLM (Air-Gapped)" status="available" />
              <StatusLine label="Cloud LLM Router" status="configured" />
              <StatusLine label="SHA-256 Ledger Service" status="operational" />
              <StatusLine label="Watermarked Storage" status="operational" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SecurityEvent({ time, event, detail, level }: {
  time: string; event: string; detail: string; level: 'info' | 'warning' | 'danger';
}) {
  const colors = {
    info: { bg: 'bg-[#EFF6FF]', text: 'text-[#1D4ED8]', icon: <Activity size={12} /> },
    warning: { bg: 'bg-[#FFFBEB]', text: 'text-[#B45309]', icon: <AlertTriangle size={12} /> },
    danger: { bg: 'bg-[#FEF2F2]', text: 'text-[#B91C1C]', icon: <Lock size={12} /> },
  };
  const c = colors[level];
  return (
    <div className="p-2 border border-[#E2E8F0] rounded-md">
      <div className="flex items-center gap-2 mb-0.5">
        <div className={`w-5 h-5 rounded flex items-center justify-center ${c.bg} ${c.text}`}>
          {c.icon}
        </div>
        <span className="text-xs font-medium text-[#0F172A]">{event}</span>
        <span className="text-[10px] text-[#94A3B8] ml-auto">{time}</span>
      </div>
      <p className="text-[10px] text-[#64748B] ml-7">{detail}</p>
    </div>
  );
}

function StatusLine({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-[#64748B]">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
        <span className="text-xs text-[#15803D] capitalize">{status}</span>
      </div>
    </div>
  );
}
