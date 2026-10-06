import React, { useState } from 'react';
import { GitCommitHorizontal, Eye, Check, X, Loader2 } from 'lucide-react';
import { StatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface WorkspaceContributionsProps {
  contributions: any[];
  canReview: boolean;
  onReviewWork: (contribId: string, verdict: 'approved' | 'rejected', comment: string) => Promise<void>;
  isLoading?: boolean;
}

export function WorkspaceContributions({
  contributions,
  canReview,
  onReviewWork,
  isLoading = false,
}: WorkspaceContributionsProps) {
  const [activeContrib, setActiveContrib] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [verdict, setVerdict] = useState<'approved' | 'rejected'>('approved');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContrib || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onReviewWork(activeContrib.id, verdict, comment.trim());
      setActiveContrib(null);
      setComment('');
    } catch (err: any) {
      alert(`Review action failed: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <GitCommitHorizontal size={16} className="text-[#1D4ED8]" />
          <h2 className="text-sm font-bold text-[#0F172A]">
            Contributions & Deliverables Log
          </h2>
        </div>
        <p className="text-xs text-[#64748B] leading-relaxed">
          Verifiable record of submitted research deliverables. Mentors review code and analysis outputs before releasing credit allocations.
        </p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-[#64748B]">
          Loading contributions...
        </div>
      ) : contributions.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center text-xs text-[#64748B]">
          No deliverables submitted to this project yet.
        </div>
      ) : (
        <div className="space-y-3">
          {contributions.map((contrib) => (
            <div
              key={contrib.id}
              className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-[#0F172A]">
                    {contrib.file_name || 'Deliverable'}
                  </span>
                  <StatusBadge status={contrib.status || 'pending'} />
                </div>

                {contrib.description && (
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {contrib.description}
                  </p>
                )}

                <div className="flex items-center gap-3 text-[11px] text-[#94A3B8] pt-1">
                  <span>Submitted: {contrib.created_at ? new Date(contrib.created_at).toLocaleDateString() : 'Recently'}</span>
                  {contrib.content_hash && (
                    <span className="font-mono truncate max-w-xs">
                      Hash: {contrib.content_hash.slice(0, 12)}...
                    </span>
                  )}
                </div>
              </div>

              {canReview && contrib.status === 'under_review' && (
                <Button
                  size="sm"
                  icon={<Eye size={12} />}
                  onClick={() => {
                    setActiveContrib(contrib);
                    setComment('Code and methodology verified against milestone acceptance criteria.');
                    setVerdict('approved');
                  }}
                >
                  Review
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {activeContrib && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0F172A]">
                Review Deliverable: {activeContrib.file_name}
              </h3>
              <button
                onClick={() => setActiveContrib(null)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Review Verdict
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setVerdict('approved')}
                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                      verdict === 'approved'
                        ? 'border-[#15803D] bg-[#F0FDF4] text-[#15803D]'
                        : 'border-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    <Check size={14} /> Approve Deliverable
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerdict('rejected')}
                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                      verdict === 'rejected'
                        ? 'border-[#DC2626] bg-[#FEF2F2] text-[#DC2626]'
                        : 'border-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    <X size={14} /> Request Revisions
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Mentor Review Feedback
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Provide technical evaluation and feedback"
                  rows={3}
                  className="w-full px-3 py-1.5 text-xs border border-[#CBD5E1] rounded-lg resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveContrib(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
