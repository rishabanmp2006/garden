import { useState } from 'react';
import {
  ShieldCheck, CheckCircle2, XCircle, FileText,
  Building2, GraduationCap, AlertCircle, ExternalLink
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function AdminVerificationPage() {
  const [queue, setQueue] = useState([
    {
      id: 'v-1',
      name: 'Arun Kumar',
      type: 'Student Academic ID',
      institution: 'IIT Madras',
      email: 'arun.kumar@university.edu',
      document: 'student_id_scan_2026.pdf',
      status: 'pending',
      date: '2026-10-04',
    },
    {
      id: 'v-2',
      name: 'BioGenix Analytics',
      type: 'Biotech Enterprise Entity',
      institution: 'BioGenix LLC',
      email: 'research@biogenix.io',
      document: 'corporate_registration_cin.pdf',
      status: 'pending',
      date: '2026-10-03',
    },
  ]);

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
            <ShieldCheck size={22} className="text-[#1D4ED8]" /> Identity & Academic Verification Queue
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Audit institutional credentials and enterprise registrations before granting verified badges.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {queue.length === 0 ? (
          <Card className="p-8 text-center bg-white">
            <CheckCircle2 size={32} className="mx-auto text-[#15803D] mb-2" />
            <h3 className="text-sm font-semibold text-[#0F172A]">All pending verifications processed</h3>
            <p className="text-xs text-[#64748B] mt-1">Verification queue is completely clear.</p>
          </Card>
        ) : (
          queue.map((item) => (
            <Card key={item.id} className="p-5 bg-white space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#0F172A]">{item.name}</h3>
                    <span className="text-[10px] font-semibold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B]">{item.institution} • {item.email}</p>
                  <p className="text-xs text-[#475569] flex items-center gap-1 font-mono pt-1">
                    <FileText size={13} className="text-[#1D4ED8]" /> Proof: {item.document}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" icon={<CheckCircle2 size={13} />} onClick={() => handleAction(item.id, 'approved')}>
                    Approve & Verify
                  </Button>
                  <Button size="sm" variant="danger" icon={<XCircle size={13} />} onClick={() => handleAction(item.id, 'rejected')}>
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
