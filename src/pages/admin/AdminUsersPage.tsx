import { useState } from 'react';
import {
  Users, CheckCircle2, XCircle, Search, Shield,
  UserCheck, Plus
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { DEMO_USERS } from '../../lib/demo-data';
import type { User } from '../../types';

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>(DEMO_USERS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.display_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleToggleVerify = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, verified: !u.verified } : u))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
            <Users size={22} className="text-[#1D4ED8]" /> User & Identity Management
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Admin console for managing accounts, verified academic affiliations, and role delegations.
          </p>
        </div>
      </div>

      <Card className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#334155]"
          >
            <option value="all">All Roles</option>
            <option value="student">Student</option>
            <option value="organization">Organization</option>
            <option value="mentor">Mentor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </Card>

      <Card className="p-6 bg-white space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Verification Status</th>
                <th className="py-2.5 px-3">Joined Date</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center text-[10px] font-bold">
                        {u.display_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-[#0F172A]">{u.display_name}</p>
                        <p className="text-[11px] text-[#64748B]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="capitalize font-semibold text-[#334155]">{u.role}</span>
                  </td>
                  <td className="py-3 px-3">
                    {u.verified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#15803D] bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#DCFCE7]">
                        <CheckCircle2 size={11} /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B45309] bg-[#FFFBEB] px-2 py-0.5 rounded border border-[#FEF3C7]">
                        <XCircle size={11} /> Pending Review
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-[#64748B]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleToggleVerify(u.id)}
                    >
                      {u.verified ? 'Revoke Verification' : 'Verify Identity'}
                    </Button>
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
