import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Bell,
  Menu,
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  fetchProjectDetails,
  fetchContributionsApi,
  createTaskApi,
  submitWorkApi,
  reviewWorkApi,
  fetchLedger,
} from '../../lib/api';
import { StatusBadge, SensitivityBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { WorkspaceSidebar } from '../../components/workspace/WorkspaceSidebar';
import type { WorkspaceTabId } from '../../components/workspace/WorkspaceSidebar';
import { WorkspaceAccessDenied } from '../../components/workspace/WorkspaceAccessDenied';
import { WorkspaceOverview } from '../../components/workspace/WorkspaceOverview';
import { DiscussionPanel } from '../../components/workspace/DiscussionPanel';
import { WorkspaceTasks } from '../../components/workspace/WorkspaceTasks';
import { WorkspaceFiles } from '../../components/workspace/WorkspaceFiles';
import { WorkspaceContributions } from '../../components/workspace/WorkspaceContributions';
import { WorkspaceTeam } from '../../components/workspace/WorkspaceTeam';
import { WorkspaceActivity } from '../../components/workspace/WorkspaceActivity';
import type { SenderProfile } from '../../types/workspace';
import { isSupportedCodeFile } from '../../lib/codeHelpers';

// Lazy-load Monaco Code IDE so bundle is not downloaded until user enters Code section
const CodeWorkspace = React.lazy(() => import('../../components/workspace/code/CodeWorkspace'));

export function WorkspacePage() {
  const { projectId, id } = useParams<{ projectId?: string; id?: string }>();
  const activeProjectId = projectId || id;

  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<WorkspaceTabId>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Core entities from Supabase
  const [project, setProject] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [hasApplied, setHasApplied] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  const codeFilesCount = useMemo(() => {
    return files.filter((f) => isSupportedCodeFile(f.name)).length;
  }, [files]);

  // Mobile navigation drawer toggle
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Load project workspace data
  const loadWorkspaceData = useCallback(async () => {
    if (!activeProjectId) return;
    setLoading(true);
    setError(null);

    try {
      if (supabase) {
        // 1. Fetch project from Supabase
        const { data: projData, error: projErr } = await supabase
          .from('projects')
          .select('*, profiles:org_id(id, display_name, org_name, verified)')
          .eq('id', activeProjectId)
          .maybeSingle();

        if (projErr) throw projErr;
        if (!projData) {
          // Fallback to FastAPI
          const apiProj = await fetchProjectDetails(activeProjectId, user?.id).catch(() => null);
          if (apiProj?.project) {
            setProject(apiProj.project);
          } else {
            setError('Research project not found.');
            setLoading(false);
            return;
          }
        } else {
          setProject(projData);
        }

        // 2. Fetch project members with profiles
        const { data: memData } = await supabase
          .from('project_members')
          .select('*, profiles:user_id(id, display_name, email, role, avatar_url, education, skills)')
          .eq('project_id', activeProjectId);

        setMembers(memData || []);

        // 3. Parallel fetch of tasks, milestones, files, contributions, ledger, applications
        const [
          { data: msData },
          { data: taskData },
          { data: fileData },
          { data: contribData },
          { data: ledgerData },
          { data: appData }
        ] = await Promise.all([
          supabase.from('milestones').select('*').eq('project_id', activeProjectId).order('created_at', { ascending: true }),
          supabase.from('tasks').select('*').eq('project_id', activeProjectId).order('created_at', { ascending: true }),
          supabase.from('files').select('*').eq('project_id', activeProjectId),
          supabase.from('contributions').select('*').eq('project_id', activeProjectId).order('created_at', { ascending: false }),
          supabase.from('ledger_entries').select('*').eq('project_id', activeProjectId).order('timestamp', { ascending: false }),
          user?.id
            ? supabase.from('applications').select('id, status').eq('project_id', activeProjectId).eq('user_id', user.id).maybeSingle()
            : Promise.resolve({ data: null })
        ]);

        setMilestones(msData || []);
        setTasks(taskData || []);
        setFiles(fileData || []);
        setContributions(contribData && contribData.length > 0 ? contribData : await fetchContributionsApi(activeProjectId).catch(() => []));
        
        // If Supabase ledger entries are empty, fallback to FastAPI ledger
        if (ledgerData && ledgerData.length > 0) {
          setLedgerEntries(ledgerData);
        } else {
          const apiLedger = await fetchLedger(activeProjectId).catch(() => []);
          setLedgerEntries(apiLedger || []);
        }

        setHasApplied(Boolean(appData));

        // 4. Fetch unread notifications
        if (user?.id) {
          try {
            const { count } = await supabase
              .from('notifications')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('is_read', false);
            setUnreadNotifsCount(count || 0);
          } catch {
            // Notifications table pending
          }
        }
      } else {
        // FastAPI direct fallback
        const apiProj = await fetchProjectDetails(activeProjectId, user?.id);
        setProject(apiProj.project);
        setMilestones(apiProj.milestones || []);
        setTasks(apiProj.tasks || []);
        setMembers(apiProj.members || []);
        setFiles(apiProj.files || []);
        const [contribRes, ledgerRes] = await Promise.all([
          fetchContributionsApi(activeProjectId).catch(() => []),
          fetchLedger(activeProjectId).catch(() => []),
        ]);
        setContributions(contribRes);
        setLedgerEntries(ledgerRes);
      }
    } catch (err: any) {
      console.error('[WorkspacePage] Error loading data:', err);
      setError(err.message || 'Failed to load workspace.');
    } finally {
      setLoading(false);
    }
  }, [activeProjectId, user]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  // Membership & Authorization Check
  const isOwner = Boolean(user && project && user.id === project.org_id);
  const myMembership = members.find(
    (m: any) => m.user_id === user?.id && m.status === 'active'
  );
  const isMember = Boolean(myMembership);
  const hasAccess = isOwner || isMember;

  const canManageChannels = Boolean(
    isOwner ||
    myMembership?.role === 'mentor' ||
    myMembership?.role === 'workspace_manager' ||
    myMembership?.role === 'organization_owner'
  );

  const canCreateTask = Boolean(
    isOwner ||
    myMembership?.role === 'mentor' ||
    myMembership?.role === 'workspace_manager'
  );

  const canReview = Boolean(
    isOwner ||
    myMembership?.role === 'mentor' ||
    myMembership?.role === 'workspace_manager'
  );

  // Cached map of user_id -> SenderProfile for discussion sender joins
  const membersCache: Record<string, SenderProfile> = useMemo(() => {
    const map: Record<string, SenderProfile> = {};
    for (const m of members) {
      if (m.profiles && m.user_id) {
        map[m.user_id] = {
          id: m.profiles.id || m.user_id,
          display_name: m.profiles.display_name,
          avatar_url: m.profiles.avatar_url,
          role: m.role || m.profiles.role,
          email: m.profiles.email,
        };
      }
    }
    if (project?.profiles && project.org_id) {
      map[project.org_id] = {
        id: project.org_id,
        display_name: project.profiles.display_name || project.profiles.org_name || 'Organization Owner',
        avatar_url: project.profiles.avatar_url,
        role: 'organization_owner',
      };
    }
    return map;
  }, [members, project]);

  // Actions
  const handleCreateTask = async (payload: {
    milestone_id: string;
    title: string;
    description: string;
    credits_reward: number;
  }) => {
    if (!project) return;
    if (supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          project_id: project.id,
          milestone_id: payload.milestone_id,
          title: payload.title,
          description: payload.description,
          credits_reward: payload.credits_reward,
          status: 'open',
        })
        .select('*')
        .single();

      if (error) {
        await createTaskApi(project.id, payload);
      } else if (data) {
        setTasks((prev) => [...prev, data]);
        createTaskApi(project.id, payload).catch(() => {});
      }
    } else {
      await createTaskApi(project.id, payload);
      await loadWorkspaceData();
    }
  };

  const handleSubmitWork = async (
    taskId: string,
    payload: { fileName: string; description: string }
  ) => {
    if (!project || !user) return;
    await submitWorkApi(taskId, {
      contributor_id: user.id,
      file_name: payload.fileName,
      file_content: '# Deliverable file content placeholder',
      description: payload.description,
      ai_involvement: 'ai_assisted',
    });
    await loadWorkspaceData();
  };

  const handleReviewWork = async (
    contribId: string,
    verdict: 'approved' | 'rejected',
    comment: string
  ) => {
    if (!user) return;
    await reviewWorkApi(contribId, {
      reviewer_id: user.id,
      verdict,
      comment,
    });
    setContributions((prev) =>
      prev.map((c) => (c.id === contribId ? { ...c, status: verdict } : c))
    );
    await loadWorkspaceData();
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center space-y-2">
          <Loader2 size={24} className="animate-spin text-[#1D4ED8] mx-auto" />
          <p className="text-xs text-[#64748B]">Verifying workspace credentials & memberships...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-xl p-6 text-center space-y-3">
          <AlertCircle size={24} className="text-[#DC2626] mx-auto" />
          <h2 className="text-sm font-bold text-[#0F172A]">Workspace Error</h2>
          <p className="text-xs text-[#64748B]">{error || 'Project not found.'}</p>
          <Button size="sm" onClick={() => navigate('/projects')}>
            Return to Projects
          </Button>
        </div>
      </div>
    );
  }

  // Security enforcement: Deny access if not an active member and not project owner
  if (!hasAccess) {
    return (
      <WorkspaceAccessDenied
        projectId={project.id}
        projectTitle={project.title}
        hasApplied={hasApplied}
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#F8FAFC]">
      {/* 1. WORKSPACE TOP HEADER */}
      <header className="bg-white border-b border-[#E2E8F0] px-4 py-2.5 flex items-center justify-between shrink-0 select-none z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile navigation toggle */}
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="md:hidden text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-lg hover:bg-[#F1F5F9]"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>

          {/* Back button */}
          <button
            onClick={() => navigate(`/projects/${project.id}`)}
            className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors"
            title="Back to Project Overview"
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="h-4 w-px bg-[#E2E8F0] hidden sm:block" />

          {/* Project Identity */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xs md:text-sm font-bold text-[#0F172A] truncate">
                {project.title}
              </h1>
              <StatusBadge status={project.status || 'active'} />
              <SensitivityBadge level={project.sensitivity_level || 'high'} />
            </div>

            <p className="text-[11px] text-[#64748B] hidden sm:flex items-center gap-2 mt-0.5">
              <span>Active Research Workspace</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users size={11} /> Team of {members.length || 1}
              </span>
            </p>
          </div>
        </div>

        {/* Right header actions */}
        <div className="flex items-center gap-2.5">
          {unreadNotifsCount > 0 && (
            <div className="relative">
              <button
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-lg hover:bg-[#F1F5F9] transition-colors"
                title={`${unreadNotifsCount} unread notifications`}
              >
                <Bell size={16} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#1D4ED8]" />
              </button>
            </div>
          )}

          <Button
            size="sm"
            variant="secondary"
            className="hidden sm:inline-flex text-xs"
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            Project Details
          </Button>
        </div>
      </header>

      {/* 2. WORKSPACE BODY (SIDEBAR + CONTENT) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <WorkspaceSidebar
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          counts={{
            tasks: tasks.length,
            code: codeFilesCount,
            files: files.length,
            contributions: contributions.length,
            team: members.length || 1,
            activity: ledgerEntries.length,
          }}
          isOpenMobile={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        {/* Main Workspace Stage */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
          {activeTab === 'overview' && (
            <WorkspaceOverview
              project={project}
              milestones={milestones}
              tasks={tasks}
              contributions={contributions}
              members={members}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'discussions' && (
            <DiscussionPanel
              projectId={project.id}
              currentUserId={user?.id}
              isProjectOwner={isOwner}
              canManageChannels={canManageChannels}
              teamCount={members.length || 1}
              membersCache={membersCache}
            />
          )}

          {activeTab === 'tasks' && (
            <WorkspaceTasks
              tasks={tasks}
              milestones={milestones}
              canCreateTask={canCreateTask}
              canSubmitWork={!isOwner}
              onCreateTask={handleCreateTask}
              onSubmitWork={handleSubmitWork}
            />
          )}

          {activeTab === 'code' && (
            <React.Suspense
              fallback={
                <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 bg-[#1E1E1E]">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                  <span className="text-xs font-mono">Loading Code IDE...</span>
                </div>
              }
            >
              <CodeWorkspace
                projectId={project.id}
                projectTitle={project.title}
                currentUserId={user?.id}
                canModify={hasAccess}
                onFilesChanged={loadWorkspaceData}
              />
            </React.Suspense>
          )}

          {activeTab === 'files' && (
            <WorkspaceFiles
              files={files}
              canAccessConfidential={hasAccess}
            />
          )}

          {activeTab === 'contributions' && (
            <WorkspaceContributions
              contributions={contributions}
              canReview={canReview}
              onReviewWork={handleReviewWork}
            />
          )}

          {activeTab === 'team' && (
            <WorkspaceTeam members={members} />
          )}

          {activeTab === 'activity' && (
            <WorkspaceActivity entries={ledgerEntries} />
          )}
        </main>
      </div>
    </div>
  );
}
