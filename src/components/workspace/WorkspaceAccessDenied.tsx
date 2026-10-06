import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, Globe, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';

interface WorkspaceAccessDeniedProps {
  projectId: string;
  projectTitle?: string;
  hasApplied?: boolean;
}

export function WorkspaceAccessDenied({ projectId, projectTitle, hasApplied }: WorkspaceAccessDeniedProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-xl p-8 shadow-sm text-center space-y-5">
        <div className="w-12 h-12 bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl flex items-center justify-center mx-auto text-[#1D4ED8]">
          <Lock size={22} />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF2F2] text-[#B91C1C] border border-[#FEE2E2]">
            <ShieldAlert size={12} />
            <span>Access Restricted</span>
          </div>

          <h2 className="text-lg font-bold text-[#0F172A]">
            Research Workspace Access
          </h2>

          {projectTitle && (
            <p className="text-xs font-medium text-[#1D4ED8] bg-[#F8FAFC] py-1 px-2.5 rounded border border-[#E2E8F0] inline-block max-w-full truncate">
              {projectTitle}
            </p>
          )}

          <p className="text-xs text-[#64748B] leading-relaxed pt-1">
            {hasApplied
              ? 'Your application for this project has been recorded, but active team membership has not yet been confirmed by the organization. You will receive access once admitted.'
              : 'This workspace is restricted to active project team members and the organization owner. Non-members do not have permission to view workspace communications, data, or tasks.'}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="w-full sm:w-auto"
            icon={<ArrowLeft size={14} />}
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            Project Details
          </Button>

          <Button
            size="sm"
            className="w-full sm:w-auto"
            icon={<Globe size={14} />}
            onClick={() => navigate('/projects')}
          >
            Explore Projects
          </Button>
        </div>
      </div>
    </div>
  );
}
