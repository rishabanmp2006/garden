import { useState } from 'react';
import {
  Sparkles, Bot, Users, CheckCircle2,
  ArrowRight, Building2, Search, Send
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import {
  DEMO_PROJECTS, DEMO_USERS, DEMO_PROFILES, DEMO_CREDITS
} from '../../lib/demo-data';

export function MatchingPage() {
  const [selectedProjectId, setSelectedProjectId] = useState(DEMO_PROJECTS[0].id);
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);

  const project = DEMO_PROJECTS.find((p) => p.id === selectedProjectId) || DEMO_PROJECTS[0];

  // Candidates with computed match scores
  const candidates = [
    {
      user: DEMO_USERS[1], // Rishaban MP
      profile: DEMO_PROFILES[0],
      score: 96,
      reasons: [
        'Full match on PyTorch & Computer Vision (4/4 skills)',
        '195 verified credits in Healthcare AI domain',
        'Published paper in retinal imaging',
        'Available 20 hrs/week matching milestone timeline',
      ],
    },
    {
      user: DEMO_USERS[2], // Priya Sharma
      profile: DEMO_PROFILES[1],
      score: 84,
      reasons: [
        'Expert in biostatistics & dataset annotation curation',
        '95 verified credits in Clinical Validation',
        'Completed WHO healthcare project',
      ],
    },
    {
      user: DEMO_USERS[3], // Arun Kumar
      profile: DEMO_PROFILES[2],
      score: 74,
      reasons: [
        'Strong edge deployment & C++ runtime optimization',
        'Experience with Jetson Nano & TensorRT',
        'Requires PyTorch refresher',
      ],
    },
  ];

  const handleInvite = (userId: string) => {
    setInvitedUsers([...invitedUsers, userId]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
            <Sparkles size={22} className="text-[#1D4ED8]" /> AI Candidate Matching Engine
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Algorithmic matchmaking pairing verified student talent & mentors to research problem requirements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#64748B]">Target Project:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
          >
            {DEMO_PROJECTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Target Project Criteria Card */}
      <Card className="p-5 bg-white border-[#CBD5E1] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F1F5F9] pb-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">
              Match Criteria Source
            </span>
            <h3 className="text-sm font-bold text-[#0F172A]">{project.title}</h3>
          </div>
          <span className="text-xs font-semibold text-[#1D4ED8] bg-[#EFF6FF] px-2.5 py-1 rounded">
            {project.domain}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-[#64748B]">Required Skills:</span>
          {project.required_skills.map((s) => (
            <span key={s} className="px-2 py-0.5 bg-[#F1F5F9] rounded text-[11px] font-mono text-[#334155]">
              {s}
            </span>
          ))}
        </div>
      </Card>

      {/* Candidate Matches */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
          Ranked Candidates ({candidates.length})
        </h3>

        {candidates.map(({ user, profile, score, reasons }) => {
          const isInvited = invitedUsers.includes(user.id);

          return (
            <Card key={user.id} className="p-5 bg-white hover:border-[#94A3B8] transition-colors space-y-3">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="w-11 h-11 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {user.display_name.charAt(0)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#0F172A]">{user.display_name}</h4>
                      {user.verified && (
                        <span className="inline-flex items-center text-[10px] text-[#15803D] font-semibold bg-[#F0FDF4] px-1.5 py-0.5 rounded border border-[#DCFCE7]">
                          <CheckCircle2 size={10} className="mr-0.5" /> VERIFIED
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#64748B]">{profile.education}</p>
                    <p className="text-xs text-[#475569] pt-1">{profile.bio}</p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {profile.skills.map((s) => (
                        <span key={s} className="px-1.5 py-0.5 bg-[#F8FAFC] border rounded text-[10px] text-[#334155]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Score & Action */}
                <div className="md:w-56 flex flex-col justify-between items-end gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                      AI Compatibility
                    </span>
                    <span className="text-2xl font-bold text-[#1D4ED8]">{score}%</span>
                  </div>

                  {isInvited ? (
                    <Button size="sm" variant="secondary" disabled className="w-full justify-center">
                      Invitation Sent ✓
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      icon={<Send size={13} />}
                      className="w-full justify-center"
                      onClick={() => handleInvite(user.id)}
                    >
                      Invite to Project
                    </Button>
                  )}
                </div>
              </div>

              {/* Rationale Breakdown */}
              <div className="p-3 bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg text-xs space-y-1">
                <span className="font-bold text-[#1D4ED8] block">AI Match Rationale:</span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-[#1E40AF]">
                  {reasons.map((r, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="text-[#15803D]">✓</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
