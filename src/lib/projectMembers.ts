import { supabase } from './supabase';

/**
 * Synchronizes application acceptance to Supabase:
 * 1. Updates public.applications status to 'accepted'
 * 2. Creates/activates an active record in public.project_members
 * 
 * This ensures accepted applicants can immediately access the project workspace
 * through real Supabase RLS and client queries.
 */
export async function syncApplicationAcceptanceToSupabase(applicationId: string): Promise<void> {
  if (!supabase) return;
  try {
    const { data: appRow, error: appFetchErr } = await supabase
      .from('applications')
      .select('id, project_id, user_id, role, status')
      .eq('id', applicationId)
      .maybeSingle();

    if (appFetchErr) {
      console.warn('[syncApplicationAcceptance] Could not fetch application from Supabase:', appFetchErr.message);
      return;
    }

    if (appRow) {
      // 1. Update application status
      const { error: appUpdateErr } = await supabase
        .from('applications')
        .update({ status: 'accepted' })
        .eq('id', applicationId);

      if (appUpdateErr) {
        console.warn('[syncApplicationAcceptance] Failed to update application in Supabase:', appUpdateErr.message);
      }

      // 2. Ensure active project membership exists
      const { error: memberUpsertErr } = await supabase
        .from('project_members')
        .upsert(
          {
            project_id: appRow.project_id,
            user_id: appRow.user_id,
            role: appRow.role || 'student',
            status: 'active',
          },
          { onConflict: 'project_id,user_id' }
        );

      if (memberUpsertErr) {
        console.warn('[syncApplicationAcceptance] Failed to upsert project_member in Supabase:', memberUpsertErr.message);
      }
    }
  } catch (err: any) {
    console.error('[syncApplicationAcceptance] Error syncing to Supabase:', err);
  }
}
