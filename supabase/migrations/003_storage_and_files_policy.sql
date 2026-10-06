-- ============================================================
-- RESEARCHMESH — Migration 003: Storage Bucket & File Management Policies
-- Safe Code/Dataset Persistence for Governed Project Workspaces
-- ============================================================

-- 1. Create the canonical 'project-files' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files',
  false,
  52428800, -- 50 MB limit
  null       -- all mime types supported
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Objects RLS Policies for 'project-files'
-- Allow authenticated members of the project or organization owners to READ
DROP POLICY IF EXISTS "Project members can read project files" ON storage.objects;
CREATE POLICY "Project members can read project files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files'
);

-- Allow authenticated project members or organization owners to UPLOAD
DROP POLICY IF EXISTS "Project members can upload project files" ON storage.objects;
CREATE POLICY "Project members can upload project files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files'
);

-- Allow authenticated project members or organization owners to UPDATE
DROP POLICY IF EXISTS "Project members can update project files" ON storage.objects;
CREATE POLICY "Project members can update project files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-files'
);

-- Allow authenticated project members or organization owners to DELETE
DROP POLICY IF EXISTS "Project members can delete project files" ON storage.objects;
CREATE POLICY "Project members can delete project files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-files'
);

-- ============================================================
-- 3. Public.files UPDATE and DELETE RLS Policies
-- ============================================================

-- Allow project owner or active project members to UPDATE metadata
DROP POLICY IF EXISTS "Project members can update files" ON public.files;
CREATE POLICY "Project members can update files"
  ON public.files FOR UPDATE
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND org_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = files.project_id AND user_id = auth.uid() AND status = 'active')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND org_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = files.project_id AND user_id = auth.uid() AND status = 'active')
  );

-- Allow project owner or file uploader to DELETE files
DROP POLICY IF EXISTS "Project members can delete files" ON public.files;
CREATE POLICY "Project members can delete files"
  ON public.files FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND org_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = files.project_id AND user_id = auth.uid() AND status = 'active')
  );
