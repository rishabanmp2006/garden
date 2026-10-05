import { useState, useEffect } from 'react';
import {
  Shield, BookOpen, CheckCircle2, AlertTriangle,
  RefreshCw, Lock, Terminal, ShieldAlert, RotateCcw
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { fetchLedger, verifyLedger, tamperLedger, restoreLedger } from '../../lib/api';

export function AdminAuditPage() {
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  const loadBlocks = async () => {
    try {
      setLoading(true);
      const blocks = await fetchLedger();
      setLedger(blocks);
    } catch (err) {
      console.error('Failed to load ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlocks();
  }, []);

  const handleVerifyAll = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyLedger();
      if (res && res.is_valid) {
        setVerificationResult({
          valid: true,
          message: `System Audit Complete: Verified ${res.total_entries || ledger.length} persistent blocks across all project ledgers. All SHA-256 hash chains sequentially verified. Zero cryptographic tampering detected.`,
        });
      } else {
        setVerificationResult({
          valid: false,
          message: `CRITICAL ALERT: Cryptographic hash discrepancy detected in block #${res?.corrupted_entry?.id || 'unknown'}. Expected hash: ${res?.expected_hash || 'unknown'}, Found: ${res?.found_hash || 'corrupted'}. Chain consistency broken!`,
        });
      }
    } catch (err: any) {
      setVerificationResult({
        valid: false,
        message: `Verification check error: ${err.message || err}`,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateTamper = async (blockId: number) => {
    try {
      await tamperLedger(blockId, 'UNAUTHORIZED TAMPERED DATA RECORD');
      await loadBlocks();
      await handleVerifyAll();
    } catch (err: any) {
      alert(`Tamper simulation failed: ${err.message || err}`);
    }
  };

  const handleRestoreLedger = async () => {
    try {
      await restoreLedger();
      await loadBlocks();
      await handleVerifyAll();
    } catch (err: any) {
      alert(`Restore failed: ${err.message || err}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
            <BookOpen size={22} className="text-[#1D4ED8]" /> System Audit & Hash Chain Verifier
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Full audit log of immutable SHA-256 hash chains across all active research workspaces and projects.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={<RotateCcw size={14} />}
            onClick={handleRestoreLedger}
          >
            Restore Chain
          </Button>
          <Button
            size="sm"
            icon={<RefreshCw size={14} className={isVerifying ? 'animate-spin' : ''} />}
            onClick={handleVerifyAll}
            disabled={isVerifying}
          >
            Verify SHA-256 Chain
          </Button>
        </div>
      </div>

      {verificationResult && (
        <div className={`p-4 rounded-lg text-xs flex items-center gap-2 font-medium border ${
          verificationResult.valid
            ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534]'
            : 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
        }`}>
          {verificationResult.valid ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{verificationResult.message}</span>
        </div>
      )}

      {/* System Ledger Entries */}
      <Card className="p-6 bg-white space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
          <h3 className="text-sm font-bold text-[#0F172A]">
            Global Ledger Blocks ({ledger.length})
          </h3>
          <span className="text-[11px] text-[#64748B]">Persistent SQLite / Supabase Table</span>
        </div>

        {loading ? (
          <div className="text-center py-10 text-xs text-[#64748B]">
            <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[#1D4ED8]" />
            Reading cryptographic ledger from persistent storage...
          </div>
        ) : ledger.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#64748B]">
            No ledger blocks recorded yet. Once projects are created or milestones completed, chained entries will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {ledger.map((block) => (
              <div key={block.id} className="p-3.5 rounded-lg border border-[#E2E8F0] text-xs font-mono space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0F172A]">BLOCK #{block.id}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#64748B]">{block.timestamp}</span>
                    <button
                      onClick={() => handleSimulateTamper(block.id)}
                      className="text-[10px] text-[#DC2626] hover:underline font-sans"
                      title="Simulate data tampering to test detection"
                    >
                      [Simulate Tamper]
                    </button>
                  </div>
                </div>
                <p className="text-[#334155] font-sans text-xs">{block.action}</p>
                <div className="text-[11px] text-[#64748B] pt-1">
                  <div>Prev Hash: <span className="font-mono text-[10px]">{block.previous_hash}</span></div>
                  <div>Entry Hash: <strong className="text-[#1D4ED8] font-mono text-[10px]">{block.entry_hash}</strong></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
