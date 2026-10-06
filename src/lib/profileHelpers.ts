/**
 * Profile helpers for safe display_name derivation and profile mutation sanitation.
 * Guarantees that PostgreSQL NOT NULL constraints (e.g. display_name) are never violated
 * across Google OAuth, email/password, new accounts, and existing profiles.
 */

export interface AuthUserLike {
  id?: string;
  email?: string | null;
  user_metadata?: Record<string, any> | null;
}

export interface ProfileLike {
  id?: string;
  email?: string | null;
  display_name?: string | null;
  role?: string | null;
  avatar_url?: string | null;
}

export interface AppUserLike {
  id?: string;
  email?: string | null;
  display_name?: string | null;
  role?: string | null;
}

/**
 * Derives a valid, non-empty display name safely for any user:
 * 1. Explicit non-empty candidate name
 * 2. Existing profile's display_name (if non-empty)
 * 3. AppUser display_name (if non-empty and not generic 'User')
 * 4. Supabase auth user metadata: full_name -> name -> display_name -> preferred_username
 * 5. Email prefix from auth user or profile (e.g. "kavya" from "kavya@gmail.com")
 * 6. AppUser display_name fallback
 * 7. Guaranteed fallback string "Researcher"
 */
export function getSafeDisplayName(
  authUser?: AuthUserLike | null,
  existingProfile?: ProfileLike | null,
  appUser?: AppUserLike | null,
  candidateName?: string | null
): string {
  // 1. Explicit candidate name if provided and non-empty
  if (candidateName && typeof candidateName === 'string' && candidateName.trim()) {
    return candidateName.trim();
  }

  // 2. Existing profile's display_name
  if (existingProfile?.display_name && typeof existingProfile.display_name === 'string' && existingProfile.display_name.trim()) {
    return existingProfile.display_name.trim();
  }

  // 3. AppUser display_name if not generic placeholder
  if (appUser?.display_name && typeof appUser.display_name === 'string' && appUser.display_name.trim() && appUser.display_name.trim() !== 'User') {
    return appUser.display_name.trim();
  }

  // 4. Supabase auth user_metadata (Google OAuth returns full_name, name, picture)
  const meta = authUser?.user_metadata;
  if (meta && typeof meta === 'object') {
    if (meta.full_name && typeof meta.full_name === 'string' && meta.full_name.trim()) {
      return meta.full_name.trim();
    }
    if (meta.name && typeof meta.name === 'string' && meta.name.trim()) {
      return meta.name.trim();
    }
    if (meta.display_name && typeof meta.display_name === 'string' && meta.display_name.trim()) {
      return meta.display_name.trim();
    }
    if (meta.preferred_username && typeof meta.preferred_username === 'string' && meta.preferred_username.trim()) {
      return meta.preferred_username.trim();
    }
  }

  // 5. Email prefix
  const email = authUser?.email || appUser?.email || existingProfile?.email;
  if (email && typeof email === 'string' && email.includes('@')) {
    const prefix = email.split('@')[0].trim();
    if (prefix) return prefix;
  }

  // 6. AppUser display_name fallback
  if (appUser?.display_name && typeof appUser.display_name === 'string' && appUser.display_name.trim()) {
    return appUser.display_name.trim();
  }

  // 7. Guaranteed final fallback
  return 'Researcher';
}

/**
 * Derives avatar URL safely from metadata, profile, or candidate.
 */
export function getSafeAvatarUrl(
  authUser?: AuthUserLike | null,
  existingProfile?: ProfileLike | null,
  candidateUrl?: string | null
): string | null {
  if (candidateUrl && typeof candidateUrl === 'string' && candidateUrl.trim()) {
    return candidateUrl.trim();
  }
  if (existingProfile?.avatar_url && typeof existingProfile.avatar_url === 'string' && existingProfile.avatar_url.trim()) {
    return existingProfile.avatar_url.trim();
  }
  const meta = authUser?.user_metadata;
  if (meta && typeof meta === 'object') {
    if (meta.avatar_url && typeof meta.avatar_url === 'string' && meta.avatar_url.trim()) {
      return meta.avatar_url.trim();
    }
    if (meta.picture && typeof meta.picture === 'string' && meta.picture.trim()) {
      return meta.picture.trim();
    }
  }
  return null;
}
