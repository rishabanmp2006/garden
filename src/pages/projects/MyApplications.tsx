import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, CheckCircle2, XCircle, Clock, Sparkles,
  Building2, ChevronRight, RefreshCw, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { acceptApplicantApi, rejectApplicantApi, fetchUserApplications } from '../../lib/api';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export function MyApplications() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isOrg = user?.role === 'organization' || user?.role === 'admin';

  const loadApps = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured() && supabase) {
        if (isOrg) {
          // Organization: query pending applications across owned projects
          const { data: myProjects, error: pErr } = await supabase
            .from('projects')
            .select('id')
            .eq('org_id', user.id);

          if (pErr) throw pErr;

          const projectIds = (myProjects || []).map((p: any) => p.id);
          if (projectIds.length === 0) {
            setApplications([]);
          } else {
            const { data: orgApps, error: aErr } = await supabase
              .from('applications')
              .select(`
                *,
                projects(
                  id,
                  title,
                  domain,
                  org_id,
                  profiles:org_id(
                    display_name,
                    org_name
                  )
                ),
                profiles:user_id(
                  id,
                  display_name,
                  email,
                  education,
                  availability,
                  skills
                )
              `)
              .in('project_id', projectIds)
              .order('created_at', { ascending: false });

            if (aErr) throw aErr;

            const formatted = (orgApps || []).map((app: any) => ({
              ...app,
              project_title: app.projects?.title || 'Research Project',
              domain: app.projects?.domain,
              org_name: app.projects?.profiles?.org_name || app.projects?.profiles?.display_name || 'Organization',
              display_name: app.profiles?.display_name || 'Applicant',
              email: app.profiles?.email,
              education: app.profiles?.education,
              availability: app.profiles?.availability,
              applicant_skills: app.profiles?.skills || app.relevant_skills || [],
            }));
            setApplications(formatted);
          }
        } else {
          // Student: query submitted applications
          const { data: stuApps, error: sErr } = await supabase
            .from('applications')
            .select(`
              *,
              projects(
                id,
                title,
                domain,
                org_id,
                profiles:org_id(
                  display_name,
                  org_name
                )
              )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (sErr) throw sErr;

          const formatted = (stuApps || []).map((app: any) => ({
            ...app,
            project_title: app.projects?.title || 'Research Project',
            domain: app.projects?.domain,
            org_name: app.projects?.profiles?.org_name || app.projects?.profiles?.display_name || 'Organization',
          }));
          setApplications(formatted);
        }
      } else {
        // Fallback to local API if Supabase not configured
        const data = await fetchUserApplications(user.id);
        setApplications(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      console.error('Failed to load applications:', err);
      setError(err.message || 'Failed to load live applications from database.');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [user, isOrg]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  const handleUpdateStatus = async (appId: string, newStatus: 'accepted' | 'rejected') => {
    if (!user) return;
    try {
      setActionLoading(appId);
      const app = applications.find((a: any) => a.id === appId);
      const nowTs = new Date().toISOString();

      if (isSupabaseConfigured() && supabase) {
        // 1. Update application in Supabase
        const { error: appErr } = await supabase
          .from('applications')
          .update({
            status: newStatus,
            reviewed_by: user.id,
            reviewed_at: nowTs,
          })
          .eq('id', appId);

        if (appErr) throw appErr;

        // 2. If accepted, upsert active project membership in Supabase
        if (newStatus === 'accepted' && app) {
          const { error: memErr } = await supabase
            .from('project_members')
            .upsert(
              {
                project_id: app.project_id,
                user_id: app.user_id,
                role: app.role || 'student',
                status: 'active',
              },
              { onConflict: 'project_id,user_id' }
            );

          if (memErr) throw memErr;
        }
      }

      // 3. FastAPI SHA-256 Ledger logging (non-blocking)
      try {
        if (newStatus === 'accepted') {
          await acceptApplicantApi(appId, user.id);
        } else {
          await rejectApplicantApi(appId, { reviewer_id: user.id });
        }
      } catch (ledgerErr) {
        console.warn('[MyApplications] SHA-256 ledger provenance logging note:', ledgerErr);
      }

      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      );
    } catch (err: any) {
      alert(`Action failed: ${err.message || err}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">
            {isOrg ? 'Applicant Review Queue' : 'My Research Applications'}
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            {isOrg
              ? 'Review live candidate proposals, inspect AI match rationale, and admit contributors.'
              : 'Track submitted proposals, AI compatibility matching scores, and admission status.'}
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
          onClick={loadApps}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <Card className="p-4 bg-[#FEF2F2] border-[#FCA5A5] flex items-center justify-between text-xs text-[#991B1B]">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-[#DC2626] shrink-0" />
            <span>Database Error: {error}</span>
          </div>
          <Button size="sm" variant="secondary" onClick={loadApps}>
            Retry
          </Button>
        </Card>
      )}

      {/* Applications list */}
      <div className="space-y-4">
        {loading && !error ? (
          <div className="text-center py-12 text-xs text-[#64748B]">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#1D4ED8]" />
            Loading live applications from database...
          </div>
        ) : applications.length === 0 && !error ? (
          <Card className="p-8 text-center bg-white">
            <FileText size={32} className="mx-auto text-[#94A3B8] mb-2" />
            <h3 className="text-sm font-semibold text-[#0F172A]">No applications found</h3>
            <p className="text-xs text-[#64748B] mt-1">
              {isOrg
                ? 'No prospective contributors currently awaiting review.'
                : 'You have not submitted any applications to active projects yet.'}
            </p>
            {!isOrg && (
              <Button size="sm" className="mt-4" onClick={() => navigate('/projects')}>
                Explore Research Projects
              </Button>
            )}
          </Card>
        ) : (
          applications.map((app) => (
            <Card key={app.id} className="p-5 bg-white space-y-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded">
                      Role: {(app.role || 'student').toUpperCase()}
                    </span>
                    <StatusBadge status={app.status} />
                    <span className="text-xs text-[#94A3B8]">
                      Submitted {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#0F172A]">
                    {app.project_title || 'Research Project'}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                    <Building2 size={13} />
                    <span>{app.org_name || 'Organization'}</span>
                    {app.domain && (
                      <>
                        <span>•</span>
                        <span>{app.domain}</span>
                      </>
                    )}
                  </div>

                  {isOrg && (
                    <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center text-[10px] font-bold">
                          {(app.display_name || 'U').charAt(0)}
                        </div>
                        <span className="font-semibold text-[#0F172A]">{app.display_name}</span>
                        {app.email && <span className="text-[#64748B]">({app.email})</span>}
                      </div>
                      <div className="space-y-1">
                        {app.education && (
                          <p className="text-[#475569]">
                            <strong>Education:</strong> {app.education}
                          </p>
                        )}
                        {app.availability && (
                          <p className="text-[#475569]">
                            <strong>Availability:</strong> {app.availability}
                          </p>
                        )}
                        {app.applicant_skills && app.applicant_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {app.applicant_skills.map((s: string) => (
                              <span key={s} className="px-1.5 py-0.5 bg-white text-[#334155] border rounded text-[10px]">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Proposal message */}
                  <div className="text-xs text-[#334155] bg-[#FAFAFA] p-3 rounded border border-[#F1F5F9]">
                    <span className="font-semibold text-[#0F172A] block mb-1">Proposal Statement:</span>
                    <p className="italic">{app.message}</p>
                  </div>

                  {/* AI Match Reasons */}
                  {app.match_score !== undefined && app.match_score !== null && (
                    <div className="p-3 bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1D4ED8] flex items-center gap-1.5">
                          <Sparkles size={14} /> AI Matching Compatibility
                        </span>
                        <span className="font-bold text-sm text-[#1D4ED8]">
                          {app.match_score > 1 ? app.match_score : Math.round(app.match_score * 100)}% Match
                        </span>
                      </div>
                      {Array.isArray(app.match_reasons) && app.match_reasons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {app.match_reasons.map((reason: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-[11px] bg-white text-[#1E40AF] border border-[#BFDBFE]"
                            >
                              ✓ {reason}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="md:w-48 shrink-0 flex flex-col gap-2">
                  {isOrg && app.status === 'pending' ? (
                    <>
                      <Button
                        size="sm"
                        className="w-full justify-center"
                        icon={<CheckCircle2 size={14} />}
                        onClick={() => handleUpdateStatus(app.id, 'accepted')}
                        disabled={actionLoading === app.id}
                      >
                        {actionLoading === app.id ? 'Processing...' : 'Accept Applicant'}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        className="w-full justify-center"
                        icon={<XCircle size={14} />}
                        onClick={() => handleUpdateStatus(app.id, 'rejected')}
                        disabled={actionLoading === app.id}
                      >
                        Decline
                      </Button>
                    </>
                  ) : app.status === 'accepted' ? (
                    <Button
                      size="sm"
                      className="w-full justify-center"
                      icon={<ChevronRight size={14} />}
                      onClick={() => navigate(`/projects/${app.project_id}/workspace`)}
                    >
                      Enter Workspace
                    </Button>
                  ) : app.status === 'rejected' ? (
                    <div className="text-center p-3 bg-[#FEF2F2] rounded border border-[#FEE2E2] text-xs text-[#991B1B]">
                      <XCircle size={16} className="mx-auto mb-1 text-[#EF4444]" />
                      Application Declined
                    </div>
                  ) : (
                    <div className="text-center p-3 bg-[#F8FAFC] rounded border border-[#E2E8F0] text-xs text-[#64748B]">
                      <Clock size={16} className="mx-auto mb-1 text-[#94A3B8]" />
                      Org reviewing proposal
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
