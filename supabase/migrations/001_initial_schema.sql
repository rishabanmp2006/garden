-- ============================================================
-- RESEARCHMESH — Production Database Schema & RLS Policies
-- Gardenia 2K26 Hackathon Multi-User Deployment
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES TABLE (Linked directly to auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'organization', 'mentor', 'admin')),
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  verified BOOLEAN DEFAULT false,
  skills TEXT[] DEFAULT '{}',
  domains TEXT[] DEFAULT '{}',
  education TEXT,
  experience TEXT,
  availability TEXT,
  bio TEXT,
  portfolio_links TEXT[] DEFAULT '{}',
  org_name TEXT,
  org_description TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by all authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- AUTOMATIC PROFILE TRIGGER ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    role,
    display_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. PROJECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  public_summary TEXT NOT NULL,
  confidential_brief TEXT NOT NULL,
  domain TEXT NOT NULL,
  required_skills TEXT[] DEFAULT '{}',
  sensitivity_level TEXT NOT NULL CHECK (sensitivity_level IN ('low', 'medium', 'high', 'critical')),
  engagement_model TEXT NOT NULL CHECK (engagement_model IN ('funded', 'stipend', 'knowledge_sharing', 'institutional_credit')),
  budget NUMERIC(12,2) DEFAULT 0,
  withdrawal_threshold NUMERIC(12,2) DEFAULT 50,
  ai_policy JSONB NOT NULL DEFAULT '{"cloud_allowed": false, "local_required": true, "approved_models": ["llama3", "codellama"], "human_approval_required": true}'::jsonb,
  ip_ownership TEXT NOT NULL DEFAULT 'Shared IP — Organization retains proprietary assets; contributors retain novel algorithms with license-back',
  authorship_rules TEXT NOT NULL DEFAULT 'Co-authorship for contributors exceeding >15% verified credits',
  commercialization_terms TEXT DEFAULT 'Non-commercial open research',
  reward_structure JSONB DEFAULT '{"contributor_percent": 60, "expert_percent": 25, "ai_compute_percent": 10, "platform_fee_percent": 5}'::jsonb,
  duration_days INT DEFAULT 90,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'active', 'paused', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Projects are viewable by all authenticated users"
  ON public.projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Organizations can insert projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = org_id AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('organization', 'admin'))
  );

CREATE POLICY "Project owners can update their projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = org_id)
  WITH CHECK (auth.uid() = org_id);

-- ============================================================
-- 3. PROJECT MEMBERSHIP TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('organization_owner', 'student', 'mentor', 'workspace_manager')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'left', 'removed')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Memberships viewable by all authenticated users"
  ON public.project_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Project owners or managers can add members"
  ON public.project_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects WHERE id = project_id AND org_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.project_members WHERE project_id = project_members.project_id AND user_id = auth.uid() AND role IN ('organization_owner', 'workspace_manager')
    ) OR
    auth.uid() = user_id
  );

CREATE POLICY "Project owners can update member status"
  ON public.project_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects WHERE id = project_id AND org_id = auth.uid()
    )
  );

-- ============================================================
-- 4. CHARTERS & VERSIONING
-- ============================================================
CREATE TABLE IF NOT EXISTS public.charters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  scope TEXT NOT NULL,
  ip_terms TEXT NOT NULL,
  authorship_terms TEXT NOT NULL,
  confidentiality_terms TEXT NOT NULL,
  ai_policy_terms TEXT NOT NULL,
  dispute_rules TEXT NOT NULL,
  withdrawal_rules TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'draft')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, version)
);

ALTER TABLE public.charters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Charters viewable by all authenticated users"
  ON public.charters FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Project owners can create charters"
  ON public.charters FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND org_id = auth.uid())
  );

-- Charter Acceptances
CREATE TABLE IF NOT EXISTS public.charter_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charter_id UUID NOT NULL REFERENCES public.charters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ DEFAULT now(),
  ip_hash TEXT,
  UNIQUE(charter_id, user_id)
);

