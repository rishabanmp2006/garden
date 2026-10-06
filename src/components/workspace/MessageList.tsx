import React, { useEffect, useRef } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import type { WorkspaceMessage } from '../../types/workspace';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: WorkspaceMessage[];
  currentUserId?: string;
  isProjectOwner?: boolean;
  onOpenThread: (message: WorkspaceMessage) => void;
  onEditMessage: (messageId: string, newText: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  isLoading?: boolean;
  channelName?: string;
}

export function MessageList({
  messages,
  currentUserId,
  isProjectOwner = false,
  onOpenThread,
  onEditMessage,
  onDeleteMessage,
  isLoading = false,
  channelName = 'general',
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <Loader2 size={20} className="animate-spin text-[#1D4ED8] mx-auto" />
          <p className="text-xs text-[#64748B]">Loading discussion messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 select-none">
        <div className="text-center max-w-sm space-y-2">
          <div className="w-10 h-10 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[#1D4ED8] flex items-center justify-center mx-auto">
            <MessageSquare size={18} />
          </div>
          <h3 className="text-xs font-semibold text-[#0F172A]">
            No messages yet
          </h3>
          <p className="text-xs text-[#64748B]">
            Start the research discussion in #{channelName}. All verified contributors and mentors can collaborate here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-1 divide-y divide-[#F1F5F9]/50"
    >
      {messages.map((msg) => (
        <MessageItem
          key={msg.id}
          message={msg}
          currentUserId={currentUserId}
          isProjectOwner={isProjectOwner}
          onOpenThread={onOpenThread}
          onEditMessage={onEditMessage}
          onDeleteMessage={onDeleteMessage}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
