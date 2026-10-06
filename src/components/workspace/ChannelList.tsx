import React, { useState } from 'react';
import {
  Hash,
  Plus,
  Compass,
  CheckCircle,
  Megaphone,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import type { WorkspaceChannel, ChannelType } from '../../types/workspace';
import { Button } from '../ui/Button';

interface ChannelListProps {
  channels: WorkspaceChannel[];
  activeChannelId: string | null;
  onSelectChannel: (channel: WorkspaceChannel) => void;
  canManageChannels: boolean;
  onCreateChannel: (payload: {
    name: string;
    description: string;
    channel_type: ChannelType;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function ChannelList({
  channels,
  activeChannelId,
  onSelectChannel,
  canManageChannels,
  onCreateChannel,
  isLoading = false,
}: ChannelListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [channelType, setChannelType] = useState<ChannelType>('general');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const getChannelIcon = (type: ChannelType) => {
    switch (type) {
      case 'research':
        return <Compass size={14} className="text-[#1D4ED8]" />;
      case 'task':
        return <CheckCircle size={14} className="text-[#059669]" />;
      case 'announcement':
        return <Megaphone size={14} className="text-[#D97706]" />;
      case 'general':
      default:
        return <Hash size={14} className="text-[#64748B]" />;
    }
  };

  const handleOpenModal = () => {
    setName('');
    setDescription('');
    setChannelType('general');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Clean name: remove leading hash, lowercase, spaces to dashes
    const cleanName = name
      .trim()
      .replace(/^#+/, '')
      .toLowerCase()
      .replace(/\s+/g, '-');

    if (!cleanName) {
      setFormError('Channel name is required.');
      return;
    }

    if (channels.some((c) => c.name.toLowerCase() === cleanName)) {
      setFormError(`A channel named "#${cleanName}" already exists.`);
      return;
    }

    setSubmitting(true);
    try {
      await onCreateChannel({
        name: cleanName,
        description: description.trim(),
        channel_type: channelType,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create channel.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-64 border-r border-[#E2E8F0] bg-[#FAFAFA] flex flex-col h-full shrink-0 select-none">
      {/* Header */}
      <div className="p-3 border-b border-[#E2E8F0] flex items-center justify-between">
        <span className="text-xs font-semibold text-[#334155] tracking-wide uppercase">
          Channels
        </span>

        {canManageChannels && (
          <button
            onClick={handleOpenModal}
            className="p-1 rounded text-[#64748B] hover:text-[#1D4ED8] hover:bg-[#F1F5F9] transition-colors"
            title="Create new channel"
            aria-label="New Channel"
          >
            <Plus size={15} />
          </button>
        )}
      </div>

      {/* Channel items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {isLoading ? (
          <div className="p-4 text-center">
            <Loader2 size={16} className="animate-spin text-[#64748B] mx-auto" />
            <p className="text-[11px] text-[#94A3B8] mt-1">Loading channels...</p>
          </div>
        ) : channels.length === 0 ? (
          <div className="p-4 text-center space-y-2">
            <p className="text-xs text-[#64748B]">No channels yet.</p>
            {canManageChannels && (
              <Button
                size="sm"
                variant="secondary"
                className="w-full text-xs"
                onClick={handleOpenModal}
              >
                + Create #general
              </Button>
            )}
          </div>
        ) : (
          channels.map((ch) => {
            const isActive = ch.id === activeChannelId;
            return (
              <button
                key={ch.id}
                onClick={() => onSelectChannel(ch)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-left transition-colors ${
                  isActive
                    ? 'bg-[#E0E7FF] text-[#1E3A8A] font-semibold'
                    : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                }`}
              >
                <span className="shrink-0">{getChannelIcon(ch.channel_type)}</span>
                <span className="truncate flex-1">#{ch.name}</span>
              </button>
            );
          })
        )}
      </div>

      {/* Create Channel Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0F172A]">
                Create Discussion Channel
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded hover:bg-[#F1F5F9]"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-[#FEF2F2] border border-[#FEE2E2] rounded-lg text-xs text-[#991B1B] flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Channel Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-[#94A3B8] text-xs font-semibold">#</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. methodology"
                    className="w-full pl-6 pr-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1D4ED8] focus:border-[#1D4ED8]"
                    required
                  />
                </div>
                <p className="text-[10px] text-[#64748B] mt-0.5">Use lowercase and hyphens (e.g., data-prep)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this channel for?"
                  rows={2}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Channel Type
                </label>
                <select
                  value={channelType}
                  onChange={(e) => setChannelType(e.target.value as ChannelType)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1D4ED8] focus:border-[#1D4ED8]"
                >
                  <option value="general">General — Broad project discussion</option>
                  <option value="research">Research — Questions, hypotheses & literature</option>
                  <option value="task">Task — Specific milestone coordination</option>
                  <option value="announcement">Announcement — Official project updates</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Channel'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
