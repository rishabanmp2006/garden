import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Shield,
  Lock,
  GitCommitHorizontal,
  Loader2,
  Trash2,
  X,
  FilePlus,
} from 'lucide-react';
import type { CodeFile, OpenTab } from '../../../types/code';
import { isSupportedCodeFile, isSecretFile, detectLanguage, computeContentSha256 } from '../../../lib/codeHelpers';
import {
  fetchCodeFileContent,
  saveCodeFileContent,
  createCodeFile,
  deleteCodeFile,
} from '../../../lib/codeStorage';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { CodeFileTree } from './CodeFileTree';
import { CodeTabs } from './CodeTabs';
import { CodeEditor } from './CodeEditor';
import { NewFileDialog } from './NewFileDialog';

interface CodeWorkspaceProps {
  projectId: string;
  projectTitle?: string;
  currentUserId?: string;
  canModify: boolean;
  onFilesChanged?: () => void;
}

export default function CodeWorkspace({
  projectId,
  projectTitle,
  currentUserId = '00000000-0000-0000-0000-000000000000',
  canModify,
  onFilesChanged,
}: CodeWorkspaceProps) {
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [currentHash, setCurrentHash] = useState<string | null>(null);

  // Modals
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<CodeFile | null>(null);
  const [closeConfirmTabId, setCloseConfirmTabId] = useState<string | null>(null);

  // Active tab helper
  const activeTab = useMemo(
    () => openTabs.find((t) => t.fileId === activeTabId) || null,
    [openTabs, activeTabId]
  );

  // Active file helper
  const activeFile = useMemo(
    () => files.find((f) => f.id === activeTabId) || null,
    [files, activeTabId]
  );

  // Fetch project code files
  const loadFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
          .from('files')
          .select('*')
          .eq('project_id', projectId)
          .order('name', { ascending: true });

        if (error) {
          console.error('[CodeWorkspace] Error fetching files:', error);
        } else if (data) {
          // Filter to only supported research code/text files, exclude secrets
          const codeFiles = data.filter((f) => {
            if (isSecretFile(f.name)) return false;
            return isSupportedCodeFile(f.name);
          });
          setFiles(codeFiles);
        }
      }
    } catch (err) {
      console.error('[CodeWorkspace] Failed to load files:', err);
    } finally {
      setLoadingFiles(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Update current content SHA-256 hash when active tab content changes
  useEffect(() => {
    if (!activeTab) {
      setCurrentHash(null);
      return;
    }
    let isCancelled = false;
    computeContentSha256(activeTab.content).then((hash) => {
      if (!isCancelled) setCurrentHash(hash);
    });
    return () => {
      isCancelled = true;
    };
  }, [activeTab?.content]);

  // Open a file into a tab
  const handleSelectFile = async (file: CodeFile) => {
    const existing = openTabs.find((t) => t.fileId === file.id);
    if (existing) {
      setActiveTabId(file.id);
      return;
    }

    try {
      const { content } = await fetchCodeFileContent(file, projectId);
      const cleanPath = file.storage_path || file.name;
      const lang = detectLanguage(file.name);

      const newTab: OpenTab = {
        fileId: file.id,
        filePath: cleanPath,
        fileName: file.name,
        language: lang,
        content,
        originalContent: content,
        isDirty: false,
        isConfidential: Boolean(file.is_confidential),
      };

      setOpenTabs((prev) => [...prev, newTab]);
      setActiveTabId(file.id);
    } catch (err) {
      console.error('[CodeWorkspace] Error opening file:', err);
    }
  };

  // Close tab handling
  const handleRequestCloseTab = (fileId: string) => {
    const tabToClose = openTabs.find((t) => t.fileId === fileId);
    if (!tabToClose) return;

    if (tabToClose.isDirty) {
      setCloseConfirmTabId(fileId);
    } else {
      forceCloseTab(fileId);
    }
  };

  const forceCloseTab = (fileId: string) => {
    setOpenTabs((prev) => {
      const updated = prev.filter((t) => t.fileId !== fileId);
      if (activeTabId === fileId) {
        // Switch to adjacent tab if possible
        const nextActive = updated.length > 0 ? updated[updated.length - 1].fileId : null;
        setActiveTabId(nextActive);
      }
      return updated;
    });
    setCloseConfirmTabId(null);
  };

  // Content change in active editor
  const handleContentChange = (newContent: string) => {
    if (!activeTabId) return;

    setOpenTabs((prev) =>
      prev.map((tab) => {
        if (tab.fileId === activeTabId) {
          const isDirty = newContent !== tab.originalContent;
          return {
            ...tab,
            content: newContent,
            isDirty,
          };
        }
        return tab;
      })
    );

    if (saveStatus === 'saved') {
      setSaveStatus('idle');
    }
  };

  // Save current active file
  const handleSave = useCallback(async () => {
    if (!activeTab || !activeFile) return;

    setSaveStatus('saving');
    setStatusMessage('Persisting to Supabase Storage & Recording Provenance...');

    try {
      const result = await saveCodeFileContent(
        activeFile,
        projectId,
        activeTab.content,
        currentUserId
      );

      // Update tab state to clean
      setOpenTabs((prev) =>
        prev.map((t) =>
          t.fileId === activeTab.fileId
            ? { ...t, originalContent: t.content, isDirty: false }
            : t
        )
      );

      setSaveStatus('saved');
      setStatusMessage('Saved to Supabase Storage');
      onFilesChanged?.();

      setTimeout(() => {
        setSaveStatus('idle');
        setStatusMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('[CodeWorkspace] Save failed:', err);
      setSaveStatus('error');
      setStatusMessage(err?.message || 'Save failed');
    }
  }, [activeTab, activeFile, projectId, currentUserId, onFilesChanged]);

  // Window keyboard shortcut listener for Cmd+S / Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Warn user before leaving page if unsaved changes exist
  useEffect(() => {
    const hasUnsaved = openTabs.some((t) => t.isDirty);
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsaved) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [openTabs]);

  // File creation handler
  const handleCreateFile = async (
    fileName: string,
    folderPath: string,
    isConfidential: boolean
  ) => {
    const lang = detectLanguage(fileName);
    const initialBoilerplate = `# ResearchMesh Governed Code: ${fileName}\n`;

    const newFile = await createCodeFile(
      projectId,
      fileName,
      folderPath,
      initialBoilerplate,
      isConfidential,
      currentUserId
    );

    setFiles((prev) => [...prev, newFile]);
    onFilesChanged?.();

    // Automatically open newly created file
    await handleSelectFile(newFile);
  };

  // File deletion handler
  const handleDeleteFile = async () => {
    if (!deleteCandidate) return;

    try {
      await deleteCodeFile(deleteCandidate, projectId, currentUserId);
      setFiles((prev) => prev.filter((f) => f.id !== deleteCandidate.id));
      forceCloseTab(deleteCandidate.id);
      onFilesChanged?.();
      setDeleteCandidate(null);
    } catch (err: any) {
      alert(`Failed to delete file: ${err?.message || 'Unknown error'}`);
    }
  };

  // Line count calculation
  const lineCount = useMemo(() => {
    if (!activeTab?.content) return 1;
    return activeTab.content.split('\n').length;
  }, [activeTab?.content]);

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] text-slate-200 select-none overflow-hidden">
      {/* 1. IDE TOP HEADER BAR */}
      <div className="h-10 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 text-slate-800">
        {/* Left: Breadcrumbs & Confidentiality */}
        <div className="flex items-center gap-2 text-xs min-w-0">
          <span className="text-slate-400 font-medium">{projectTitle || 'Project'}</span>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-700">Code</span>
          {activeTab && (
            <>
              <span className="text-slate-300">/</span>
              <span className="font-mono text-blue-600 font-medium truncate max-w-[280px]">
                {activeTab.filePath}
              </span>
            </>
          )}

          {activeTab?.isConfidential && (
            <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <Lock size={11} />
              Confidential
            </span>
          )}
        </div>

        {/* Right: Actions & Save status */}
        <div className="flex items-center gap-3">
          {/* Save Status Indicator */}
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
              <Loader2 size={13} className="animate-spin" />
              <span>Saving...</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <CheckCircle2 size={13} />
              <span>Saved</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
              <AlertCircle size={13} />
              <span>{statusMessage || 'Save Error'}</span>
            </div>
          )}
          {activeTab?.isDirty && saveStatus === 'idle' && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Unsaved changes</span>
            </div>
          )}

          {/* Save Button */}
          {canModify && (
            <button
              onClick={handleSave}
              disabled={!activeTab || saveStatus === 'saving'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
              title="Save changes (Cmd+S / Ctrl+S)"
            >
              <Save size={13} />
              <span>Save</span>
              <kbd className="hidden sm:inline-block ml-1 text-[10px] bg-blue-700 text-blue-100 px-1 py-0.2 rounded font-mono">
                ⌘S
              </kbd>
            </button>
          )}

          {/* New File Button */}
          {canModify && (
            <button
              onClick={() => setIsNewFileDialogOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
              title="Create new file"
            >
              <FilePlus size={13} className="text-slate-500" />
              <span className="hidden sm:inline">New File</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN WORKSPACE AREA */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: Code File Tree Sidebar */}
        <CodeFileTree
          files={files}
          activeFileId={activeTabId}
          onSelectFile={handleSelectFile}
          onDeleteFile={(file) => setDeleteCandidate(file)}
          onOpenNewFileDialog={() => setIsNewFileDialogOpen(true)}
          onRefresh={loadFiles}
          canModify={canModify}
          isLoading={loadingFiles}
        />

        {/* Right: Tabs & Monaco Editor */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#1E1E1E]">
          {/* Tabs row */}
          <CodeTabs
            tabs={openTabs}
            activeTabId={activeTabId}
            onSelectTab={(id) => setActiveTabId(id)}
            onCloseTab={handleRequestCloseTab}
          />

          {/* Monaco Editor Container */}
          <div className="flex-1 relative overflow-hidden">
            {activeTab ? (
              <CodeEditor
                tab={activeTab}
                onChangeContent={handleContentChange}
                onSave={handleSave}
                onCursorChange={(line, col) => setCursorPos({ line, column: col })}
                readOnly={!canModify}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#2D2D2D] text-slate-400 flex items-center justify-center">
                  <FileCode size={24} />
                </div>
                <div className="text-center max-w-sm">
                  <h4 className="text-sm font-semibold text-slate-300">No File Open</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Select a script from the Explorer on the left or create a new file to start programming.
                  </p>
                </div>
                {canModify && (
                  <button
                    onClick={() => setIsNewFileDialogOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors mt-2"
                  >
                    <FilePlus size={13} />
                    New Code File
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 3. VS CODE-STYLE STATUS BAR */}
          <div className="h-6 bg-[#007ACC] text-white px-3 flex items-center justify-between text-[11px] font-mono select-none shrink-0">
            {/* Left status items */}
            <div className="flex items-center gap-4">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                {activeTab ? activeTab.language : 'Plain Text'}
              </span>
              <span>UTF-8</span>
              {activeTab && (
                <span>
                  Ln {cursorPos.line}, Col {cursorPos.column} (Lines: {lineCount})
                </span>
              )}
              <span className="hidden sm:inline text-blue-200">Spaces: 2</span>
            </div>

            {/* Right status items: Cryptographic Provenance Hash & Save status */}
            <div className="flex items-center gap-4">
              {currentHash && (
                <div
                  className="flex items-center gap-1 text-[10px] text-blue-100 hover:text-white cursor-help"
                  title={`SHA-256 Content Hash: ${currentHash}\nRecorded on ledger on save.`}
                >
                  <GitCommitHorizontal size={12} />
                  <span>SHA-256: {currentHash.substring(0, 10)}...</span>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                {activeTab?.isDirty ? (
                  <span className="flex items-center gap-1 text-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                    Unsaved
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-200">
                    <CheckCircle2 size={11} />
                    Saved
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New File Modal */}
      <NewFileDialog
        isOpen={isNewFileDialogOpen}
        onClose={() => setIsNewFileDialogOpen(false)}
        onSubmit={handleCreateFile}
        existingPaths={files.map((f) => f.storage_path || f.name)}
      />

      {/* Close Dirty Tab Confirmation Modal */}
      {closeConfirmTabId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 text-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm">
              <AlertCircle size={18} />
              <span>Unsaved Changes</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This file has unsaved changes that will be lost if you close it without saving.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCloseConfirmTabId(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleSave().then(() => forceCloseTab(closeConfirmTabId));
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                Save & Close
              </button>
              <button
                onClick={() => forceCloseTab(closeConfirmTabId)}
                className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg"
              >
                Discard & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete File Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 text-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-red-600 font-semibold text-sm">
              <Trash2 size={18} />
              <span>Delete File?</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="font-mono font-bold text-slate-800">
                {deleteCandidate.name}
              </span>
              ? This action will remove the file from Supabase Storage and record an audit event on the ledger.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFile}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
