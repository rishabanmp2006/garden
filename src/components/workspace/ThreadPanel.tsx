import React, { useRef, useEffect } from 'react';
import { X, MessageSquare, Loader2 } from 'lucide-react';
import type { WorkspaceMessage } from '../../types/workspace';
import { MessageItem } from './MessageItem';
import { MessageComposer } from './MessageComposer';

interface ThreadPanelProps {
  rootMessage: WorkspaceMessage | null;
  replies: WorkspaceMessage[];
  currentUserId?: string;
  isProjectOwner?: boolean;
  onClose: () => void;
  onSendReply: (replyText: string) => Promise<void>;
  onEditMessage: (messageId: string, newText: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  isLoading?: boolean;
}

export function ThreadPanel({
  rootMessage,
  replies,
  currentUserId,
  isProjectOwner = false,
  onClose,
  onSendReply,
  onEditMessage,
  onDeleteMessage,
  isLoading = false,
}: ThreadPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [replies.length]);

  if (!rootMessage) return null;

  return (
    <div className="w-full md:w-96 border-l border-[#E2E8F0] bg-white flex flex-col h-full shrink-0 shadow-sm z-20">
      {/* Thread Header */}
      <div className="p-3.5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#FAFAFA]">
        <div className="flex items-center gap-2">
          <MessageSquare size={15} className="text-[#1D4ED8]" />
          <h3 className="text-xs font-semibold text-[#0F172A]">
            Thread
          </h3>
          <span className="text-[10px] text-[#64748B] bg-[#EFF6FF] px-1.5 py-0.2 rounded font-medium border border-[#DBEAFE]">
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </span>
        </div>

        <button
          onClick={onClose}
          className="text-[#64748B] hover:text-[#0F172A] p-1 rounded hover:bg-[#F1F5F9] transition-colors"
          title="Close thread"
          aria-label="Close thread"
        >
          <X size={16} />
        </button>
      </div>

      {/* Root Message & Replies */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Root Message Box */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
          <MessageItem
            message={rootMessage}
            currentUserId={currentUserId}
            isProjectOwner={isProjectOwner}
            onEditMessage={onEditMessage}
            onDeleteMessage={onDeleteMessage}
            isThreadReply={true}
          />
        </div>

        {/* Separator */}
        <div className="relative flex items-center justify-center my-2">
          <div className="border-t border-[#E2E8F0] w-full" />
          <span className="bg-white px-2 text-[10px] uppercase font-semibold text-[#94A3B8] tracking-wider absolute">
            Replies
          </span>
        </div>

        {/* Replies List */}
        {isLoading ? (
          <div className="p-6 text-center">
            <Loader2 size={16} className="animate-spin text-[#1D4ED8] mx-auto" />
            <p className="text-[11px] text-[#94A3B8] mt-1">Loading replies...</p>
          </div>
        ) : replies.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#64748B]">
            No replies yet. Be the first to reply to this thread.
          </div>
        ) : (
          <div className="space-y-1 divide-y divide-[#F1F5F9]/60">
            {replies.map((reply) => (
              <MessageItem
                key={reply.id}
                message={reply}
                currentUserId={currentUserId}
                isProjectOwner={isProjectOwner}
                onEditMessage={onEditMessage}
                onDeleteMessage={onDeleteMessage}
                isThreadReply={true}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply Composer */}
      <div className="border-t border-[#E2E8F0]">
        <MessageComposer
          placeholder="Reply to thread..."
          onSendMessage={onSendReply}
        />
      </div>
    </div>
  );
}
