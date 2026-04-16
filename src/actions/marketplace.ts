'use server';

import { cookies } from 'next/headers';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MarketplaceCoach {
  id: string;           // coach's User ID — used for connection requests
  coachProfileId?: string; // coach_profiles.id — used for package lookups
  firstName: string;
  lastName: string;
  email?: string;
  avatar?: string;
  profile: {
    profileHeadline?: string;
    bio?: string;
    specialties?: string[];
    trainingModalities?: string[];
    targetClientTypes?: string[];
    coachingType?: 'online' | 'in_person' | 'hybrid';
    languagesSpoken?: string[];
    yearsOfExperience?: number;
    sessionRateUSD?: number;
    trialSessionAvailable?: boolean;
    trialSessionRateUSD?: number;
    sessionDurationMinutes?: number;
    maxClientCapacity?: number;
    instagramHandle?: string;
    websiteUrl?: string;
    videoIntroUrl?: string;
    totalClientsTrained?: number;
    certifications?: string[];
    timezone?: string;
  };
  activeClientsCount?: number;
}

export type ConnectionStatus = 'none' | 'pending' | 'connected';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const apiUrl = () => process.env.API_BASE_URL || 'http://localhost:3001';

async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('access_token')?.value ?? null;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function getCoachMarketplace(): Promise<{
  success: boolean;
  coaches: MarketplaceCoach[];
}> {
  try {
    const token = await getAccessToken();

    const response = await fetch(`${apiUrl()}/api/coaches`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });

    if (!response.ok) {
      return { success: false, coaches: [] };
    }

    const data = await response.json();
    const raw: unknown[] = data.coaches ?? data ?? [];
    const coaches = raw.map(normalizeCoach);
    return { success: true, coaches };
  } catch {
    return { success: false, coaches: [] };
  }
}

// ─── Normalizer ────────────────────────────────────────────────────────────────
// The backend queries coach_profiles as the PRIMARY table and JOINs users.
// TypeORM hydrates this as:
//   {
//     id, userId, bio, specialties, profileHeadline, ...  ← profile fields at top level
//     user: { id, firstName, lastName, email, ... }       ← user data nested
//   }
// Profile fields are directly on the object; user identity is nested under `user`.

function normalizeCoach(raw: unknown): MarketplaceCoach {
  const c = raw as Record<string, unknown>;

  // User identity: prefer nested `user` relation, fall back to top-level fields
  const u = (c.user as Record<string, unknown> | undefined) ?? {};
  const firstName = String(u.firstName ?? u.first_name ?? c.firstName ?? c.first_name ?? '');
  const lastName  = String(u.lastName  ?? u.last_name  ?? c.lastName  ?? c.last_name  ?? '');
  const email     = str(u.email ?? c.email);

  // Profile fields: the coach_profiles row IS the top-level object.
  // Also support a nested `profile` / `coachProfile` in case the endpoint shape changes.
  const nested =
    (c.coachProfile as Record<string, unknown> | undefined) ??
    (c.profile      as Record<string, unknown> | undefined) ??
    null;

  // If there's a nested profile object use it; otherwise fall back to top-level `c`
  const p: Record<string, unknown> = nested ?? c;

  // Use the user's id as the canonical coach identifier for connection requests,
  // falling back to the profile id.
  const id = String(u.id ?? c.userId ?? c.user_id ?? c.id ?? '');

  // coachProfileId is the coach_profiles.id — needed to fetch their packages.
  // When the response is a coach_profiles row, c.id IS the profile id.
  // When there's a nested user, c.id is the profile id and u.id is the user id.
  const coachProfileId = u.id
    ? str(c.id)              // nested user → c.id is coach_profiles.id
    : str(c.coachProfileId ?? c.coach_profile_id); // flat response

  // Avatar lives on the user record — check nested user first, then top-level
  const avatar = str(u.avatar ?? c.avatar);

  return {
    id,
    coachProfileId,
    firstName,
    lastName,
    email,
    avatar,
    activeClientsCount: typeof c.activeClientsCount === 'number' ? c.activeClientsCount : undefined,
    profile: {
      profileHeadline:      str(p.profileHeadline ?? p.profile_headline),
      bio:                  str(p.bio),
      specialties:          strArr(p.specialties),
      trainingModalities:   strArr(p.trainingModalities ?? p.training_modalities),
      targetClientTypes:    strArr(p.targetClientTypes  ?? p.target_client_types),
      coachingType:         (p.coachingType ?? p.coaching_type) as MarketplaceCoach['profile']['coachingType'],
      languagesSpoken:      strArr(p.languagesSpoken    ?? p.languages_spoken),
      yearsOfExperience:    num(p.yearsOfExperience     ?? p.years_of_experience),
      sessionRateUSD:       num(p.sessionRateUSD        ?? p.session_rate_usd),
      trialSessionAvailable:bool(p.trialSessionAvailable ?? p.trial_session_available),
      trialSessionRateUSD:  num(p.trialSessionRateUSD   ?? p.trial_session_rate_usd),
      sessionDurationMinutes:num(p.sessionDurationMinutes ?? p.session_duration_minutes),
      maxClientCapacity:    num(p.maxClientCapacity      ?? p.max_client_capacity),
      instagramHandle:      str(p.instagramHandle        ?? p.instagram_handle),
      websiteUrl:           str(p.websiteUrl             ?? p.website_url),
      videoIntroUrl:        str(p.videoIntroUrl          ?? p.video_intro_url),
      totalClientsTrained:  num(p.totalClientsTrained    ?? p.total_clients_trained),
      certifications:       strArr(p.certifications),
      timezone:             str(p.timezone),
    },
  };
}

