import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';

interface MessageComposerProps {
  placeholder?: string;
  onSendMessage: (messageText: string) => Promise<void>;
  disabled?: boolean;
}

export function MessageComposer({
  placeholder = 'Write a message...',
  onSendMessage,
  disabled = false,
}: MessageComposerProps) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting || disabled) return;

    if (trimmed.length > 5000) {
      setError('Message exceeds the maximum limit of 5,000 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSendMessage(trimmed);
      // Clear composer ONLY upon successful insert
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err: any) {
      // Retain typed content on error
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-3 bg-white border-t border-[#E2E8F0]">
      {error && (
        <div className="mb-2 p-2 bg-[#FEF2F2] border border-[#FEE2E2] rounded-lg text-xs text-[#991B1B] flex items-center gap-1.5">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-end gap-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 focus-within:border-[#1D4ED8] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#1D4ED8] transition-all">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || submitting}
          rows={1}
          className="flex-1 bg-transparent text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none resize-none max-h-40 py-1"
        />

        <button
          onClick={handleSend}
          disabled={!text.trim() || submitting || disabled}
          className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] disabled:opacity-40 disabled:hover:bg-[#1D4ED8] transition-colors"
          title="Send message (Enter)"
          aria-label="Send message"
        >
          {submitting ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Send size={13} />
          )}
        </button>
      </div>

      <div className="mt-1 flex justify-between items-center px-1">
        <span className="text-[10px] text-[#94A3B8]">
          Shift + Enter for new line • Enter to send
        </span>
        {text.length > 3500 && (
          <span className={`text-[10px] ${text.length > 5000 ? 'text-red-500 font-bold' : 'text-[#64748B]'}`}>
            {text.length}/5000
          </span>
        )}
      </div>
    </div>
  );
}
