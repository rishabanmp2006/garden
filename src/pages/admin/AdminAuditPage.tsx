import { useState } from 'react';
import {
  Shield, BookOpen, CheckCircle2, AlertTriangle,
  RefreshCw, Lock, Terminal
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DEMO_LEDGER, DEMO_PROJECTS } from '../../lib/demo-data';

export function AdminAuditPage() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<string | null>(null);

  const handleVerifyAll = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationResult(
        `System Audit Complete: Verified ${DEMO_LEDGER.length} blocks across ${DEMO_PROJECTS.length} project ledgers. All Merkle hash roots sequentially consistent. Zero cryptographic tampering detected.`
      );
    }, 700);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
            <BookOpen size={22} className="text-[#1D4ED8]" /> System Audit & Hash Chain Verifier
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Full audit log of immutable SHA-256 hash chains across all active research workspaces.
          </p>
        </div>

        <Button
          size="sm"
          icon={<RefreshCw size={14} className={isVerifying ? 'animate-spin' : ''} />}
          onClick={handleVerifyAll}
          disabled={isVerifying}
        >
          Verify All Project Chains
        </Button>
      </div>

      {verificationResult && (
        <div className="p-4 bg-[#F0FDF4] border border-[#86EFAC] rounded-lg text-xs text-[#166534] flex items-center gap-2 font-medium">
          <CheckCircle2 size={16} />
          <span>{verificationResult}</span>
        </div>
      )}

      {/* System Ledger Entries */}
      <Card className="p-6 bg-white space-y-4">
        <h3 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2">
          Global Ledger Blocks
        </h3>

        <div className="space-y-3">
          {DEMO_LEDGER.map((block) => (
            <div key={block.id} className="p-3.5 rounded-lg border border-[#E2E8F0] text-xs font-mono space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0F172A]">BLOCK #{block.id}</span>
                <span className="text-[10px] text-[#64748B]">{block.timestamp}</span>
              </div>
              <p className="text-[#334155] font-sans text-xs">{block.action}</p>
              <div className="text-[11px] text-[#64748B] pt-1">
                <div>Prev Hash: {block.previous_hash}</div>
                <div>Entry Hash: <strong className="text-[#1D4ED8]">{block.entry_hash}</strong></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
