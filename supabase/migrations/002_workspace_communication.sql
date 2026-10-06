-- ============================================================
-- RESEARCHMESH — Migration 002: Workspace Communication
-- Channels, Messages, Threads, and Notifications
-- ============================================================

-- ============================================================
-- 1. WORKSPACE CHANNELS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workspace_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  channel_type TEXT NOT NULL DEFAULT 'general'
    CHECK (channel_type IN ('general', 'research', 'task', 'announcement')),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_workspace_channels_project_id 
  ON public.workspace_channels(project_id);

CREATE INDEX IF NOT EXISTS idx_workspace_channels_type 
  ON public.workspace_channels(project_id, channel_type);

-- ============================================================
-- 2. WORKSPACE MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workspace_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.workspace_channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  parent_message_id UUID REFERENCES public.workspace_messages(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  edited_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workspace_messages_project_id 
  ON public.workspace_messages(project_id);

CREATE INDEX IF NOT EXISTS idx_workspace_messages_channel_created 
  ON public.workspace_messages(channel_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_workspace_messages_parent_id 
  ON public.workspace_messages(parent_message_id);

CREATE INDEX IF NOT EXISTS idx_workspace_messages_sender_id 
  ON public.workspace_messages(sender_id);

-- ============================================================
-- 3. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_is_read 
  ON public.notifications(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_project_id 
  ON public.notifications(project_id);

-- ============================================================
-- 4. NON-RECURSIVE SECURITY DEFINER HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_project_member_or_owner(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects WHERE id = p_project_id AND org_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_id = p_project_id 
      AND user_id = p_user_id 
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_project_channels(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects WHERE id = p_project_id AND org_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id
      AND user_id = p_user_id
      AND status = 'active'
      AND role IN ('organization_owner', 'mentor', 'workspace_manager')
  );
$$;

-- Trigger to update updated_at and edited_at
CREATE OR REPLACE FUNCTION public.handle_workspace_message_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.message IS DISTINCT FROM OLD.message THEN
    NEW.edited_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_workspace_message_updated ON public.workspace_messages;
CREATE TRIGGER on_workspace_message_updated
  BEFORE UPDATE ON public.workspace_messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_workspace_message_update();

CREATE OR REPLACE FUNCTION public.handle_workspace_channel_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_workspace_channel_updated ON public.workspace_channels;
CREATE TRIGGER on_workspace_channel_updated
  BEFORE UPDATE ON public.workspace_channels
  FOR EACH ROW EXECUTE FUNCTION public.handle_workspace_channel_update();

-- ============================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS
ALTER TABLE public.workspace_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5.1 Channels Policies
DROP POLICY IF EXISTS "Workspace channels viewable by project members or owner" ON public.workspace_channels;
CREATE POLICY "Workspace channels viewable by project members or owner"
  ON public.workspace_channels FOR SELECT
  TO authenticated
  USING (public.is_project_member_or_owner(project_id, auth.uid()));

DROP POLICY IF EXISTS "Authorized members can create workspace channels" ON public.workspace_channels;
CREATE POLICY "Authorized members can create workspace channels"
  ON public.workspace_channels FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND 
    public.can_manage_project_channels(project_id, auth.uid())
  );

DROP POLICY IF EXISTS "Authorized members can update workspace channels" ON public.workspace_channels;
CREATE POLICY "Authorized members can update workspace channels"
  ON public.workspace_channels FOR UPDATE
  TO authenticated
  USING (public.can_manage_project_channels(project_id, auth.uid()))
  WITH CHECK (public.can_manage_project_channels(project_id, auth.uid()));

DROP POLICY IF EXISTS "Project owners can delete workspace channels" ON public.workspace_channels;
CREATE POLICY "Project owners can delete workspace channels"
  ON public.workspace_channels FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND org_id = auth.uid()));

-- 5.2 Messages Policies
DROP POLICY IF EXISTS "Workspace messages viewable by project members or owner" ON public.workspace_messages;
CREATE POLICY "Workspace messages viewable by project members or owner"
  ON public.workspace_messages FOR SELECT
  TO authenticated
  USING (public.is_project_member_or_owner(project_id, auth.uid()));

DROP POLICY IF EXISTS "Active project members can send messages" ON public.workspace_messages;
CREATE POLICY "Active project members can send messages"
  ON public.workspace_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND 
    public.is_project_member_or_owner(project_id, auth.uid())
  );

DROP POLICY IF EXISTS "Senders can edit their own messages" ON public.workspace_messages;
CREATE POLICY "Senders can edit their own messages"
  ON public.workspace_messages FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = sender_id AND 
    public.is_project_member_or_owner(project_id, auth.uid())
  )
  WITH CHECK (
    auth.uid() = sender_id AND 
    public.is_project_member_or_owner(project_id, auth.uid())
  );

DROP POLICY IF EXISTS "Senders or project owners can delete messages" ON public.workspace_messages;
CREATE POLICY "Senders or project owners can delete messages"
  ON public.workspace_messages FOR DELETE
  TO authenticated
  USING (
    auth.uid() = sender_id OR 
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND org_id = auth.uid())
  );

-- 5.3 Notifications Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Notifications created by system or project members" ON public.notifications;
CREATE POLICY "Notifications created by system or project members"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (project_id IS NULL OR public.is_project_member_or_owner(project_id, auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 6. REALTIME REPLICATION CONFIGURATION
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'workspace_channels'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_channels;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'workspace_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- ============================================================
-- 7. SAFE IDEMPOTENT INITIALIZATION FOR EXISTING PROJECTS
-- ============================================================
-- Creates default "general" channel for existing projects using authenticated org_id
INSERT INTO public.workspace_channels (project_id, name, description, channel_type, created_by)
SELECT p.id, 'general', 'General research workspace discussion', 'general', p.org_id
FROM public.projects p
WHERE NOT EXISTS (
  SELECT 1 FROM public.workspace_channels wc 
  WHERE wc.project_id = p.id AND wc.name = 'general'
);
