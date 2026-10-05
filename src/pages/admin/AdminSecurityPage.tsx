import { useState } from 'react';
import {
  ShieldAlert, Lock, CheckCircle2, AlertTriangle,
  Search, Eye, FileText
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function AdminSecurityPage() {
  const [watermarkSearch, setWatermarkSearch] = useState('');
  const [watermarkResult, setWatermarkResult] = useState<string | null>(null);

  const securityEvents = [
    {
      id: 'sec-1',
      event: 'AI Egress Blocked: Cloud API Access Denied',
      details: 'Prompt contained confidential dataset headers; automatically routed away from external cloud endpoint to local Ollama sandbox.',
      severity: 'high',
      time: '12 mins ago',
    },
    {
      id: 'sec-2',
      event: 'Watermarked File Download Audit',
      details: 'User Rishaban MP downloaded "novascan_v3_preprocessing.py". Watermark hash 7e2c9... embedded.',
      severity: 'info',
      time: '45 mins ago',
    },
    {
      id: 'sec-3',
      event: 'Ledger Hash Tamper Simulation Executed',
      details: 'Block modification simulated; alert successfully fired and displayed to testing administrator.',
      severity: 'info',
      time: '2 hours ago',
    },
  ];

  const handleVerifyWatermark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!watermarkSearch.trim()) return;
    setWatermarkResult(
      `Watermark Hash Decoded: Origin: Nova Biotech Labs • Authorized Recipient: Rishaban MP (rishaban@university.edu) • Export Policy: Restricted Air-gap • Timestamp: 2026-10-05T10:14:22Z`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
            <ShieldAlert size={22} className="text-[#B91C1C]" /> Security & Watermark Forensics
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Monitor real-time AI policy violations, air-gap egress blocks, and trace leaked files via watermarks.
          </p>
        </div>
      </div>

      {/* Watermark Forensics Card */}
      <Card className="p-6 bg-white space-y-4">
        <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
          <Search size={16} className="text-[#1D4ED8]" /> Cryptographic Watermark Forensic Inspector
        </h3>
        <p className="text-xs text-[#64748B]">
          If a protected research file or dataset is found outside the authorized perimeter, paste its embedded
          hash or footer identifier below to identify the originating licensee.
        </p>

        <form onSubmit={handleVerifyWatermark} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter embedded watermark hash (e.g., 7e2c9... or a7b8c9d0e1f23456...)"
            value={watermarkSearch}
            onChange={(e) => setWatermarkSearch(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
          />
          <Button type="submit" size="sm">
            Inspect Watermark
          </Button>
        </form>

        {watermarkResult && (
          <div className="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-xs text-[#1E40AF] font-mono leading-relaxed">
            {watermarkResult}
          </div>
        )}
      </Card>

      {/* Live Security Log */}
      <Card className="p-6 bg-white space-y-4">
        <h3 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2">
          Security Event Audit Stream
        </h3>

        <div className="space-y-3">
          {securityEvents.map((evt) => (
            <div key={evt.id} className="p-3.5 rounded-lg border border-[#E2E8F0] text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                  {evt.severity === 'high' ? (
                    <AlertTriangle size={14} className="text-[#B91C1C]" />
                  ) : (
                    <CheckCircle2 size={14} className="text-[#1D4ED8]" />
                  )}
                  {evt.event}
                </span>
                <span className="text-[11px] text-[#64748B]">{evt.time}</span>
              </div>
              <p className="text-[#475569]">{evt.details}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
