import React, { useState } from 'react';
import {
  MessageSquare,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import type { WorkspaceMessage } from '../../types/workspace';

interface MessageItemProps {
  message: WorkspaceMessage;
  currentUserId?: string;
  isProjectOwner?: boolean;
  onOpenThread?: (message: WorkspaceMessage) => void;
  onEditMessage: (messageId: string, newText: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  isThreadReply?: boolean;
}

export function MessageItem({
  message,
  currentUserId,
  isProjectOwner = false,
  onOpenThread,
  onEditMessage,
  onDeleteMessage,
  isThreadReply = false,
}: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.message);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwnerOfMessage = currentUserId === message.sender_id;
  const canDelete = isOwnerOfMessage || isProjectOwner;

  const senderProfile = message.profiles || message.sender;
  const displayName = senderProfile?.display_name || senderProfile?.email?.split('@')[0] || 'Researcher';
  const role = senderProfile?.role;
  const avatarUrl = senderProfile?.avatar_url;

  // Format timestamp
  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateStr;
    }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    setIsSavingEdit(true);
    setEditError(null);
    try {
      await onEditMessage(message.id, editText.trim());
      setIsEditing(false);
    } catch (err: any) {
      setEditError(err.message || 'Failed to edit message');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteMessage(message.id);
      setIsConfirmingDelete(false);
    } catch (err: any) {
      alert(`Delete failed: ${err.message || err}`);
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="group relative flex gap-3 p-3 rounded-lg hover:bg-[#F8FAFC] transition-colors border border-transparent hover:border-[#F1F5F9]">
      {/* Avatar */}
      <div className="shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover border border-[#E2E8F0]"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[#1D4ED8] flex items-center justify-center text-xs font-bold">
            {getInitials(displayName)}
          </div>
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-semibold text-[#0F172A]">
            {displayName}
          </span>

          {role && (
            <span className="text-[10px] font-medium text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.2 rounded border border-[#E2E8F0] capitalize">
              {role.replace('_', ' ')}
            </span>
          )}

          <span className="text-[11px] text-[#94A3B8]">
            {formatTimestamp(message.created_at)}
          </span>

          {message.edited_at && (
            <span className="text-[10px] text-[#94A3B8] italic">
              (edited)
            </span>
          )}
        </div>

        {isEditing ? (
          <div className="mt-1 space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              className="w-full text-xs p-2 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1D4ED8] focus:border-[#1D4ED8]"
            />
            {editError && (
              <p className="text-[11px] text-red-600">{editError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit || !editText.trim()}
                className="inline-flex items-center gap-1 text-[11px] bg-[#1D4ED8] text-white px-2.5 py-1 rounded font-medium hover:bg-[#1E40AF] disabled:opacity-50"
              >
                {isSavingEdit ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditText(message.message);
                }}
                disabled={isSavingEdit}
                className="inline-flex items-center gap-1 text-[11px] bg-[#F1F5F9] text-[#475569] px-2.5 py-1 rounded font-medium hover:bg-[#E2E8F0]"
              >
                <X size={11} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#334155] whitespace-pre-wrap leading-relaxed break-words">
            {message.message}
          </p>
        )}

        {/* Reply trigger (only for root messages) */}
        {!isThreadReply && onOpenThread && !isEditing && (
          <div className="mt-2 flex items-center gap-3">
            {message.reply_count && message.reply_count > 0 ? (
              <button
                onClick={() => onOpenThread(message)}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1D4ED8] bg-[#EFF6FF] hover:bg-[#DBEAFE] px-2 py-0.5 rounded-full border border-[#BFDBFE] transition-colors"
              >
                <MessageSquare size={11} />
                <span>
                  {message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}
                </span>
              </button>
            ) : (
              <button
                onClick={() => onOpenThread(message)}
                className="text-[11px] text-[#64748B] hover:text-[#1D4ED8] font-medium transition-colors opacity-80 group-hover:opacity-100 flex items-center gap-1"
              >
                <MessageSquare size={11} />
                <span>Reply</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action buttons (hover bar) */}
      {!isEditing && (
        <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-white border border-[#E2E8F0] rounded shadow-xs px-1 py-0.5 z-10">
          {!isThreadReply && onOpenThread && (
            <button
              onClick={() => onOpenThread(message)}
              className="p-1 text-[#64748B] hover:text-[#1D4ED8] hover:bg-[#F1F5F9] rounded"
              title="Reply in thread"
            >
              <MessageSquare size={13} />
            </button>
          )}

          {isOwnerOfMessage && (
            <button
              onClick={() => {
                setEditText(message.message);
                setIsEditing(true);
              }}
              className="p-1 text-[#64748B] hover:text-[#1D4ED8] hover:bg-[#F1F5F9] rounded"
              title="Edit message"
            >
              <Edit2 size={13} />
            </button>
          )}

          {canDelete && (
            <button
              onClick={() => setIsConfirmingDelete(true)}
              className="p-1 text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded"
              title="Delete message"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}

      {/* Delete confirmation dialog */}
      {isConfirmingDelete && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xl max-w-sm w-full p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#DC2626]">
              <AlertTriangle size={18} />
              <h4 className="text-sm font-semibold text-[#0F172A]">Delete message?</h4>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Are you sure you want to permanently delete this message?
              {!isThreadReply && message.reply_count && message.reply_count > 0 && (
                <span className="block mt-1 font-semibold text-[#B91C1C]">
                  Warning: Deleting this message will also remove all {message.reply_count} replies in its thread.
                </span>
              )}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs text-[#475569] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg font-medium inline-flex items-center gap-1"
              >
                {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
