import { useState, useEffect } from 'react';
import {
  Star, MessageSquare, Award, ThumbsUp,
  User, CheckCircle2, Plus, Shield, Loader2, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';
import {
  fetchProjects,
  fetchProjectDetails,
  fetchRatingsApi,
  submitRatingApi
} from '../../lib/api';

export function RatingsPage() {
  const { user } = useAuth();

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit Rating Modal State
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [targetMemberId, setTargetMemberId] = useState('');
  const [techRating, setTechRating] = useState('5');
  const [collabRating, setCollabRating] = useState('5');
  const [timelineRating, setTimelineRating] = useState('5');
  const [charterRating, setCharterRating] = useState('5');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load initial projects
  useEffect(() => {
    async function init() {
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
    init();
  }, []);

  // When selected project changes, load project details and ratings
  useEffect(() => {
    async function loadProjectRatings() {
      if (!selectedProjectId) return;
      try {
        const [projDetails, ratingList] = await Promise.all([
          fetchProjectDetails(selectedProjectId, user?.id),
          fetchRatingsApi(selectedProjectId).catch(() => []),
        ]);
        setProjectMembers(projDetails?.members || []);
        setRatings(ratingList || []);
        const eligibleTargets = (projDetails?.members || []).filter((m: any) => m.user_id !== user?.id);
        if (eligibleTargets.length > 0) {
          setTargetMemberId(eligibleTargets[0].user_id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadProjectRatings();
  }, [selectedProjectId, user?.id]);

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProjectId || !targetMemberId) return;
    setIsSubmitting(true);
    try {
      await submitRatingApi(selectedProjectId, {
        rater_id: user.id,
        rated_id: targetMemberId,
        technical: Number(techRating),
        collaboration: Number(collabRating),
        timeline: Number(timelineRating),
        charter_integrity: Number(charterRating),
        comment,
      });
      setIsRateModalOpen(false);
      setComment('');
      const updatedRatings = await fetchRatingsApi(selectedProjectId);
      setRatings(updatedRatings || []);
    } catch (err: any) {
      alert(err.message || 'Rating submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 size={36} className="mx-auto text-[#1D4ED8] animate-spin mb-3" />
        <h3 className="text-sm font-semibold text-[#0F172A]">Loading bilateral peer ratings...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
            <Star size={22} className="text-[#F59E0B]" /> Multi-Dimensional Peer & Mentor Ratings
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Holistic merit evaluations across Technical Depth, Collaboration, Timeline Adherence, and Charter Integrity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg font-medium text-[#0F172A]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}

          <Button
            icon={<Plus size={16} />}
            onClick={() => setIsRateModalOpen(true)}
            disabled={!selectedProjectId || projectMembers.filter((m) => m.user_id !== user?.id).length === 0}
          >
            Submit Rating
          </Button>
        </div>
      </div>

      {/* Ratings List */}
      <Card className="p-6 bg-white space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <h3 className="text-sm font-bold text-[#0F172A]">
            Evaluations on Record ({ratings.length})
          </h3>
          <span className="text-xs text-[#64748B]">Bilateral feedback registered on ledger</span>
        </div>

        {ratings.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#64748B]">
            <Star size={32} className="mx-auto text-[#F59E0B] mb-2" />
            <p className="font-semibold text-[#0F172A]">No ratings submitted yet for this project</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Team participants can submit bilateral ratings after milestone collaboration.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {ratings.map((r) => {
              const avg = ((r.technical + r.collaboration + r.timeline + r.charter_integrity) / 4).toFixed(1);

              return (
                <div key={r.id} className="p-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#0F172A]">
                        {r.rater_name} evaluated {r.rated_name}
                      </p>
                      <p className="text-[10px] text-[#64748B]">
                        Submitted {new Date(r.created_at).toLocaleDateString()} • Verified on SHA-256 Ledger
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded border border-[#E2E8F0]">
                      <Star size={13} className="text-[#F59E0B] fill-[#F59E0B]" />
                      <strong className="text-sm text-[#0F172A]">{avg}</strong>
                      <span className="text-[10px] text-[#64748B]">/ 5.0</span>
                    </div>
                  </div>

                  <p className="text-[#334155] italic bg-white p-2.5 rounded border border-[#E2E8F0]">
                    "{r.comment}"
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 bg-white rounded border border-[#E2E8F0]">
                      <span className="text-[#64748B] block">Technical Depth</span>
                      <strong className="text-[#0F172A]">{r.technical}/5</strong>
                    </div>
                    <div className="p-2 bg-white rounded border border-[#E2E8F0]">
                      <span className="text-[#64748B] block">Collaboration</span>
                      <strong className="text-[#0F172A]">{r.collaboration}/5</strong>
                    </div>
                    <div className="p-2 bg-white rounded border border-[#E2E8F0]">
                      <span className="text-[#64748B] block">Timeline Adherence</span>
                      <strong className="text-[#0F172A]">{r.timeline}/5</strong>
                    </div>
                    <div className="p-2 bg-white rounded border border-[#E2E8F0]">
                      <span className="text-[#64748B] block">Charter Integrity</span>
                      <strong className="text-[#0F172A]">{r.charter_integrity}/5</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Submit Rating Modal */}
      <Modal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        title="Submit Bilateral Rating"
        subtitle="Evaluate project peer across 4 governance dimensions"
      >
        <form onSubmit={handleSubmitRating} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#334155] mb-1">Select Participant</label>
            <select
              value={targetMemberId}
              onChange={(e) => setTargetMemberId(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-white border border-[#CBD5E1] rounded-md"
              required
            >
              {projectMembers
                .filter((m) => m.user_id !== user?.id)
                .map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.display_name} ({m.role.replace('_', ' ')})
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#334155] mb-1">Technical Depth (1-5)</label>
              <select
                value={techRating}
                onChange={(e) => setTechRating(e.target.value)}
                className="w-full h-9 px-2 text-xs bg-white border border-[#CBD5E1] rounded-md"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} Stars</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#334155] mb-1">Collaboration (1-5)</label>
              <select
                value={collabRating}
                onChange={(e) => setCollabRating(e.target.value)}
                className="w-full h-9 px-2 text-xs bg-white border border-[#CBD5E1] rounded-md"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} Stars</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#334155] mb-1">Timeline Adherence (1-5)</label>
              <select
                value={timelineRating}
                onChange={(e) => setTimelineRating(e.target.value)}
                className="w-full h-9 px-2 text-xs bg-white border border-[#CBD5E1] rounded-md"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} Stars</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#334155] mb-1">Charter Integrity (1-5)</label>
              <select
                value={charterRating}
                onChange={(e) => setCharterRating(e.target.value)}
                className="w-full h-9 px-2 text-xs bg-white border border-[#CBD5E1] rounded-md"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} Stars</option>
                ))}
              </select>
            </div>
          </div>

          <Textarea
            label="Feedback & Justification"
            placeholder="Describe technical competence, responsiveness, and adherence to AI governance rules..."
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsRateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Logging to Ledger...' : 'Commit Rating'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
