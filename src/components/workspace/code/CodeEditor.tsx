import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { OnMount, OnChange } from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';
import type { OpenTab } from '../../../types/code';

interface CodeEditorProps {
  tab: OpenTab;
  onChangeContent: (content: string) => void;
  onSave: () => void;
  onCursorChange?: (line: number, column: number) => void;
  readOnly?: boolean;
}

export function CodeEditor({
  tab,
  onChangeContent,
  onSave,
  onCursorChange,
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Register Cmd+S / Ctrl+S within Monaco
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });

    // Listen to cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange(e.position.lineNumber, e.position.column);
      }
    });

    // Initial position
    const pos = editor.getPosition();
    if (pos && onCursorChange) {
      onCursorChange(pos.lineNumber, pos.column);
    }
  };

  const handleChange: OnChange = (value) => {
    onChangeContent(value ?? '');
  };

  return (
    <div className="w-full h-full bg-[#1E1E1E] relative overflow-hidden flex flex-col">
      <Editor
        key={tab.fileId}
        height="100%"
        width="100%"
        theme="vs-dark"
        path={tab.filePath || tab.fileName}
        defaultLanguage={tab.language}
        language={tab.language}
        value={tab.content}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        loading={
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 bg-[#1E1E1E]">
            <Loader2 size={24} className="animate-spin text-blue-500" />
            <span className="text-xs font-mono">Initializing Monaco Editor...</span>
          </div>
        }
        options={{
          readOnly,
          fontSize: 13,
          lineHeight: 20,
          fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
          fontLigatures: true,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          renderWhitespace: 'selection',
          minimap: {
            enabled: true,
            maxColumn: 80,
            scale: 1,
          },
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          padding: {
            top: 12,
            bottom: 12,
          },
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          contextmenu: true,
        }}
      />
    </div>
  );
}
