import React, { useState, useEffect } from 'react';
import { X, FileCode, AlertCircle, ShieldAlert, Check } from 'lucide-react';
import { detectLanguage, isSecretFile, isSupportedCodeFile } from '../../../lib/codeHelpers';
import { SUPPORTED_EXTENSIONS } from '../../../types/code';

interface NewFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fileName: string, folderPath: string, isConfidential: boolean) => Promise<void>;
  existingPaths: string[];
}

export function NewFileDialog({
  isOpen,
  onClose,
  onSubmit,
  existingPaths,
}: NewFileDialogProps) {
  const [filePathInput, setFilePathInput] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFilePathInput('');
      setIsConfidential(false);
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Parse path and base name
  const trimmed = filePathInput.trim().replace(/^\/+/, '');
  const lastSlashIdx = trimmed.lastIndexOf('/');
  const folderPart = lastSlashIdx !== -1 ? trimmed.substring(0, lastSlashIdx) : '';
  const filePart = lastSlashIdx !== -1 ? trimmed.substring(lastSlashIdx + 1) : trimmed;

  const detectedLang = filePart ? detectLanguage(filePart) : 'plaintext';
  const isSecret = filePart ? isSecretFile(filePart) : false;
  const isSupported = filePart ? isSupportedCodeFile(filePart) : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!filePart) {
      setError('Please provide a file name.');
      return;
    }

    if (isSecret) {
      setError('Security violation: Secret files, private keys, and .env credentials cannot be stored in the repository.');
      return;
    }

    if (!isSupported) {
      setError(`Unsupported extension. Supported formats include: ${Object.keys(SUPPORTED_EXTENSIONS).join(', ')}`);
      return;
    }

    const fullNormalized = folderPart ? `${folderPart}/${filePart}` : filePart;
    if (existingPaths.includes(fullNormalized)) {
      setError(`File "${fullNormalized}" already exists in this project.`);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(filePart, folderPart, isConfidential);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create file. Please check permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCode size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">New Code File</h3>
              <p className="text-[11px] text-slate-500">Create a persistent research script or module</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              File Path or Name
            </label>
            <input
              type="text"
              autoFocus
              value={filePathInput}
              onChange={(e) => {
                setFilePathInput(e.target.value);
                setError(null);
              }}
              placeholder="e.g. src/model.py, tests/test_eval.py, script.sh"
              className="w-full text-xs font-mono px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:font-sans placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              You can prefix with folder names like <span className="font-mono text-slate-600">src/</span> or <span className="font-mono text-slate-600">data/</span> to group files.
            </p>
          </div>

          {/* Path preview & language badge */}
          {filePart && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Target Path:</span>
                <span className="font-mono font-medium text-slate-800 truncate max-w-[240px]">
                  {folderPart ? `${folderPart}/${filePart}` : filePart}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Detected Language:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] font-medium bg-blue-100 text-blue-700">
                  {detectedLang}
                </span>
              </div>
              {isSecret && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1 font-medium">
                  <ShieldAlert size={14} />
                  Secret file patterns are strictly disallowed.
                </div>
              )}
            </div>
          )}

          {/* Confidentiality toggle */}
          <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              id="is_confidential_cb"
              checked={isConfidential}
              onChange={(e) => setIsConfidential(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <label htmlFor="is_confidential_cb" className="text-xs text-slate-700 cursor-pointer select-none">
              <span className="font-semibold block text-slate-800">Confidential Research Code</span>
              Mark this code as confidential under project charter governance. Restricted to authorized members only.
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !filePart || isSecret}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check size={14} />
                  Create File
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
