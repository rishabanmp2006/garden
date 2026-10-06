import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Hash,
  Users,
  Compass,
  CheckCircle,
  Megaphone,
  AlertCircle,
  Terminal,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type {
  WorkspaceChannel,
  WorkspaceMessage,
  ChannelType,
  SenderProfile
} from '../../types/workspace';
import { ChannelList } from './ChannelList';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import { ThreadPanel } from './ThreadPanel';

interface DiscussionPanelProps {
  projectId: string;
  currentUserId?: string;
  isProjectOwner?: boolean;
  canManageChannels?: boolean;
  teamCount?: number;
  membersCache?: Record<string, SenderProfile>;
}

export function DiscussionPanel({
  projectId,
  currentUserId,
  isProjectOwner = false,
  canManageChannels = false,
  teamCount = 0,
  membersCache = {},
}: DiscussionPanelProps) {
  const [channels, setChannels] = useState<WorkspaceChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<WorkspaceChannel | null>(null);
  const [channelsLoading, setChannelsLoading] = useState(true);

  const [messages, setMessages] = useState<WorkspaceMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Thread state
  const [activeThreadMessage, setActiveThreadMessage] = useState<WorkspaceMessage | null>(null);
  const [threadReplies, setThreadReplies] = useState<WorkspaceMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);

  // Migration status error detection
  const [migrationMissing, setMigrationMissing] = useState(false);

  // Helper to fetch or look up sender profile
  const fetchSenderProfile = useCallback(async (senderId: string): Promise<SenderProfile> => {
    if (membersCache[senderId]) {
      return membersCache[senderId];
    }
    if (supabase) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, role, email')
          .eq('id', senderId)
          .maybeSingle();
        if (data) return data;
      } catch {
        // Fallback
      }
    }
    return { id: senderId, display_name: 'Researcher' };
  }, [membersCache]);

  // 1. Load Channels
  const loadChannels = useCallback(async () => {
    if (!projectId || !supabase) {
      setChannelsLoading(false);
      return;
    }
    setChannelsLoading(true);
    setMigrationMissing(false);

    try {
      const { data, error } = await supabase
        .from('workspace_channels')
        .select('*')
        .eq('project_id', projectId);

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('not find the table')) {
          setMigrationMissing(true);
          setChannelsLoading(false);
          return;
        }
        throw error;
      }

      // Sort: 'general' first, then others alphabetically
      const sorted = (data || []).sort((a, b) => {
        if (a.name.toLowerCase() === 'general') return -1;
        if (b.name.toLowerCase() === 'general') return 1;
        return a.name.localeCompare(b.name);
      });

      setChannels(sorted);

      if (sorted.length > 0) {
        setActiveChannel((prev) => {
          if (prev && sorted.some((c) => c.id === prev.id)) {
            return sorted.find((c) => c.id === prev.id) || sorted[0];
          }
          return sorted[0];
        });
      } else {
        setActiveChannel(null);
      }
    } catch (err: any) {
      console.error('[DiscussionPanel] Failed to load channels:', err);
    } finally {
      setChannelsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  // 2. Load Messages for active channel
  const loadChannelMessages = useCallback(async (channelId: string) => {
    if (!supabase) return;
    setMessagesLoading(true);
    try {
      const { data, error } = await supabase
        .from('workspace_messages')
        .select(`
          id,
          project_id,
          channel_id,
          sender_id,
          parent_message_id,
          message,
          created_at,
          updated_at,
          edited_at,
          profiles:sender_id(id, display_name, avatar_url, role, email)
        `)
        .eq('project_id', projectId)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('not find the table')) {
          setMigrationMissing(true);
          return;
        }
        throw error;
      }

      const all = (data || []) as unknown as WorkspaceMessage[];

      const rootMsgs = all.filter((m) => !m.parent_message_id);
      const replyCounts: Record<string, number> = {};

      for (const m of all) {
        if (m.parent_message_id) {
          replyCounts[m.parent_message_id] = (replyCounts[m.parent_message_id] || 0) + 1;
        }
      }

      const formattedRoots = rootMsgs.map((m) => ({
        ...m,
        reply_count: replyCounts[m.id] || 0,
      }));

      setMessages(formattedRoots);
    } catch (err: any) {
      console.error('[DiscussionPanel] Failed to load messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (activeChannel?.id) {
      loadChannelMessages(activeChannel.id);
      setActiveThreadMessage(null);
      setThreadReplies([]);
    } else {
      setMessages([]);
    }
  }, [activeChannel?.id, loadChannelMessages]);

  // 3. Load Replies when a thread is opened
  const loadThreadReplies = useCallback(async (rootMsgId: string) => {
    if (!supabase) return;
    setThreadLoading(true);
    try {
      const { data, error } = await supabase
        .from('workspace_messages')
        .select(`
          id,
          project_id,
          channel_id,
          sender_id,
          parent_message_id,
          message,
          created_at,
          updated_at,
          edited_at,
          profiles:sender_id(id, display_name, avatar_url, role, email)
        `)
        .eq('project_id', projectId)
        .eq('parent_message_id', rootMsgId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setThreadReplies((data || []) as unknown as WorkspaceMessage[]);
    } catch (err: any) {
      console.error('[DiscussionPanel] Failed to load thread replies:', err);
    } finally {
      setThreadLoading(false);
    }
  }, [projectId]);

  const handleOpenThread = (msg: WorkspaceMessage) => {
    setActiveThreadMessage(msg);
    loadThreadReplies(msg.id);
  };

  const handleCloseThread = () => {
    setActiveThreadMessage(null);
    setThreadReplies([]);
  };

  // 4. Realtime Subscription
  useEffect(() => {
    if (!projectId || !supabase) return;

    const channelSub = supabase
      .channel(`workspace-messages:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_messages',
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          const eventType = payload.eventType;

          if (eventType === 'INSERT') {
            const newRow = payload.new as WorkspaceMessage;

            const alreadyInRoots = messages.some((m) => m.id === newRow.id);
            const alreadyInReplies = threadReplies.some((r) => r.id === newRow.id);
            if (alreadyInRoots || alreadyInReplies) return;

            const senderProfile = await fetchSenderProfile(newRow.sender_id);
            const enrichedMsg: WorkspaceMessage = {
              ...newRow,
              profiles: senderProfile,
              sender: senderProfile,
              reply_count: 0,
            };

            if (newRow.parent_message_id) {
              if (activeThreadMessage && activeThreadMessage.id === newRow.parent_message_id) {
                setThreadReplies((prev) => [...prev, enrichedMsg]);
              }
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === newRow.parent_message_id
                    ? { ...m, reply_count: (m.reply_count || 0) + 1 }
                    : m
                )
              );
            } else {
              if (activeChannel && newRow.channel_id === activeChannel.id) {
                setMessages((prev) => [...prev, enrichedMsg]);
              }
            }
          } else if (eventType === 'UPDATE') {
            const updatedRow = payload.new as WorkspaceMessage;

            setMessages((prev) =>
              prev.map((m) =>
                m.id === updatedRow.id
                  ? {
                      ...m,
                      message: updatedRow.message,
                      edited_at: updatedRow.edited_at,
                      updated_at: updatedRow.updated_at,
                    }
                  : m
              )
            );

            setThreadReplies((prev) =>
              prev.map((r) =>
                r.id === updatedRow.id
                  ? {
                      ...r,
                      message: updatedRow.message,
                      edited_at: updatedRow.edited_at,
                      updated_at: updatedRow.updated_at,
                    }
                  : r
              )
            );

            if (activeThreadMessage && activeThreadMessage.id === updatedRow.id) {
              setActiveThreadMessage((prev) =>
                prev
                  ? {
                      ...prev,
                      message: updatedRow.message,
                      edited_at: updatedRow.edited_at,
                      updated_at: updatedRow.updated_at,
                    }
                  : null
              );
            }
          } else if (eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;

            setMessages((prev) => prev.filter((m) => m.id !== deletedId));

            setThreadReplies((prev) => {
              const existed = prev.some((r) => r.id === deletedId);
              if (existed && activeThreadMessage) {
                setMessages((mList) =>
                  mList.map((m) =>
                    m.id === activeThreadMessage.id
                      ? { ...m, reply_count: Math.max(0, (m.reply_count || 1) - 1) }
                      : m
                  )
                );
              }
              return prev.filter((r) => r.id !== deletedId);
            });

            if (activeThreadMessage && activeThreadMessage.id === deletedId) {
              setActiveThreadMessage(null);
              setThreadReplies([]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channelSub);
      }
    };
  }, [projectId, activeChannel?.id, activeThreadMessage?.id, messages, threadReplies, fetchSenderProfile]);

  // 5. Send Root Message
  const handleSendMessage = async (messageText: string) => {
    if (!activeChannel || !currentUserId || !supabase) return;

    const { data, error } = await supabase
      .from('workspace_messages')
      .insert({
        project_id: projectId,
        channel_id: activeChannel.id,
        sender_id: currentUserId,
        message: messageText,
      })
      .select(`
        id,
        project_id,
        channel_id,
        sender_id,
        parent_message_id,
        message,
        created_at,
        updated_at,
        edited_at,
        profiles:sender_id(id, display_name, avatar_url, role, email)
      `)
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to send message');
    }

    if (data) {
      const formatted = data as unknown as WorkspaceMessage;
      setMessages((prev) => {
        if (prev.some((m) => m.id === formatted.id)) return prev;
        return [...prev, { ...formatted, reply_count: 0 }];
      });
    }
  };

  // 6. Send Thread Reply
  const handleSendReply = async (replyText: string) => {
    if (!activeThreadMessage || !activeChannel || !currentUserId || !supabase) return;

    const { data, error } = await supabase
      .from('workspace_messages')
      .insert({
        project_id: projectId,
        channel_id: activeChannel.id,
        sender_id: currentUserId,
        parent_message_id: activeThreadMessage.id,
        message: replyText,
      })
      .select(`
        id,
        project_id,
        channel_id,
        sender_id,
        parent_message_id,
        message,
        created_at,
        updated_at,
        edited_at,
        profiles:sender_id(id, display_name, avatar_url, role, email)
      `)
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to send reply');
    }

    if (data) {
      const formatted = data as unknown as WorkspaceMessage;
      setThreadReplies((prev) => {
        if (prev.some((r) => r.id === formatted.id)) return prev;
        return [...prev, formatted];
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === activeThreadMessage.id
            ? { ...m, reply_count: (m.reply_count || 0) + 1 }
            : m
        )
      );
    }
  };

  // 7. Edit Message
  const handleEditMessage = async (messageId: string, newText: string) => {
    if (!supabase) return;

    const { error } = await supabase
      .from('workspace_messages')
      .update({ message: newText })
      .eq('id', messageId);

    if (error) {
      throw new Error(error.message || 'Failed to update message');
    }

    const nowIso = new Date().toISOString();
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, message: newText, edited_at: nowIso } : m
      )
    );
    setThreadReplies((prev) =>
      prev.map((r) =>
        r.id === messageId ? { ...r, message: newText, edited_at: nowIso } : r
      )
    );
  };

  // 8. Delete Message
  const handleDeleteMessage = async (messageId: string) => {
    if (!supabase) return;

    const { error } = await supabase
      .from('workspace_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      throw new Error(error.message || 'Failed to delete message');
    }

    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    setThreadReplies((prev) => prev.filter((r) => r.id !== messageId));
    if (activeThreadMessage?.id === messageId) {
      setActiveThreadMessage(null);
      setThreadReplies([]);
    }
  };

  // 9. Create Channel
  const handleCreateChannel = async (payload: {
    name: string;
    description: string;
    channel_type: ChannelType;
  }) => {
    if (!currentUserId || !supabase) throw new Error('Authentication required');

    const { data, error } = await supabase
      .from('workspace_channels')
      .insert({
        project_id: projectId,
        name: payload.name,
        description: payload.description,
        channel_type: payload.channel_type,
        created_by: currentUserId,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to create channel');
    }

    if (data) {
      const newChannel = data as WorkspaceChannel;
      setChannels((prev) => [...prev, newChannel]);
      setActiveChannel(newChannel);
    }
  };

  const activeChannelIcon = useMemo(() => {
    if (!activeChannel) return <Hash size={16} />;
    switch (activeChannel.channel_type) {
      case 'research':
        return <Compass size={16} className="text-[#1D4ED8]" />;
      case 'task':
        return <CheckCircle size={16} className="text-[#059669]" />;
      case 'announcement':
        return <Megaphone size={16} className="text-[#D97706]" />;
      default:
        return <Hash size={16} className="text-[#64748B]" />;
    }
  }, [activeChannel]);

  if (migrationMissing) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-[#B45309]">
            <AlertCircle size={20} />
            <h3 className="text-sm font-semibold text-[#0F172A]">
              Workspace Communication Tables Pending
            </h3>
          </div>

          <p className="text-xs text-[#475569] leading-relaxed">
            The workspace communication migration (`workspace_channels`, `workspace_messages`, `notifications`) has not yet been executed in your Supabase project.
          </p>

          <div className="bg-[#0F172A] text-[#F8FAFC] p-3 rounded-lg text-[11px] font-mono flex items-center justify-between">
            <span>supabase/migrations/002_workspace_communication.sql</span>
            <Terminal size={14} className="text-[#94A3B8]" />
          </div>

          <p className="text-xs text-[#64748B]">
            Please run the SQL file in your <strong>Supabase Dashboard → SQL Editor</strong> to enable real-time discussion channels and threaded replies.
          </p>

          <button
            onClick={() => loadChannels()}
            className="w-full text-xs font-semibold bg-[#1D4ED8] text-white py-2 rounded-lg hover:bg-[#1E40AF] transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      {/* Channel list sidebar */}
      <ChannelList
        channels={channels}
        activeChannelId={activeChannel?.id || null}
        onSelectChannel={(ch) => {
          setActiveChannel(ch);
        }}
        canManageChannels={canManageChannels}
        onCreateChannel={handleCreateChannel}
        isLoading={channelsLoading}
      />

      {/* Main Discussion Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {activeChannel ? (
          <>
            {/* Channel Header */}
            <div className="px-4 py-3 border-b border-[#E2E8F0] bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0">{activeChannelIcon}</span>
                <div className="truncate">
                  <h2 className="text-xs font-bold text-[#0F172A] truncate">
                    #{activeChannel.name}
                  </h2>
                  {activeChannel.description && (
                    <p className="text-[11px] text-[#64748B] truncate">
                      {activeChannel.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#64748B] shrink-0">
                <span className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded text-[11px] font-medium">
                  <Users size={12} className="text-[#94A3B8]" />
                  {teamCount} {teamCount === 1 ? 'member' : 'members'}
                </span>
              </div>
            </div>

            {/* Messages Feed */}
            <MessageList
              messages={messages}
              currentUserId={currentUserId}
              isProjectOwner={isProjectOwner}
              onOpenThread={handleOpenThread}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              isLoading={messagesLoading}
              channelName={activeChannel.name}
            />

            {/* Message Composer */}
            <MessageComposer
              placeholder={`Write a message in #${activeChannel.name}...`}
              onSendMessage={handleSendMessage}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-[#64748B]">
            {channelsLoading ? 'Loading channels...' : 'Select or create a channel to begin discussions.'}
          </div>
        )}
      </div>

      {/* Thread Panel (Desktop side pane) */}
      {activeThreadMessage && (
        <ThreadPanel
          rootMessage={activeThreadMessage}
          replies={threadReplies}
          currentUserId={currentUserId}
          isProjectOwner={isProjectOwner}
          onClose={handleCloseThread}
          onSendReply={handleSendReply}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          isLoading={threadLoading}
        />
      )}
    </div>
  );
}
