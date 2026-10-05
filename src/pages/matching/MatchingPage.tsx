import { useState, useEffect } from 'react';
import {
  Sparkles, Bot, Users, CheckCircle2,
  ArrowRight, Building2, Search, Send, Loader2, AlertCircle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { fetchProjects, matchCandidates } from '../../lib/api';

export function MatchingPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const projs = await fetchProjects();
        setProjects(projs || []);
        if (projs && projs.length > 0) {
          setSelectedProjectId(projs[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const project = projects.find((p) => p.id === selectedProjectId) || projects[0];

  useEffect(() => {
    async function runMatching() {
      if (!project) return;
      setMatchingLoading(true);
      try {
        const results = await matchCandidates({
          project_id: project.id,
          required_skills: project.required_skills || [],
          domain: project.domain || 'Healthcare AI',
        });
        setCandidates(results || []);
      } catch (err) {
        console.error(err);
        setCandidates([]);
      } finally {
        setMatchingLoading(false);
      }
    }
    runMatching();
  }, [selectedProjectId]);

  const handleInvite = (userId: string) => {
    setInvitedUsers([...invitedUsers, userId]);
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 size={36} className="mx-auto text-[#1D4ED8] animate-spin mb-3" />
        <h3 className="text-sm font-semibold text-[#0F172A]">Loading matching engine...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
            <Sparkles size={22} className="text-[#1D4ED8]" /> AI Candidate Matching Engine
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Algorithmic matchmaking pairing registered student talent to research problem requirements.
          </p>
        </div>

        {projects.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#64748B]">Target Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {project && (
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
            <span className="text-[#64748B] font-medium">Required Skills:</span>
            {(project.required_skills || []).map((s: string) => (
              <span key={s} className="px-2 py-0.5 bg-[#F1F5F9] text-[#1E293B] font-mono text-[11px] rounded">
                {s}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Candidate List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
          Ranked Candidates ({candidates.length})
        </h3>

        {matchingLoading ? (
          <div className="p-12 text-center text-xs text-[#64748B]">
            <Loader2 size={24} className="mx-auto text-[#1D4ED8] animate-spin mb-2" />
            Calculating reproducible compatibility scores from student profiles...
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#64748B] bg-white rounded-lg border border-[#E2E8F0]">
            No student candidates registered in the system yet.
          </div>
        ) : (
          candidates.map((cand) => (
            <Card key={cand.user_id} className="p-5 bg-white space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center text-sm font-bold">
                    {(cand.name || 'U').charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0F172A]">{cand.name}</h4>
                    <p className="text-[11px] text-[#64748B]">
                      Verified Credits: {cand.verified_credits} • Tier: <strong className="capitalize text-[#1D4ED8]">{cand.recommendation_tier}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-[#64748B] block">Compatibility</span>
                    <strong className="text-lg font-bold text-[#1D4ED8]">{cand.compatibility_score}%</strong>
                  </div>
                  <Button
                    size="sm"
                    variant={invitedUsers.includes(cand.user_id) ? 'secondary' : 'primary'}
                    onClick={() => handleInvite(cand.user_id)}
                    disabled={invitedUsers.includes(cand.user_id)}
                  >
                    {invitedUsers.includes(cand.user_id) ? 'Invited ✓' : 'Invite Candidate'}
                  </Button>
                </div>
              </div>

              {cand.match_reasons && cand.match_reasons.length > 0 && (
                <div className="pt-2 border-t border-[#F1F5F9] text-xs space-y-1">
                  <span className="text-[11px] font-semibold text-[#334155] block">Algorithmic Justification:</span>
                  <ul className="list-disc list-inside text-[#64748B] space-y-0.5">
                    {cand.match_reasons.map((r: string, i: number) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
