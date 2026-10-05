import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, ClipboardList, GitCommitHorizontal, Coins,
  Star, ArrowRight, Clock, CheckCircle2, Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, StatCard } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/EmptyState';
import {
  DEMO_CONTRIBUTIONS, getUserProjects, getUserCredits,
  DEMO_MEMBERSHIPS, DEMO_USERS,
} from '../../lib/demo-data';

export function MentorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const myProjects = getUserProjects(user.id);
  const totalCredits = getUserCredits(user.id);
  const myContributions = DEMO_CONTRIBUTIONS.filter(c => c.contributor_id === user.id);
  const pendingReviews = DEMO_CONTRIBUTIONS.filter(c => c.status === 'pending');

  // Mentees (students in the same projects)
  const myProjectIds = myProjects.map(p => p.id);
  const menteeIds = new Set(
    DEMO_MEMBERSHIPS
      .filter(m => myProjectIds.includes(m.project_id) && m.role === 'student')
      .map(m => m.user_id)
  );
  const mentees = DEMO_USERS.filter(u => menteeIds.has(u.id));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welcome, ${user.display_name}`}
        description="Your mentoring and review overview"
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Projects" value={myProjects.length} icon={<Briefcase size={18} />} />
        <StatCard label="Pending Reviews" value={pendingReviews.length} icon={<ClipboardList size={18} />} />
        <StatCard label="Total Credits" value={totalCredits} icon={<Coins size={18} />} />
        <StatCard label="Mentees" value={mentees.length} icon={<Users size={18} />} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          {/* Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Projects</CardTitle>
            </CardHeader>
            {myProjects.map(project => (
              <div
                key={project.id}
                onClick={() => navigate(`/workspace/${project.id}`)}
                className="flex items-center justify-between p-3 border border-[#E2E8F0] rounded-lg mb-2 cursor-pointer hover:border-[#CBD5E1] transition-all"
              >
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{project.title}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">{project.organization?.name} · {project.domain}</p>
                </div>
                <StatusBadge status={project.status} />
              </div>
            ))}
          </Card>

          {/* Pending Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Reviews</CardTitle>
            </CardHeader>
            {pendingReviews.length === 0 ? (
              <p className="text-xs text-[#64748B]">All reviews are up to date</p>
            ) : (
              pendingReviews.map(contrib => {
                const contributor = DEMO_USERS.find(u => u.id === contrib.contributor_id);
                return (
                  <div key={contrib.id} className="activity-item">
                    <div className="w-8 h-8 rounded-lg bg-[#FFFBEB] flex items-center justify-center flex-shrink-0">
                      <Clock size={14} className="text-[#B45309]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[#0F172A]">{contrib.description}</p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        by {contributor?.display_name} · {contrib.type}
                      </p>
                    </div>
                    <Button variant="secondary" size="sm">Review</Button>
                  </div>
                );
              })
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mentees</CardTitle>
            </CardHeader>
            {mentees.map(mentee => (
              <div key={mentee.id} className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-[#1D4ED8] flex items-center justify-center text-white text-xs font-semibold">
                  {mentee.display_name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">{mentee.display_name}</p>
                  <p className="text-xs text-[#64748B]">{mentee.email}</p>
                </div>
              </div>
            ))}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Contributions</CardTitle>
            </CardHeader>
            {myContributions.map(contrib => (
              <div key={contrib.id} className="flex items-center justify-between py-2 border-b border-[#E2E8F0] last:border-0">
                <div>
                  <p className="text-xs text-[#0F172A]">{contrib.description}</p>
                  <p className="text-[10px] text-[#64748B]">{contrib.type}</p>
                </div>
                <span className="text-xs font-medium text-[#B45309]">+{contrib.credits_awarded}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
