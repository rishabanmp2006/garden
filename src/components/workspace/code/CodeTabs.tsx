import React from 'react';
import { X, Lock, FileCode, FileText } from 'lucide-react';
import type { OpenTab } from '../../../types/code';

interface CodeTabsProps {
  tabs: OpenTab[];
  activeTabId: string | null;
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
}

export function CodeTabs({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
}: CodeTabsProps) {
  if (tabs.length === 0) {
    return (
      <div className="h-9 bg-[#1E1E1E] border-b border-[#2D2D2D] flex items-center px-4">
        <span className="text-xs text-slate-500 font-mono italic">No files open</span>
      </div>
    );
  }

  return (
    <div className="flex items-center h-9 bg-[#252526] border-b border-[#1E1E1E] overflow-x-auto scrollbar-none select-none">
      {tabs.map((tab) => {
        const isActive = tab.fileId === activeTabId;

        return (
          <div
            key={tab.fileId}
            onClick={() => onSelectTab(tab.fileId)}
            className={`group flex items-center gap-2 h-full px-3 text-xs border-r border-[#1E1E1E] cursor-pointer transition-colors shrink-0 max-w-[220px] ${
              isActive
                ? 'bg-[#1E1E1E] text-slate-100 border-t-2 border-t-blue-500 font-medium'
                : 'bg-[#2D2D2D]/60 text-slate-400 hover:bg-[#2A2A2A] hover:text-slate-200 border-t-2 border-t-transparent'
            }`}
          >
            {/* File Icon */}
            {tab.isConfidential ? (
              <span title="Confidential File">
                <Lock size={12} className="text-amber-400 shrink-0" />
              </span>
            ) : tab.language === 'python' ? (
              <span className="text-emerald-400 font-mono text-[11px] font-bold shrink-0">py</span>
            ) : tab.language === 'typescript' ? (
              <span className="text-blue-400 font-mono text-[11px] font-bold shrink-0">ts</span>
            ) : tab.language === 'javascript' ? (
              <span className="text-amber-400 font-mono text-[11px] font-bold shrink-0">js</span>
            ) : (
              <FileCode size={13} className="text-slate-400 shrink-0" />
            )}

            {/* File Name */}
            <span className="truncate font-mono text-xs">{tab.fileName}</span>

            {/* Unsaved indicator / Close button */}
            <div className="flex items-center ml-1">
              {tab.isDirty ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.fileId);
                  }}
                  className="w-4 h-4 rounded flex items-center justify-center hover:bg-[#3E3E3E]"
                  title="Unsaved changes. Click to close"
                  aria-label={`Close ${tab.fileName}`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400 group-hover:hidden" />
                  <X size={12} className="hidden group-hover:block text-slate-300" />
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.fileId);
                  }}
                  className="w-4 h-4 rounded flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-[#3E3E3E] transition-colors opacity-0 group-hover:opacity-100"
                  title="Close tab"
                  aria-label={`Close ${tab.fileName}`}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
