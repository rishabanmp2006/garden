import { useState } from 'react';
import {
  Star, MessageSquare, Award, ThumbsUp,
  User, CheckCircle2, Plus, Shield
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Textarea, Select } from '../../components/ui/Input';
import { DEMO_USERS, DEMO_PROJECTS } from '../../lib/demo-data';

export function RatingsPage() {
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [targetMember, setTargetMember] = useState('user-student-1');
  const [techRating, setTechRating] = useState('5');
  const [collabRating, setCollabRating] = useState('5');
  const [timelineRating, setTimelineRating] = useState('4');
  const [charterRating, setCharterRating] = useState('5');
  const [comment, setComment] = useState('');

  const [reviews, setReviews] = useState([
    {
      id: 'rev-1',
      author: 'Dr. Meera Krishnan',
      authorRole: 'Mentor',
      target: 'Rishaban MP',
      targetRole: 'Student',
      project: 'Nova Biotech Retina Edge',
      overall: 4.8,
      dimensions: { technical: 5, collaboration: 5, timeline: 4, charter: 5 },
      comment:
        'Outstanding work on the NovaScan v3 normalization pipeline. Showed thorough understanding of edge optimization constraints and diligently documented AI assistance as required by Charter v1.',
      date: '2026-10-02',
    },
    {
      id: 'rev-2',
      author: 'Nova Biotech Labs',
      authorRole: 'Organization',
      target: 'Rishaban MP',
      targetRole: 'Student',
      project: 'Nova Biotech Retina Edge',
      overall: 4.9,
      dimensions: { technical: 5, collaboration: 5, timeline: 5, charter: 5 },
      comment:
        'Deliverable exceeded milestone criteria. Code passed all unit tests and Docker edge containerization benchmarks on Jetson Nano.',
      date: '2026-10-04',
    },
    {
      id: 'rev-3',
      author: 'Rishaban MP',
      authorRole: 'Student',
      target: 'Dr. Meera Krishnan',
      targetRole: 'Mentor',
      project: 'Nova Biotech Retina Edge',
      overall: 5.0,
      dimensions: { technical: 5, collaboration: 5, timeline: 5, charter: 5 },
      comment:
        'Invaluable guidance on the clinical sensitivity requirements for diabetic retinopathy. Ensured our validation loss metrics conformed to FDA standards.',
      date: '2026-10-03',
    },
  ]);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = DEMO_USERS.find((u) => u.id === targetMember);
    const overallScore =
      (Number(techRating) + Number(collabRating) + Number(timelineRating) + Number(charterRating)) / 4;

    const newRev = {
      id: `rev-${Date.now()}`,
      author: 'You (Current User)',
      authorRole: 'Peer Collaborator',
      target: targetUser?.display_name || 'Collaborator',
      targetRole: targetUser?.role || 'Contributor',
      project: 'Nova Biotech Retina Edge',
      overall: Number(overallScore.toFixed(1)),
      dimensions: {
        technical: Number(techRating),
        collaboration: Number(collabRating),
        timeline: Number(timelineRating),
        charter: Number(charterRating),
      },
      comment,
      date: new Date().toISOString().split('T')[0],
    };

    setReviews([newRev, ...reviews]);
    setIsRateModalOpen(false);
    setComment('');
  };

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

        <Button size="sm" icon={<Plus size={14} />} onClick={() => setIsRateModalOpen(true)}>
          Submit Peer Evaluation
        </Button>
      </div>

      {/* Aggregate Rating Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-[#CBD5E1]">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-1">
            Technical Depth
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#0F172A]">4.9</span>
            <div className="flex text-[#F59E0B]">
              <Star size={14} fill="#F59E0B" />
              <Star size={14} fill="#F59E0B" />
              <Star size={14} fill="#F59E0B" />
              <Star size={14} fill="#F59E0B" />
              <Star size={14} fill="#F59E0B" />
            </div>
          </div>
          <span className="text-[11px] text-[#64748B] mt-1 block">Based on code & PR quality</span>
        </Card>

        <Card className="p-4 bg-white border-[#CBD5E1]">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-1">
            Collaboration & Comms
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#0F172A]">4.8</span>
            <div className="flex text-[#F59E0B]">
              <Star size={14} fill="#F59E0B" />
              <Star size={14} fill="#F59E0B" />
              <Star size={14} fill="#F59E0B" />
              <Star size={14} fill="#F59E0B" />
              <Star size={14} fill="#F59E0B" />
            </div>
          </div>
          <span className="text-[11px] text-[#64748B] mt-1 block">Team responsiveness & empathy</span>
        </Card>

        <Card className="p-4 bg-white border-[#CBD5E1]">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-1">
            Timeline Adherence
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#0F172A]">4.7</span>
            <div className="flex text-[#F59E0B]">
              <Star size={14} fill="#F59E0B" />
              <Star size={14} fill="#F59E0B" />
              <Star size={14} fill="#F59E0B" />
              <Star size={14} fill="#F59E0B" />
              <Star size={14} />
            </div>
          </div>
          <span className="text-[11px] text-[#64748B] mt-1 block">Milestone due date reliability</span>
        </Card>

        <Card className="p-4 bg-white border-[#CBD5E1]">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-1">
            Charter Integrity
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#15803D]">5.0</span>
            <Shield size={16} className="text-[#15803D]" />
          </div>
          <span className="text-[11px] text-[#15803D] font-medium mt-1 block">
            100% Policy & IP Compliance
          </span>
        </Card>
      </div>

      {/* Reviews Feed */}
      <Card className="p-6 bg-white space-y-4">
        <h3 className="text-base font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3">
          Peer & Mentor Feedback Stream
        </h3>

        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="p-4 rounded-lg border border-[#E2E8F0] text-xs space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#0F172A]">{rev.author}</span>
                  <span className="text-[11px] text-[#64748B]">({rev.authorRole})</span>
                  <span className="text-[#CBD5E1]">→</span>
                  <span className="font-semibold text-[#1D4ED8]">{rev.target}</span>
                  <span className="text-[11px] text-[#64748B]">({rev.targetRole})</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center text-[#F59E0B] font-bold">
                    <Star size={13} fill="#F59E0B" className="mr-1" />
                    <span>{rev.overall} / 5.0</span>
                  </div>
                  <span className="text-[#94A3B8] text-[11px]">• {rev.date}</span>
                </div>
              </div>

              <p className="text-[#334155] leading-relaxed italic bg-[#F8FAFC] p-3 rounded border border-[#F1F5F9]">
                "{rev.comment}"
              </p>

              <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#64748B] pt-1">
                <span>Technical: <strong>{rev.dimensions.technical}/5</strong></span>
                <span>Collaboration: <strong>{rev.dimensions.collaboration}/5</strong></span>
                <span>Timeline: <strong>{rev.dimensions.timeline}/5</strong></span>
                <span>Charter: <strong>{rev.dimensions.charter}/5</strong></span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Evaluation Modal */}
      <Modal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        title="Submit Peer Evaluation"
        subtitle="Evaluations are weighted into public verifiable researcher score"
      >
        <form onSubmit={handleAddReview} className="space-y-4 text-xs">
          <Select
            label="Select Collaborator to Review"
            value={targetMember}
            onChange={(e) => setTargetMember(e.target.value)}
            options={DEMO_USERS.filter((u) => u.role !== 'admin').map((u) => ({
              value: u.id,
              label: `${u.display_name} (${u.role.toUpperCase()})`,
            }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Technical Depth (1-5)"
              value={techRating}
              onChange={(e) => setTechRating(e.target.value)}
              options={['5', '4', '3', '2', '1'].map((v) => ({ value: v, label: `${v} Stars` }))}
            />
            <Select
              label="Collaboration & Communication"
              value={collabRating}
              onChange={(e) => setCollabRating(e.target.value)}
              options={['5', '4', '3', '2', '1'].map((v) => ({ value: v, label: `${v} Stars` }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Timeline & Punctuality"
              value={timelineRating}
              onChange={(e) => setTimelineRating(e.target.value)}
              options={['5', '4', '3', '2', '1'].map((v) => ({ value: v, label: `${v} Stars` }))}
            />
            <Select
              label="Charter & AI Disclosure Adherence"
              value={charterRating}
              onChange={(e) => setCharterRating(e.target.value)}
              options={['5', '4', '3', '2', '1'].map((v) => ({ value: v, label: `${v} Stars` }))}
            />
          </div>

          <Textarea
            label="Qualitative Feedback & Observations"
            placeholder="Share specific observations regarding their technical contributions or mentor guidance..."
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsRateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Submit Evaluation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