ALTER TABLE public.charter_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceptances viewable by authenticated users"
  ON public.charter_acceptances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can sign charter acceptance"
  ON public.charter_acceptances FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5. APPLICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'mentor')),
  message TEXT NOT NULL,
  relevant_skills TEXT[] DEFAULT '{}',
  match_score INT DEFAULT 0,
  match_reasons TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants see their own applications; Orgs see their project applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND org_id = auth.uid())
  );

CREATE POLICY "Users can apply to projects"
  ON public.applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Project owners can update application status"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND org_id = auth.uid()) OR
    auth.uid() = user_id
  );

-- ============================================================
-- 6. MILESTONES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  deliverables TEXT[] DEFAULT '{}',
  acceptance_criteria TEXT NOT NULL,
  budget_allocation NUMERIC(12,2) DEFAULT 0,
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'accepted', 'rejected')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Milestones viewable by authenticated users"
  ON public.milestones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Project owners can manage milestones"
  ON public.milestones FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND org_id = auth.uid()));

-- ============================================================
-- 7. TASKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'submitted', 'under_review', 'approved', 'rejected', 'completed')),
  credits_reward INT DEFAULT 25,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tasks viewable by project members"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = tasks.project_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.projects WHERE id = tasks.project_id AND org_id = auth.uid())
  );

CREATE POLICY "Project owners, mentors, or managers can create tasks"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND org_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = tasks.project_id AND user_id = auth.uid() AND role IN ('mentor', 'workspace_manager', 'organization_owner'))
  );

CREATE POLICY "Assigned members and reviewers can update task status"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND org_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = tasks.project_id AND user_id = auth.uid() AND role IN ('mentor', 'workspace_manager'))
  );

-- ============================================================
-- 8. FILES & DATA ROOM TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size TEXT NOT NULL,
  is_confidential BOOLEAN DEFAULT false,
  sensitivity_level TEXT DEFAULT 'low' CHECK (sensitivity_level IN ('low', 'medium', 'high', 'critical')),
  export_policy TEXT DEFAULT 'restricted',
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Confidential files accessible ONLY to members who accepted charter!
CREATE POLICY "Public files viewable by all; confidential only by charter signatories"
  ON public.files FOR SELECT
  TO authenticated
  USING (
    NOT is_confidential OR
    EXISTS (
      SELECT 1 FROM public.project_members pm
      JOIN public.charters c ON c.project_id = pm.project_id AND c.status = 'active'
      JOIN public.charter_acceptances ca ON ca.charter_id = c.id AND ca.user_id = auth.uid()
      WHERE pm.project_id = files.project_id AND pm.user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.projects WHERE id = files.project_id AND org_id = auth.uid())
  );

CREATE POLICY "Project members can upload files"
  ON public.files FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = uploaded_by AND
    (
      EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND org_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM public.project_members WHERE project_id = files.project_id AND user_id = auth.uid())
    )
  );

-- File Downloads Audit Log
CREATE TABLE IF NOT EXISTS public.file_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  watermark_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.file_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "File downloads logged by downloader; visible to org"
  ON public.file_downloads FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.files f
      JOIN public.projects p ON p.id = f.project_id
      WHERE f.id = file_downloads.file_id AND p.org_id = auth.uid()
    )
  );

-- ============================================================
-- 9. CONTRIBUTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id),
  contributor_id UUID NOT NULL REFERENCES public.profiles(id),
  role TEXT NOT NULL DEFAULT 'student',
  type TEXT NOT NULL CHECK (type IN ('code', 'dataset', 'research', 'review', 'experiment', 'documentation')),
  description TEXT NOT NULL,
  file_name TEXT,
  file_url TEXT,
  content_hash TEXT NOT NULL,
  ai_involvement TEXT NOT NULL DEFAULT 'none' CHECK (ai_involvement IN ('none', 'ai_assisted', 'ai_generated')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  credits_awarded INT DEFAULT 0,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contributions viewable by all authenticated users"
  ON public.contributions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Members can submit contributions"
  ON public.contributions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = contributor_id AND
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = contributions.project_id AND user_id = auth.uid())
  );

CREATE POLICY "Mentors or orgs can review contributions"
  ON public.contributions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND org_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = contributions.project_id AND user_id = auth.uid() AND role IN ('mentor', 'workspace_manager', 'organization_owner'))
  );

