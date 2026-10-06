export type ChannelType = 'general' | 'research' | 'task' | 'announcement';

export interface WorkspaceChannel {
  id: string;
  project_id: string;
  name: string;
  description?: string | null;
  channel_type: ChannelType;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SenderProfile {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  email?: string | null;
  education?: string | null;
  skills?: string[] | null;
}

export interface WorkspaceMessage {
  id: string;
  project_id: string;
  channel_id: string;
  sender_id: string;
  parent_message_id?: string | null;
  message: string;
  created_at: string;
  updated_at: string;
  edited_at?: string | null;
  profiles?: SenderProfile | null;
  sender?: SenderProfile | null;
  reply_count?: number;
}

export interface WorkspaceMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  profiles?: SenderProfile | null;
}

export interface WorkspaceNotification {
  id: string;
  user_id: string;
  project_id?: string | null;
  type: string;
  title: string;
  message: string;
  reference_id?: string | null;
  is_read: boolean;
  created_at: string;
}