function str(v: unknown): string | undefined {
  return v != null && v !== '' ? String(v) : undefined;
}

function num(v: unknown): number | undefined {
  const n = Number(v);
  return v != null && !isNaN(n) ? n : undefined;
}

function bool(v: unknown): boolean | undefined {
  return v != null ? Boolean(v) : undefined;
}

function strArr(v: unknown): string[] | undefined {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string' && v.length > 0) {
    try { return JSON.parse(v); } catch { return [v]; }
  }
  return undefined;
}

export async function requestCoachConnection(coachId: string): Promise<{
  success: boolean;
  message: string;
  errorCode?: string;
}> {
  try {
    const token = await getAccessToken();
    if (!token) return { success: false, message: 'Not authenticated' };

    const response = await fetch(`${apiUrl()}/api/coaches/connection-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ coachId }),
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to send request',
        errorCode: data.errorCode,
      };
    }

    return { success: true, message: data.message || 'Request sent' };
  } catch (error) {
    console.error('requestCoachConnection error:', error);
    return { success: false, message: 'Network error. Check that the API server is running.' };
  }
}

// ─── Client: get current coach ────────────────────────────────────────────────

export async function getMyCoach(): Promise<{
  hasCoach: boolean;
  coach?: MarketplaceCoach;
}> {
  try {
    const token = await getAccessToken();
    if (!token) return { hasCoach: false };

    // ── Primary check: GET /api/users/me ──────────────────────────────────────
    // users.coachId is the authoritative source of truth for coach assignment.
    // If it's set, the user already has (or is pending) a coach — no need to
    // show "Request to connect".
    const meRes = await fetch(`${apiUrl()}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (meRes.ok) {
      const meData = await meRes.json();
      const user = meData?.user ?? meData;
      if (user?.coachId) {
        // User has a coach assigned — try to fetch the coach's details too
        const coachRes = await fetch(`${apiUrl()}/api/clients/me/coach`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (coachRes.ok) {
          const coachData = await coachRes.json();
          if (coachData?.coach || coachData?.id) {
            return { hasCoach: true, coach: normalizeCoach(coachData.coach ?? coachData) };
          }
        }
        // coachId is set but couldn't fetch details — still mark as having a coach
        return { hasCoach: true };
      }
    }

    // ── Fallback: check /api/clients/me/coach directly ────────────────────────
    const coachRes = await fetch(`${apiUrl()}/api/clients/me/coach`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (coachRes.ok) {
      const data = await coachRes.json();
      if (data?.coach || data?.id) {
        return { hasCoach: true, coach: normalizeCoach(data.coach ?? data) };
      }
    }

    return { hasCoach: false };
  } catch {
    return { hasCoach: false };
  }
}
