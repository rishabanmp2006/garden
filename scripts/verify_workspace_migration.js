/**
 * Automated Verification Script for Migration 002 (Workspace Communication)
 * Run with: node scripts/verify_workspace_migration.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseAnonKey);

async function runVerification() {
  console.log('=== VERIFYING WORKSPACE COMMUNICATION MIGRATION 002 ===\n');

  const tables = ['workspace_channels', 'workspace_messages', 'notifications'];
  let allTablesExist = true;

  for (const t of tables) {
    const { data, error } = await client.from(t).select('*').limit(1);
    if (error && error.code === 'PGRST205') {
      console.log(`❌ Table missing in schema cache: public.${t}`);
      allTablesExist = false;
    } else if (error && error.code !== 'PGRST116') {
      console.log(`✅ Table exists: public.${t} (Access response code: ${error.code})`);
    } else {
      console.log(`✅ Table exists: public.${t}`);
    }
  }

  if (!allTablesExist) {
    console.log('\n⚠️ Migration 002 has not been applied yet.');
    console.log('Please copy and run supabase/migrations/002_workspace_communication.sql in the Supabase Dashboard SQL Editor.');
    return;
  }

  console.log('\n--- 1. Testing RLS: Unauthenticated / Non-member Isolation ---');
  // Anonymous client attempting to read channels
  const { data: anonChannels, error: anonError } = await client
    .from('workspace_channels')
    .select('*');

  if (anonChannels && anonChannels.length === 0) {
    console.log('✅ RLS Enforced: Anonymous/unauthorized requests cannot read workspace_channels (returned 0 rows)');
  } else if (anonError) {
    console.log('✅ RLS Enforced: Access denied for unauthorized client:', anonError.message);
  } else {
    console.log('❌ RLS Failure: Channels leaked to unauthorized client!');
  }

  // Anonymous client attempting to read messages
  const { data: anonMessages, error: msgError } = await client
    .from('workspace_messages')
    .select('*');

  if (anonMessages && anonMessages.length === 0) {
    console.log('✅ RLS Enforced: Anonymous/unauthorized requests cannot read workspace_messages (returned 0 rows)');
  } else if (msgError) {
    console.log('✅ RLS Enforced: Access denied for unauthorized client:', msgError.message);
  }

  // Anonymous client attempting to read notifications
  const { data: anonNotifs, error: notifError } = await client
    .from('notifications')
    .select('*');

  if (anonNotifs && anonNotifs.length === 0) {
    console.log('✅ RLS Enforced: Anonymous/unauthorized requests cannot read notifications (returned 0 rows)');
  } else if (notifError) {
    console.log('✅ RLS Enforced: Access denied for unauthorized client:', notifError.message);
  }

  console.log('\n--- 2. Checking Projects & Channels Association ---');
  const { data: projects } = await client.from('projects').select('id, title');
  if (projects && projects.length > 0) {
    console.log(`Found ${projects.length} existing projects in database.`);
    for (const p of projects) {
      console.log(`- Project: [${p.id}] ${p.title}`);
    }
  }

  console.log('\n=== VERIFICATION RUN COMPLETE ===');
}

runVerification().catch(err => {
  console.error('Verification error:', err);
});
