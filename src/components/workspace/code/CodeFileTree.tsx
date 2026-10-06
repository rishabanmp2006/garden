import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Plus,
  Trash2,
  Lock,
  ChevronRight,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import type { CodeFile, FileTreeNode } from '../../../types/code';
import { buildFileTree, detectLanguage } from '../../../lib/codeHelpers';
import { CodeSearch } from './CodeSearch';

interface CodeFileTreeProps {
  files: CodeFile[];
  activeFileId: string | null;
  onSelectFile: (file: CodeFile) => void;
  onDeleteFile: (file: CodeFile) => void;
  onOpenNewFileDialog: () => void;
  onRefresh?: () => void;
  canModify: boolean;
  isLoading?: boolean;
}

export function CodeFileTree({
  files,
  activeFileId,
  onSelectFile,
  onDeleteFile,
  onOpenNewFileDialog,
  onRefresh,
  canModify,
  isLoading = false,
}: CodeFileTreeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'folder-src': true,
    'folder-tests': true,
    'folder-data': true,
  });

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  // Filter files if search query is active
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase().trim();
    return files.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.storage_path && f.storage_path.toLowerCase().includes(q))
    );
  }, [files, searchQuery]);

  // Build hierarchical tree
  const treeNodes = useMemo(() => {
    return buildFileTree(filteredFiles);
  }, [filteredFiles]);

  const renderFileIcon = (file: CodeFile) => {
    if (file.is_confidential) {
      return (
        <span title="Confidential">
          <Lock size={13} className="text-amber-500 shrink-0" />
        </span>
      );
    }
    const lang = detectLanguage(file.name);
    switch (lang) {
      case 'python':
        return <span className="text-emerald-600 font-mono text-[10px] font-bold shrink-0">py</span>;
      case 'typescript':
        return <span className="text-blue-600 font-mono text-[10px] font-bold shrink-0">ts</span>;
      case 'javascript':
        return <span className="text-amber-600 font-mono text-[10px] font-bold shrink-0">js</span>;
      case 'json':
        return <span className="text-orange-500 font-mono text-[10px] font-bold shrink-0">{}</span>;
      case 'markdown':
        return <span className="text-cyan-600 font-mono text-[10px] font-bold shrink-0">M↓</span>;
      case 'sql':
        return <span className="text-indigo-600 font-mono text-[10px] font-bold shrink-0">sql</span>;
      case 'yaml':
        return <span className="text-purple-600 font-mono text-[10px] font-bold shrink-0">yml</span>;
      default:
        return <FileCode size={13} className="text-slate-500 shrink-0" />;
    }
  };

  const renderTreeNode = (node: FileTreeNode, depth = 0) => {
    const isFolder = node.isFolder;
    const isExpanded = isFolder ? Boolean(expandedFolders[node.id]) : false;
    const isSelected = !isFolder && node.file?.id === activeFileId;

    if (isFolder) {
      return (
        <div key={node.id} className="select-none">
          <div
            onClick={() => toggleFolder(node.id)}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            className="flex items-center gap-1.5 py-1 pr-2 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer rounded transition-colors group"
          >
            <span className="text-slate-400 group-hover:text-slate-600">
              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>
            <span className="text-amber-500">
              {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
            </span>
            <span className="font-medium text-slate-700 truncate">{node.name}</span>
          </div>

          {isExpanded && node.children.length > 0 && (
            <div>
              {node.children.map((child) => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // File Node
    return (
      <div
        key={node.id}
        onClick={() => node.file && onSelectFile(node.file)}
        style={{ paddingLeft: `${depth * 12 + 20}px` }}
        className={`group flex items-center justify-between py-1 pr-2 text-xs cursor-pointer rounded transition-colors select-none ${
          isSelected
            ? 'bg-blue-50/80 text-blue-700 font-medium'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {node.file && renderFileIcon(node.file)}
          <span className="truncate font-mono text-[11px]">{node.name}</span>
        </div>

        <div className="flex items-center gap-1">
          {node.file?.file_size && (
            <span className="text-[10px] text-slate-400 group-hover:hidden font-mono">
              {node.file.file_size}
            </span>
          )}
          {canModify && node.file && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFile(node.file!);
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
              title="Delete File"
              aria-label={`Delete ${node.name}`}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64 select-none shrink-0">
      {/* Explorer Header */}
      <div className="px-3 py-2.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
        <span className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
          Explorer
        </span>

        <div className="flex items-center gap-1">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className={`p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded transition-colors ${
                isLoading ? 'animate-spin' : ''
              }`}
              title="Refresh files"
              aria-label="Refresh files"
            >
              <RefreshCw size={13} />
            </button>
          )}

          {canModify && (
            <button
              onClick={onOpenNewFileDialog}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded transition-colors"
              title="New Code File"
            >
              <Plus size={12} />
              <span>File</span>
            </button>
          )}
        </div>
      </div>

      {/* File Search */}
      <div className="p-2 border-b border-slate-100">
        <CodeSearch value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto px-1 py-1.5 space-y-0.5">
        {files.length === 0 ? (
          <div className="p-4 text-center space-y-2">
            <FileCode size={24} className="text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">No code files yet</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Create a research script or import code into this project.
            </p>
            {canModify && (
              <button
                onClick={onOpenNewFileDialog}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
              >
                <Plus size={13} />
                New Code File
              </button>
            )}
          </div>
        ) : treeNodes.length === 0 ? (
          <div className="p-3 text-center text-xs text-slate-400">
            No files match "{searchQuery}"
          </div>
        ) : (
          treeNodes.map((node) => renderTreeNode(node, 0))
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-2 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span>{files.length} {files.length === 1 ? 'file' : 'files'}</span>
        <span className="text-[10px] text-slate-400">UTF-8 / Supabase</span>
      </div>
    </div>
  );
}