-- ============================================================
-- 10. CREDITS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  contribution_id UUID REFERENCES public.contributions(id),
  task_id UUID REFERENCES public.tasks(id),
  amount INT NOT NULL,
  reason TEXT NOT NULL,
  awarded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Credits viewable by all authenticated users"
  ON public.credits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Mentors or orgs can award credits"
  ON public.credits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND org_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = credits.project_id AND user_id = auth.uid() AND role IN ('mentor', 'workspace_manager'))
  );

-- ============================================================
-- 11. WITHDRAWAL REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  credits_exchanged INT NOT NULL,
  payout_profile JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'paid')),
  requested_at TIMESTAMPTZ DEFAULT now(),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  rejection_reason TEXT
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students see their own withdrawal requests; Orgs see their project requests"
  ON public.withdrawal_requests FOR SELECT
  TO authenticated
  USING (
    auth.uid() = student_id OR
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND org_id = auth.uid())
  );

CREATE POLICY "Students can request withdrawal if credits >= threshold"
  ON public.withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = student_id AND
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND
      (SELECT COALESCE(SUM(amount), 0) FROM public.credits c WHERE c.user_id = auth.uid() AND c.project_id = p.id) >= p.withdrawal_threshold
    )
  );

CREATE POLICY "Project owners can review and approve withdrawals"
  ON public.withdrawal_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND org_id = auth.uid())
  );

-- ============================================================
-- 12. ESCROW ACCOUNTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.escrow_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE,
  total_budget NUMERIC(12,2) NOT NULL DEFAULT 0,
  available_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  released_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'funded' CHECK (status IN ('funded', 'depleted', 'closed')),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.escrow_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Escrow accounts viewable by project members and org"
  ON public.escrow_accounts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Project owners can manage escrow"
  ON public.escrow_accounts FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND org_id = auth.uid()));

-- ============================================================
-- 13. RATINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rated_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  technical INT NOT NULL CHECK (technical BETWEEN 1 AND 5),
  collaboration INT NOT NULL CHECK (collaboration BETWEEN 1 AND 5),
  timeline INT NOT NULL CHECK (timeline BETWEEN 1 AND 5),
  charter_integrity INT NOT NULL CHECK (charter_integrity BETWEEN 1 AND 5),
  overall NUMERIC(3,2) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, rater_id, rated_id)
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ratings viewable by all authenticated users"
  ON public.ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Members can submit one rating per collaborator per project"
  ON public.ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = rater_id AND
    auth.uid() != rated_id AND
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = ratings.project_id AND user_id = auth.uid())
  );

-- ============================================================
-- 14. SHA-256 LEDGER TABLE (Append-Only Provenance)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('human', 'ai_agent', 'system')),
  action TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  previous_hash TEXT NOT NULL,
  entry_hash TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ledger viewable by all authenticated users"
  ON public.ledger_entries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System or authenticated users can append ledger entries"
  ON public.ledger_entries FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Disallow updates and deletions to enforce immutability!
CREATE POLICY "Ledger is append-only (no updates)"
  ON public.ledger_entries FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Ledger is append-only (no deletes)"
  ON public.ledger_entries FOR DELETE
  TO authenticated
  USING (false);

-- ============================================================
-- 15. AI ACTIVITY LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  agent_type TEXT NOT NULL,
  request TEXT NOT NULL,
  response TEXT NOT NULL,
  model TEXT NOT NULL,
  execution_type TEXT NOT NULL,
  data_sensitivity TEXT NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'approved',
  prompt_hash TEXT NOT NULL,
  response_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI logs viewable by project members"
  ON public.ai_activity_logs FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = ai_activity_logs.project_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.projects WHERE id = ai_activity_logs.project_id AND org_id = auth.uid())
  );

CREATE POLICY "AI logs insertable by authenticated users"
  ON public.ai_activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 16. REALTIME REPLICATION CONFIGURATION
-- ============================================================
-- Add tables to supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'applications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'contributions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contributions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'credits'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.credits;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'withdrawal_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawal_requests;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'ledger_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ledger_entries;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'project_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.project_members;
  END IF;
END $$;
