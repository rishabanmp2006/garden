import { useState } from 'react';
import {
  AlertTriangle, CheckCircle2, Shield, Scale,
  User, MessageSquare, ChevronRight
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';

export function AdminDisputesPage() {
  const [disputes, setDisputes] = useState([
    {
      id: 'disp-1',
      project: 'Nova Biotech Retina Edge',
      raisedBy: 'Priya Sharma',
      against: 'Nova Biotech Labs',
      type: 'Authorship Percentage Allocation',
      status: 'review',
      description:
        'Contributor completed data annotation curation for 15,000 retinal scans, but requested co-authorship credit was downgraded to secondary acknowledgments.',
      charterClause: 'Charter v1 Clause 1: Co-authorship guaranteed for contributors with >15% verified ledger credits.',
      date: '2026-10-04',
      resolution: '',
    },
  ]);

  const [selectedDispute, setSelectedDispute] = useState<typeof disputes[0] | null>(null);
  const [rulingText, setRulingText] = useState('');

  const handleResolve = () => {
    if (!selectedDispute) return;
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === selectedDispute.id
          ? { ...d, status: 'resolved', resolution: rulingText }
          : d
      )
    );
    setSelectedDispute(null);
    setRulingText('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
            <Scale size={22} className="text-[#1D4ED8]" /> Dispute Resolution Council
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Adjudicate authorship disputes, credit distribution contestations, and charter violations.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {disputes.map((d) => (
          <Card key={d.id} className="p-5 bg-white space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#B45309] bg-[#FFFBEB] px-2 py-0.5 rounded border border-[#FEF3C7]">
                    {d.type}
                  </span>
                  <StatusBadge status={d.status} />
                  <span className="text-xs text-[#64748B]">• Filed {d.date}</span>
                </div>

                <h3 className="text-sm font-bold text-[#0F172A]">{d.project}</h3>

                <p className="text-xs text-[#334155] leading-relaxed">
                  <strong>Contestation:</strong> {d.description}
                </p>

                <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] text-[#475569]">
                  <span className="font-semibold text-[#0F172A]">Cited Governance: </span>
                  {d.charterClause}
                </div>

                {d.resolution && (
                  <div className="p-2.5 bg-[#F0FDF4] border border-[#DCFCE7] rounded text-[11px] text-[#166534]">
                    <strong>Council Ruling: </strong> {d.resolution}
                  </div>
                )}
              </div>

              {d.status !== 'resolved' && (
                <Button size="sm" onClick={() => setSelectedDispute(d)}>
                  Issue Council Ruling
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Ruling Modal */}
      <Modal
        isOpen={!!selectedDispute}
        onClose={() => setSelectedDispute(null)}
        title="Issue Binding Council Ruling"
        subtitle={selectedDispute?.project}
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#475569]">
            Review verified SHA-256 ledger records to ensure findings strictly reflect verifiable contribution percentages.
          </p>

          <Textarea
            label="Binding Resolution Verdict"
            placeholder="e.g., Ledger confirms 16.2% verified credits. Pursuant to Charter Clause 1, contributor is granted Co-Author status on manuscript..."
            rows={4}
            value={rulingText}
            onChange={(e) => setRulingText(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="secondary" onClick={() => setSelectedDispute(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleResolve} disabled={!rulingText.trim()}>
              Sign & Commit Ruling
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
