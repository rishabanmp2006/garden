import { supabase, isSupabaseConfigured } from './supabase';
import { recordLedgerEntryApi } from './api';
import type { CodeFile } from '../types/code';
import {
  detectLanguage,
  getDefaultBoilerplate,
  computeContentSha256,
  isSecretFile,
  isSupportedCodeFile,
} from './codeHelpers';

export const CODE_STORAGE_BUCKET = 'project-files';

// Fast in-memory cache for active editing sessions to ensure immediate reactivity
const sessionContentCache = new Map<string, string>();

/**
 * Normalizes storage path by stripping prefixes.
 */
export function normalizeStoragePath(rawPath: string): string {
  return rawPath
    .replace(/^\/storage\/(public|confidential)\//, '')
    .replace(/^\/+/, '')
    .trim();
}

/**
 * Loads the UTF-8 text content of a code file.
 * Prioritizes Supabase Storage, with fallback to in-memory session cache or deterministic template.
 */
export async function fetchCodeFileContent(
  file: CodeFile,
  projectId: string
): Promise<{ content: string; source: 'storage' | 'cache' | 'default' }> {
  // Check memory session cache first if file was recently created or modified in this tab
  if (sessionContentCache.has(file.id)) {
    return { content: sessionContentCache.get(file.id)!, source: 'cache' };
  }

  const cleanPath = normalizeStoragePath(file.storage_path || file.name);
  const fullStorageKey = `${projectId}/${cleanPath}`;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(CODE_STORAGE_BUCKET)
        .download(fullStorageKey);

      if (!error && data) {
        const text = await data.text();
        sessionContentCache.set(file.id, text);
        return { content: text, source: 'storage' };
      }
    } catch (err) {
      console.warn('[CodeStorage] Note reading from Supabase Storage bucket:', err);
    }
  }

  // If not found in storage, generate sensible starter code
  const lang = detectLanguage(file.name);
  const boilerplate = getDefaultBoilerplate(file.name, lang);
  sessionContentCache.set(file.id, boilerplate);
  return { content: boilerplate, source: 'default' };
}

/**
 * Saves updated code content:
 * 1. Uploads to Supabase Storage
 * 2. Updates file_size in public.files
 * 3. Records provenance on the SHA-256 cryptographic ledger
 */
export async function saveCodeFileContent(
  file: CodeFile,
  projectId: string,
  content: string,
  actorId: string
): Promise<{ success: boolean; contentHash: string; fileSize: string; storageSaved: boolean }> {
  const contentHash = await computeContentSha256(content);
  const sizeBytes = new TextEncoder().encode(content).length;
  const formattedSize =
    sizeBytes < 1024 ? `${sizeBytes} B` : `${Math.round(sizeBytes / 1024)} KB`;

  const cleanPath = normalizeStoragePath(file.storage_path || file.name);
  const fullStorageKey = `${projectId}/${cleanPath}`;

  let storageSaved = false;

  // 1. Persist to Supabase Storage
  if (isSupabaseConfigured() && supabase) {
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const { error: uploadError } = await supabase.storage
        .from(CODE_STORAGE_BUCKET)
        .upload(fullStorageKey, blob, {
          upsert: true,
          contentType: 'text/plain;charset=utf-8',
        });

      if (!uploadError) {
        storageSaved = true;
      } else {
        console.warn('[CodeStorage] Supabase Storage upload notice:', uploadError.message);
      }
    } catch (err) {
      console.warn('[CodeStorage] Storage upload exception:', err);
    }

    // 2. Update public.files metadata
    try {
      await supabase
        .from('files')
        .update({ file_size: formattedSize })
        .eq('id', file.id);
    } catch (err) {
      console.warn('[CodeStorage] public.files metadata update notice:', err);
    }
  }

  // Update in-memory session cache
  sessionContentCache.set(file.id, content);

  // 3. Record cryptographic ledger provenance via FastAPI ledger service
  try {
    await recordLedgerEntryApi({
      project_id: projectId,
      actor_id: actorId,
      action: `Modified & Saved Code File: ${file.name}`,
      content_payload: `${file.id}|${file.name}|${contentHash}|${new Date().toISOString()}`,
      metadata: {
        file_id: file.id,
        file_name: file.name,
        content_hash: contentHash,
        file_size: formattedSize,
        storage_path: fullStorageKey,
      },
    });
  } catch (err) {
    console.warn('[CodeStorage] Ledger provenance note:', err);
  }

  return { success: true, contentHash, fileSize: formattedSize, storageSaved };
}

