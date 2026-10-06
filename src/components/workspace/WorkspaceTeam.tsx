import React from 'react';
import { Users, Shield, GraduationCap, Award, Mail } from 'lucide-react';

interface WorkspaceTeamProps {
  members: any[];
  isLoading?: boolean;
}

export function WorkspaceTeam({ members, isLoading = false }: WorkspaceTeamProps) {
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'organization_owner':
      case 'organization':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#1D4ED8] bg-[#EFF6FF] border border-[#DBEAFE] px-2 py-0.5 rounded">
            <Shield size={10} /> Organization Owner
          </span>
        );
      case 'mentor':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] px-2 py-0.5 rounded">
            <Award size={10} /> Research Mentor
          </span>
        );
      case 'student':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded">
            <GraduationCap size={10} /> Research Contributor
          </span>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-[#1D4ED8]" />
          <h2 className="text-sm font-bold text-[#0F172A]">
            Project Research Team ({members.length})
          </h2>
        </div>
        <p className="text-xs text-[#64748B] leading-relaxed">
          Active roster of verified researchers, mentors, and organization leads with permission to access this secure workspace.
        </p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-[#64748B]">
          Loading team roster...
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center text-xs text-[#64748B]">
          No active members found for this project.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((member) => {
            const profile = member.profiles || {};
            const displayName = profile.display_name || profile.email?.split('@')[0] || 'Researcher';
            const email = profile.email;
            const skills = profile.skills || [];
            const education = profile.education;
            const role = member.role || profile.role || 'student';
            const joinedAt = member.joined_at ? new Date(member.joined_at).toLocaleDateString() : null;

            return (
              <div
                key={member.id || member.user_id}
                className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={displayName}
                        className="w-10 h-10 rounded-full object-cover border border-[#E2E8F0]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[#1D4ED8] flex items-center justify-center text-xs font-bold">
                        {getInitials(displayName)}
                      </div>
                    )}

                    <div>
                      <h3 className="text-xs font-bold text-[#0F172A]">
                        {displayName}
                      </h3>
                      {email && (
                        <p className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5">
                          <Mail size={10} /> {email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>{getRoleBadge(role)}</div>
                </div>

                {education && (
                  <p className="text-[11px] text-[#475569] bg-[#F8FAFC] p-2 rounded border border-[#F1F5F9]">
                    {education}
                  </p>
                )}

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {skills.slice(0, 5).map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium text-[#475569] bg-[#F1F5F9] px-2 py-0.5 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {joinedAt && (
                  <p className="text-[10px] text-[#94A3B8] pt-1 border-t border-[#F1F5F9]">
                    Member since {joinedAt} • Status: <span className="text-[#15803D] font-medium capitalize">{member.status || 'Active'}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
