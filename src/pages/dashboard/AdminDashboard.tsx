import React from 'react';
import {
  Users, FolderOpen, ShieldCheck, AlertTriangle,
  BookOpen, Lock, CheckCircle2, XCircle, Activity,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, StatCard } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/EmptyState';
import {
  DEMO_USERS, DEMO_PROJECTS, DEMO_LEDGER, DEMO_AI_LOGS,
} from '../../lib/demo-data';

export function AdminDashboard() {
  const { user } = useAuth();
  if (!user) return null;

  const verifiedUsers = DEMO_USERS.filter(u => u.verified).length;
  const unverifiedUsers = DEMO_USERS.filter(u => !u.verified).length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Admin Dashboard"
        description="System overview and governance"
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users" value={DEMO_USERS.length} subtitle={`${verifiedUsers} verified`} icon={<Users size={18} />} />
        <StatCard label="Active Projects" value={DEMO_PROJECTS.filter(p => p.status === 'active').length} icon={<FolderOpen size={18} />} />
        <StatCard label="Ledger Entries" value={DEMO_LEDGER.length} icon={<BookOpen size={18} />} />
        <StatCard label="Open Disputes" value={0} icon={<AlertTriangle size={18} />} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          {/* User table */}
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
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
                {DEMO_USERS.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1D4ED8] flex items-center justify-center text-white text-[10px] font-semibold">
                          {u.display_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{u.display_name}</p>
                          <p className="text-[10px] text-[#64748B]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="capitalize text-[#64748B]">{u.role}</span></td>
                    <td>
                      {u.verified
                        ? <CheckCircle2 size={14} className="text-[#15803D]" />
                        : <XCircle size={14} className="text-[#B91C1C]" />
                      }
                    </td>
                    <td className="text-[#64748B]">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Recent AI Activity */}
          <Card>
            <CardHeader>
              <CardTitle>AI Activity (System-wide)</CardTitle>
            </CardHeader>
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
                {DEMO_AI_LOGS.map(log => {
                  const owner = DEMO_USERS.find(u => u.id === log.human_owner_id);
                  return (
                    <tr key={log.id}>
                      <td className="text-[#64748B] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="capitalize font-medium">{log.agent_type}</td>
                      <td className="text-[#64748B]">{owner?.display_name}</td>
                      <td className="max-w-[200px] truncate">{log.request}</td>
                      <td><Badge variant="neutral">{log.model}</Badge></td>
                      <td>
                        <Badge variant={log.data_sensitivity === 'high' ? 'danger' : 'verified'}>
                          {log.data_sensitivity.toUpperCase()}
                        </Badge>
                      </td>
                      <td><StatusBadge status={log.approval_status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ledger Integrity</CardTitle>
            </CardHeader>
            <div className="flex items-center gap-2 p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg mb-3">
              <CheckCircle2 size={16} className="text-[#15803D]" />
              <div>
                <p className="text-xs font-semibold text-[#15803D]">LEDGER VERIFIED</p>
                <p className="text-[10px] text-[#64748B]">{DEMO_LEDGER.length} entries, chain intact</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" className="w-full">
              <ShieldCheck size={14} /> Verify Full Chain
            </Button>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              <SecurityEvent
                time="10:42"
                event="High-sensitivity AI request"
                detail="Local model used for project data"
                level="info"
              />
              <SecurityEvent
                time="10:48"
                event="Cloud fallback blocked"
                detail="Confidentiality policy prevented cloud routing"
                level="warning"
              />
              <SecurityEvent
                time="09:15"
                event="AI escalation to human"
                detail="Local model unavailable, awaiting mentor"
                level="warning"
              />
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              <StatusLine label="Authentication" status="operational" />
              <StatusLine label="Local AI (Ollama)" status="available" />
              <StatusLine label="Cloud AI" status="configured" />
              <StatusLine label="Ledger Service" status="operational" />
              <StatusLine label="File Storage" status="operational" />
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
