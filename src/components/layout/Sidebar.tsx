import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Search, FileText, Briefcase, Bot,
  GitCommitHorizontal, Coins, User, Star, Settings,
  Plus, Users, ShieldCheck, AlertTriangle, BookOpen,
  ClipboardList, Wallet, BarChart3, CheckSquare,
  FolderOpen, LogOut, Hexagon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types';

interface NavItemDef {
  label: string;
  path: string;
  icon: React.ReactNode;
  section?: string;
}

function getNavItems(role: UserRole): NavItemDef[] {
  switch (role) {
    case 'student':
      return [
        { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'Explore Projects', path: '/projects', icon: <Search size={18} />, section: 'Research' },
        { label: 'My Applications', path: '/applications', icon: <FileText size={18} /> },
        { label: 'My Workspaces', path: '/workspaces', icon: <Briefcase size={18} /> },
        { label: 'AI Assistant', path: '/ai', icon: <Bot size={18} />, section: 'Tools' },
        { label: 'Contributions', path: '/contributions', icon: <GitCommitHorizontal size={18} /> },
        { label: 'Credits', path: '/credits', icon: <Coins size={18} />, section: 'Profile' },
        { label: 'Portfolio', path: '/portfolio', icon: <User size={18} /> },
        { label: 'Ratings', path: '/ratings', icon: <Star size={18} /> },
      ];
    case 'organization':
      return [
        { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'Projects', path: '/projects', icon: <FolderOpen size={18} />, section: 'Management' },
        { label: 'Create Project', path: '/projects/create', icon: <Plus size={18} /> },
        { label: 'Applicants', path: '/applicants', icon: <Users size={18} /> },
        { label: 'Workspaces', path: '/workspaces', icon: <Briefcase size={18} /> },
        { label: 'AI Matching', path: '/matching', icon: <Bot size={18} />, section: 'Intelligence' },
        { label: 'Milestones', path: '/milestones', icon: <CheckSquare size={18} /> },
        { label: 'Escrow', path: '/escrow', icon: <Wallet size={18} />, section: 'Finance' },
        { label: 'Analytics', path: '/analytics', icon: <BarChart3 size={18} /> },
        { label: 'Ratings', path: '/ratings', icon: <Star size={18} /> },
      ];
    case 'mentor':
      return [
        { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'Opportunities', path: '/projects', icon: <Search size={18} />, section: 'Research' },
        { label: 'My Projects', path: '/workspaces', icon: <Briefcase size={18} /> },
        { label: 'Reviews', path: '/reviews', icon: <ClipboardList size={18} />, section: 'Work' },
        { label: 'Contributions', path: '/contributions', icon: <GitCommitHorizontal size={18} /> },
        { label: 'Credits', path: '/credits', icon: <Coins size={18} />, section: 'Profile' },
        { label: 'Ratings', path: '/ratings', icon: <Star size={18} /> },
      ];
    case 'admin':
      return [
        { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'Users', path: '/admin/users', icon: <Users size={18} />, section: 'System' },
        { label: 'Projects', path: '/projects', icon: <FolderOpen size={18} /> },
        { label: 'Verification', path: '/admin/verification', icon: <ShieldCheck size={18} /> },
        { label: 'Disputes', path: '/admin/disputes', icon: <AlertTriangle size={18} />, section: 'Governance' },
        { label: 'Audit / Ledger', path: '/admin/audit', icon: <BookOpen size={18} /> },
        { label: 'Security', path: '/admin/security', icon: <Settings size={18} /> },
      ];
    default:
      return [];
  }
}

export function Sidebar() {
  const { user, isDemo, signOut, totalCredits } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const navItems = getNavItems(user.role);
  let currentSection: string | undefined;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside className="w-[240px] h-screen bg-white border-r border-[#E2E8F0] flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[#E2E8F0]">
        <NavLink to="/dashboard" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 bg-[#0F172A] rounded-lg flex items-center justify-center">
            <Hexagon size={16} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-[#0F172A] tracking-tight">ResearchMesh</span>
            {isDemo && (
              <span className="block text-[10px] font-medium text-[#B45309] leading-none mt-0.5">DEMO MODE</span>
            )}
          </div>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {navItems.map((item, index) => {
          const showSection = item.section && item.section !== currentSection;
          if (item.section) currentSection = item.section;

          return (
            <React.Fragment key={item.path}>
              {showSection && (
                <div className="nav-section-label">{item.section}</div>
              )}
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            </React.Fragment>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-[#E2E8F0] p-3">
        {/* Credits display for non-org roles */}
        {user.role !== 'organization' && user.role !== 'admin' && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-[#F8FAFC] rounded-lg">
            <Coins size={14} className="text-[#B45309]" />
            <span className="text-xs font-semibold text-[#334155]">{totalCredits} credits</span>
          </div>
        )}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-[#1D4ED8] flex items-center justify-center text-white text-xs font-semibold">
            {user.display_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#0F172A] truncate">{user.display_name}</p>
            <p className="text-[10px] text-[#64748B] capitalize">{user.role}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
