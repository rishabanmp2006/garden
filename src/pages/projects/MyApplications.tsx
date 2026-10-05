import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, CheckCircle2, XCircle, Clock, Sparkles,
  Building2, ChevronRight, UserCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import {
  DEMO_APPLICATIONS, DEMO_PROJECTS, DEMO_USERS, DEMO_PROFILES
} from '../../lib/demo-data';
import type { Application } from '../../types';

export function MyApplications() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<Application[]>(DEMO_APPLICATIONS);

  const isOrg = user?.role === 'organization' || user?.role === 'admin';

  const handleUpdateStatus = (appId: string, newStatus: 'accepted' | 'rejected') => {
    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
    );
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
              ? 'Review candidate proposals, verify AI match rationale, and admit contributors.'
              : 'Track candidate submissions, AI compatibility matching scores, and admission status.'}
          </p>
        </div>
      </div>

      {/* Applications list */}
      <div className="space-y-4">
        {applications.length === 0 ? (
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
          applications.map((app) => {
            const project = DEMO_PROJECTS.find((p) => p.id === app.project_id);
            const applicant = DEMO_USERS.find((u) => u.id === app.user_id);
            const applicantProfile = DEMO_PROFILES.find((p) => p.user_id === app.user_id);

            return (
              <Card key={app.id} className="p-5 bg-white space-y-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded">
                        Role: {app.role.toUpperCase()}
                      </span>
                      <StatusBadge status={app.status} />
                      <span className="text-xs text-[#94A3B8]">
                        Submitted {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#0F172A]">
                      {project?.title || 'Research Project'}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                      <Building2 size={13} />
                      <span>{project?.organization?.name}</span>
                      <span>•</span>
                      <span>{project?.domain}</span>
                    </div>

                    {isOrg && applicant && (
                      <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center text-[10px] font-bold">
                            {applicant.display_name.charAt(0)}
                          </div>
                          <span className="font-semibold text-[#0F172A]">{applicant.display_name}</span>
                          <span className="text-[#64748B]">({applicant.email})</span>
                        </div>
                        {applicantProfile && (
                          <div className="space-y-1">
                            <p className="text-[#475569]">
                              <strong>Education:</strong> {applicantProfile.education}
                            </p>
                            <p className="text-[#475569]">
                              <strong>Availability:</strong> {applicantProfile.availability}
                            </p>
                            <div className="flex flex-wrap gap-1 pt-1">
                              {applicantProfile.skills.map((s) => (
                                <span key={s} className="px-1.5 py-0.2 bg-white text-[#334155] border rounded text-[10px]">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Proposal message */}
                    <div className="text-xs text-[#334155] bg-[#FAFAFA] p-3 rounded border border-[#F1F5F9]">
                      <span className="font-semibold text-[#0F172A] block mb-1">Proposal Statement:</span>
                      <p className="italic">{app.message}</p>
                    </div>

                    {/* AI Match Reasons */}
                    {app.match_score && (
                      <div className="p-3 bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#1D4ED8] flex items-center gap-1.5">
                            <Sparkles size={14} /> AI Matching Compatibility
                          </span>
                          <span className="font-bold text-sm text-[#1D4ED8]">
                            {Math.round(app.match_score * 100)}% Match
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {app.match_reasons?.map((reason, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-[11px] bg-white text-[#1E40AF] border border-[#BFDBFE]"
                            >
                              ✓ {reason}
                            </span>
                          ))}
                        </div>
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
                        >
                          Accept Applicant
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="w-full justify-center"
                          icon={<XCircle size={14} />}
                          onClick={() => handleUpdateStatus(app.id, 'rejected')}
                        >
                          Decline
                        </Button>
                      </>
                    ) : app.status === 'accepted' ? (
                      <Button
                        size="sm"
                        className="w-full justify-center"
                        icon={<ChevronRight size={14} />}
                        onClick={() => navigate(`/workspace/${app.project_id}`)}
                      >
                        Enter Workspace
                      </Button>
                    ) : (
                      <div className="text-center p-3 bg-[#F8FAFC] rounded border border-[#E2E8F0] text-xs text-[#64748B]">
                        <Clock size={16} className="mx-auto mb-1 text-[#94A3B8]" />
                        Org reviewing proposal
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