/**
 * Creates a new research code file in public.files and Supabase Storage.
 */
export async function createCodeFile(
  projectId: string,
  fileName: string,
  folderPath: string,
  initialContent: string,
  isConfidential: boolean,
  actorId: string
): Promise<CodeFile> {
  if (isSecretFile(fileName)) {
    throw new Error('Security Error: Credentials, private keys, and .env files are blocked from repository.');
  }

  if (!isSupportedCodeFile(fileName)) {
    throw new Error('Unsupported file extension. Please select a supported research programming format.');
  }

  const cleanFolder = folderPath.replace(/^\/+|\/+$/g, '').trim();
  const normalizedStoragePath = cleanFolder ? `${cleanFolder}/${fileName}` : fileName;
  const fullStorageKey = `${projectId}/${normalizedStoragePath}`;

  const sizeBytes = new TextEncoder().encode(initialContent).length;
  const formattedSize =
    sizeBytes < 1024 ? `${sizeBytes} B` : `${Math.round(sizeBytes / 1024)} KB`;

  let createdFileRow: any = null;

  // 1. Insert into public.files
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('files')
      .insert({
        project_id: projectId,
        name: fileName,
        storage_path: normalizedStoragePath,
        file_size: formattedSize,
        is_confidential: isConfidential,
        sensitivity_level: isConfidential ? 'high' : 'low',
        export_policy: 'restricted',
        uploaded_by: actorId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create file record in database: ${error.message}`);
    }
    createdFileRow = data;

    // 2. Upload initial contents to Supabase Storage
    try {
      const blob = new Blob([initialContent], { type: 'text/plain;charset=utf-8' });
      await supabase.storage
        .from(CODE_STORAGE_BUCKET)
        .upload(fullStorageKey, blob, {
          upsert: true,
          contentType: 'text/plain;charset=utf-8',
        });
    } catch (err) {
      console.warn('[CodeStorage] Initial storage upload notice:', err);
    }
  } else {
    createdFileRow = {
      id: crypto.randomUUID(),
      project_id: projectId,
      name: fileName,
      storage_path: normalizedStoragePath,
      file_size: formattedSize,
      is_confidential: isConfidential,
      sensitivity_level: isConfidential ? 'high' : 'low',
      uploaded_by: actorId,
      created_at: new Date().toISOString(),
    };
  }

  sessionContentCache.set(createdFileRow.id, initialContent);

  // 3. Record creation provenance on SHA-256 Ledger
  try {
    const hash = await computeContentSha256(initialContent);
    await recordLedgerEntryApi({
      project_id: projectId,
      actor_id: actorId,
      action: `Created Code File: ${fileName}`,
      content_payload: `${createdFileRow.id}|${fileName}|${hash}|${new Date().toISOString()}`,
      metadata: {
        file_id: createdFileRow.id,
        file_name: fileName,
        content_hash: hash,
        storage_path: fullStorageKey,
      },
    });
  } catch (ledgerErr) {
    console.warn('[CodeStorage] Ledger provenance note:', ledgerErr);
  }

  return createdFileRow as CodeFile;
}

/**
 * Deletes a code file from public.files and Supabase Storage.
 */
export async function deleteCodeFile(
  file: CodeFile,
  projectId: string,
  actorId: string
): Promise<void> {
  const cleanPath = normalizeStoragePath(file.storage_path || file.name);
  const fullStorageKey = `${projectId}/${cleanPath}`;

  if (isSupabaseConfigured() && supabase) {
    const { error: dbErr } = await supabase
      .from('files')
      .delete()
      .eq('id', file.id);

    if (dbErr) {
      throw new Error(`Failed to delete file from database: ${dbErr.message}`);
    }

    try {
      await supabase.storage
        .from(CODE_STORAGE_BUCKET)
        .remove([fullStorageKey]);
    } catch (err) {
      console.warn('[CodeStorage] Storage delete notice:', err);
    }
  }

  sessionContentCache.delete(file.id);

  // Record deletion on SHA-256 ledger
  try {
    await recordLedgerEntryApi({
      project_id: projectId,
      actor_id: actorId,
      action: `Deleted Code File: ${file.name}`,
      content_payload: `${file.id}|${file.name}|deleted|${new Date().toISOString()}`,
      metadata: {
        file_id: file.id,
        file_name: file.name,
      },
    });
  } catch (err) {
    console.warn('[CodeStorage] Ledger provenance note:', err);
  }
}
