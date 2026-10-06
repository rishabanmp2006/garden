import React from 'react';
import { Search, X } from 'lucide-react';

interface CodeSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CodeSearch({
  value,
  onChange,
  placeholder = 'Search files...',
}: CodeSearchProps) {
  return (
    <div className="relative w-full">
      <Search
        size={13}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs text-slate-800 placeholder:text-slate-400 pl-8 pr-7 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
          title="Clear search"
          aria-label="Clear search"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
