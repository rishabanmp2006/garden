import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  CheckSquare,
  FolderClosed,
  GitCommitHorizontal,
  Users,
  Activity,
  Code2,
  X
} from 'lucide-react';

export type WorkspaceTabId =
  | 'overview'
  | 'discussions'
  | 'tasks'
  | 'code'
  | 'files'
  | 'contributions'
  | 'team'
  | 'activity';

interface WorkspaceSidebarProps {
  activeTab: WorkspaceTabId;
  onTabChange: (tab: WorkspaceTabId) => void;
  counts?: {
    tasks?: number;
    code?: number;
    files?: number;
    contributions?: number;
    team?: number;
    activity?: number;
  };
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function WorkspaceSidebar({
  activeTab,
  onTabChange,
  counts,
  isOpenMobile = false,
  onCloseMobile,
}: WorkspaceSidebarProps) {
  const navItems: { id: WorkspaceTabId; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { id: 'discussions', label: 'Discussions', icon: <MessageSquare size={16} /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={16} />, count: counts?.tasks },
    { id: 'code', label: 'Code', icon: <Code2 size={16} />, count: counts?.code },
    { id: 'files', label: 'Files', icon: <FolderClosed size={16} />, count: counts?.files },
    { id: 'contributions', label: 'Contributions', icon: <GitCommitHorizontal size={16} />, count: counts?.contributions },
    { id: 'team', label: 'Team', icon: <Users size={16} />, count: counts?.team },
    { id: 'activity', label: 'Activity', icon: <Activity size={16} />, count: counts?.activity },
  ];

  const content = (
    <div className="flex flex-col h-full bg-[#FFFFFF] border-r border-[#E2E8F0] w-60 py-4 select-none">
      <div className="px-4 pb-3 mb-2 border-b border-[#F1F5F9] flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wider text-[#94A3B8] uppercase">
          Workspace Navigation
        </span>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden text-[#64748B] hover:text-[#0F172A] p-1 rounded hover:bg-[#F1F5F9]"
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-2.5 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#EFF6FF] text-[#1D4ED8] font-semibold border border-[#DBEAFE]'
                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-[#1D4ED8]' : 'text-[#64748B]'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                    isActive
                      ? 'bg-[#DBEAFE] text-[#1D4ED8]'
                      : 'bg-[#F1F5F9] text-[#64748B]'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-4 pt-3 border-t border-[#F1F5F9] text-[11px] text-[#94A3B8]">
        ResearchMesh Workspace
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block shrink-0">
        {content}
      </aside>

      {/* Mobile drawer backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-[#0F172A]/30 z-40 md:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile drawer content */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 transform md:hidden transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </aside>
    </>
  );
}
