import React from 'react';
import { FolderClosed, FileText, Lock, Download, Shield } from 'lucide-react';
import { Button } from '../ui/Button';

interface WorkspaceFilesProps {
  files: any[];
  canAccessConfidential?: boolean;
  isLoading?: boolean;
}

export function WorkspaceFiles({
  files,
  canAccessConfidential = false,
  isLoading = false,
}: WorkspaceFilesProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <FolderClosed size={16} className="text-[#1D4ED8]" />
          <h2 className="text-sm font-bold text-[#0F172A]">
            Project Data Room & Files
          </h2>
        </div>
        <p className="text-xs text-[#64748B] leading-relaxed">
          Authorized project datasets, research charters, and benchmark assets. Confidential assets require signed charter agreements.
        </p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-[#64748B]">
          Loading files...
        </div>
      ) : files.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center text-xs text-[#64748B]">
          No repository files currently shared in this project workspace.
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#F1F5F9] shadow-xs">
          {files.map((file, idx) => {
            const isConfidential = file.is_confidential;
            const isLocked = isConfidential && !canAccessConfidential;

            return (
              <div
                key={file.id || idx}
                className="p-4 flex items-center justify-between gap-4 hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE] text-[#1D4ED8] flex items-center justify-center shrink-0">
                    <FileText size={16} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-[#0F172A] truncate">
                        {file.file_name || file.name || 'Dataset'}
                      </p>
                      {isConfidential && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#B91C1C] bg-[#FEF2F2] border border-[#FEE2E2] px-1.5 py-0.2 rounded">
                          <Lock size={10} /> Confidential
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      {typeof file.file_size === 'number' ? `${Math.round(file.file_size / 1024)} KB` : file.file_size || 'Asset'} • Added {file.created_at ? new Date(file.created_at).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                </div>

                <div>
                  {isLocked ? (
                    <span className="text-xs text-[#64748B] inline-flex items-center gap-1">
                      <Lock size={12} /> Sign charter to access
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Download size={12} />}
                      onClick={() => alert(`Accessing file: ${file.file_name || 'asset'}`)}
                    >
                      Download
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
