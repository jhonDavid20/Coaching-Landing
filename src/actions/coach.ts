'use server';

import { cookies } from 'next/headers';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClientStatus = 'active' | 'trial' | 'inactive';

export interface ClientProfile {
  fitnessGoal?: string;
  weight?: number;
  targetWeight?: number;
  height?: number;
  activityLevel?: string;
  preferredWorkoutTime?: string;
  gymLocation?: string;
  gender?: string;
  phone?: string;
  dateOfBirth?: string;
  timezone?: string;
  medicalConditions?: string[];
  injuries?: string[];
  allergies?: string[];
  dietaryRestrictions?: string[];
  notes?: string;
}

export interface CoachClient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  avatar?: string;
  status: ClientStatus;
  joinedAt: string;
  lastSessionAt?: string;
  nextSessionAt?: string;
  sessionsCompleted: number;
  profile?: ClientProfile;
}

export interface UpcomingSession {
  id: string;
  clientName: string;
  clientAvatar?: string;
  scheduledAt: string;
  durationMinutes: number;
  type: 'trial' | 'regular';
}

export interface CoachStats {
  activeClients: number;
  trialClients: number;
  sessionsThisMonth: number;
  revenueThisMonth: number;
  upcomingSessions: UpcomingSession[];
}

export interface CoachProfileUpdate {
  profileHeadline?: string;
  bio?: string;
  videoIntroUrl?: string;
  specialties?: string[];
  trainingModalities?: string[];
  targetClientTypes?: string[];
  yearsOfExperience?: number;
  certifications?: string[];
  coachingType?: 'online' | 'in_person' | 'hybrid';
  languagesSpoken?: string[];
  instagramHandle?: string;
  websiteUrl?: string;
  timezone?: string;
  sessionDurationMinutes?: number;
  maxClientCapacity?: number;
  acceptingClients?: boolean;
  totalClientsTrained?: number;
  sessionRateUSD?: number;
  trialSessionAvailable?: boolean;
  trialSessionRateUSD?: number;
}

/**
 * Public-facing coach info as seen by a client.
 * Returned by GET /api/coaches/:userId
 */
export interface CoachPublicProfile {
  userId: string;
  coachProfileId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  profileHeadline?: string;
  bio?: string;
  specialties?: string[];
  trainingModalities?: string[];
  yearsOfExperience?: number;
  certifications?: string[];
  coachingType?: 'online' | 'in_person' | 'hybrid';
  sessionRateUSD?: number;
  sessionDurationMinutes?: number;
  trialSessionAvailable?: boolean;
  trialSessionRateUSD?: number;
  acceptingClients?: boolean;
  languagesSpoken?: string[];
  timezone?: string;
  instagramHandle?: string;
  websiteUrl?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const apiUrl = () => process.env.API_BASE_URL || 'http://localhost:3001';

async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('access_token')?.value ?? null;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function getCoachClients(): Promise<{
  success: boolean;
  clients: CoachClient[];
  error?: string;
}> {
  try {
    const token = await getAccessToken();
    if (!token) return { success: false, clients: [], error: 'Not authenticated' };

    const response = await fetch(`${apiUrl()}/api/coaches/me/clients`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { success: false, clients: [], error: err.message ?? 'Failed to load clients' };
    }

    const data = await response.json();
    // Response: { clients: [...], total, page, limit }
    const raw: Record<string, unknown>[] = data.clients ?? data.data ?? [];

    const clients: CoachClient[] = raw.map((u) => {
      // user_profiles may be nested under u.profile or flattened at the root
      const prof = (u.profile ?? u.userProfile ?? u) as Record<string, unknown>;
      return {
        id: String(u.id),
        firstName: String(u.firstName ?? ''),
        lastName: String(u.lastName ?? ''),
        email: String(u.email ?? ''),
        username: String(u.username ?? ''),
        avatar: u.avatar ? String(u.avatar) : undefined,
        // status not in users table — derive from packages or default active
        status: (u.status as CoachClient['status']) ?? 'active',
        joinedAt: String(u.createdAt ?? u.joinedAt ?? new Date().toISOString()),
        lastSessionAt: u.lastSessionAt ? String(u.lastSessionAt) : undefined,
        nextSessionAt: u.nextSessionAt ? String(u.nextSessionAt) : undefined,
        sessionsCompleted: u.sessionsCompleted != null ? Number(u.sessionsCompleted) : 0,
        profile: {
          fitnessGoal: prof.fitnessGoal ? String(prof.fitnessGoal) : undefined,
          weight: prof.weight != null ? Number(prof.weight) : undefined,
          targetWeight: prof.targetWeight != null ? Number(prof.targetWeight) : undefined,
          height: prof.height != null ? Number(prof.height) : undefined,
          activityLevel: prof.activityLevel ? String(prof.activityLevel) : undefined,
          preferredWorkoutTime: prof.preferredWorkoutTime ? String(prof.preferredWorkoutTime) : undefined,
          gymLocation: prof.gymLocation ? String(prof.gymLocation) : undefined,
          gender: prof.gender ? String(prof.gender) : undefined,
          timezone: prof.timezone ? String(prof.timezone) : undefined,
          medicalConditions: Array.isArray(prof.medicalConditions) ? prof.medicalConditions as string[] : [],
          injuries: Array.isArray(prof.injuries) ? prof.injuries as string[] : [],
          allergies: Array.isArray(prof.allergies) ? prof.allergies as string[] : [],
          dietaryRestrictions: Array.isArray(prof.dietaryRestrictions) ? prof.dietaryRestrictions as string[] : [],
          notes: prof.notes ? String(prof.notes) : undefined,
        },
      };
    });

    return { success: true, clients };
  } catch (err) {
    console.error('[coach] getCoachClients error:', err);
    return { success: false, clients: [], error: 'Network error' };
  }
}

/**
 * Fetch a single client's full profile for the authenticated coach.
 * GET /api/coaches/me/clients/:clientId
 */
export async function getClientById(clientId: string): Promise<{
  success: boolean;
  client: CoachClient | null;
  error?: string;
}> {
  try {
    const token = await getAccessToken();
    if (!token) return { success: false, client: null, error: 'Not authenticated' };

    const response = await fetch(`${apiUrl()}/api/coaches/me/clients/${clientId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { success: false, client: null, error: (err as { message?: string }).message ?? 'Client not found' };
    }

    const data = await response.json();
    const u: Record<string, unknown> = data.client ?? data.data ?? data;
    const prof = (u.profile ?? u.userProfile ?? u) as Record<string, unknown>;

    const client: CoachClient = {
      id: String(u.id),
      firstName: String(u.firstName ?? ''),
      lastName: String(u.lastName ?? ''),
      email: String(u.email ?? ''),
      username: String(u.username ?? ''),
      avatar: u.avatar ? String(u.avatar) : undefined,
      status: (u.status as CoachClient['status']) ?? 'active',
      joinedAt: String(u.createdAt ?? u.joinedAt ?? new Date().toISOString()),
      lastSessionAt: u.lastSessionAt ? String(u.lastSessionAt) : undefined,
      nextSessionAt: u.nextSessionAt ? String(u.nextSessionAt) : undefined,
      sessionsCompleted: u.sessionsCompleted != null ? Number(u.sessionsCompleted) : 0,
      profile: {
        fitnessGoal: prof.fitnessGoal ? String(prof.fitnessGoal) : undefined,
        weight: prof.weight != null ? Number(prof.weight) : undefined,
        targetWeight: prof.targetWeight != null ? Number(prof.targetWeight) : undefined,
        height: prof.height != null ? Number(prof.height) : undefined,
        activityLevel: prof.activityLevel ? String(prof.activityLevel) : undefined,
        preferredWorkoutTime: prof.preferredWorkoutTime ? String(prof.preferredWorkoutTime) : undefined,
        gymLocation: prof.gymLocation ? String(prof.gymLocation) : undefined,
        gender: prof.gender ? String(prof.gender) : undefined,
        timezone: prof.timezone ? String(prof.timezone) : undefined,
        medicalConditions: Array.isArray(prof.medicalConditions) ? prof.medicalConditions as string[] : [],
        injuries: Array.isArray(prof.injuries) ? prof.injuries as string[] : [],
        allergies: Array.isArray(prof.allergies) ? prof.allergies as string[] : [],
        dietaryRestrictions: Array.isArray(prof.dietaryRestrictions) ? prof.dietaryRestrictions as string[] : [],
        notes: prof.notes ? String(prof.notes) : undefined,
      },
    };

    return { success: true, client };
  } catch (err) {
    console.error('[coach] getClientById error:', err);
    return { success: false, client: null, error: 'Network error' };
  }
}

export async function getCoachStats(): Promise<{
  success: boolean;
  stats?: CoachStats;
  error?: string;
}> {
  try {
    const token = await getAccessToken();
    if (!token) return { success: false, error: 'Not authenticated' };

    const response = await fetch(`${apiUrl()}/api/coaches/me/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!response.ok) return { success: false, error: 'Failed to load stats' };

    const data = await response.json();
    return { success: true, stats: data.stats ?? data };
  } catch {
    return { success: false, error: 'Network error. Check that the API server is running.' };
  }
}

// ─── Client invite actions ────────────────────────────────────────────────────

export async function createClientInvite(
  email: string
): Promise<{ success: boolean; message: string; token?: string; inviteUrl?: string }> {
  try {
    const token = await getAccessToken();
    if (!token) return { success: false, message: 'Not authenticated' };

    const response = await fetch(`${apiUrl()}/api/invites/client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || 'Failed to create invite' };
    }

    return {
      success: true,
      message: data.message || 'Invite created',
      token: data.token ?? data.invite?.token,
      inviteUrl: data.inviteUrl,
    };
  } catch (error) {
    console.error('[coach] createClientInvite error:', error);
    return { success: false, message: 'Network error. Check that the API server is running.' };
  }
}

// ─── Connection request actions (marketplace) ─────────────────────────────────

export interface ConnectionRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  requestedAt: string;
  status: 'pending' | 'accepted' | 'declined';
  clientProfile?: {
    fitnessGoal?: string;
    weight?: number;
    height?: number;
    activityLevel?: string;
  };
}

export async function getConnectionRequests(): Promise<{
  success: boolean;
  requests: ConnectionRequest[];
}> {
  try {
    const token = await getAccessToken();
    if (!token) return { success: false, requests: [] };

    const response = await fetch(`${apiUrl()}/api/coaches/me/connection-requests`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!response.ok) return { success: false, requests: [] };

    const data = await response.json();
    return { success: true, requests: data.requests ?? [] };
  } catch {
    return { success: false, requests: [] };
  }
}

export async function respondToConnectionRequest(
  requestId: string,
  action: 'accept' | 'decline'
): Promise<{ success: boolean; message: string }> {
  try {
    const token = await getAccessToken();
    if (!token) return { success: false, message: 'Not authenticated' };

    const response = await fetch(
      `${apiUrl()}/api/coaches/me/connection-requests/${requestId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
        cache: 'no-store',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || 'Failed to respond to request' };
    }

    return { success: true, message: data.message || 'Done' };
  } catch (error) {
    console.error('respondToConnectionRequest error:', error);
    return { success: false, message: 'Network error. Check that the API server is running.' };
  }
}

// ─── Coach own profile ────────────────────────────────────────────────────────

export async function getCoachOwnProfile(): Promise<{
  success: boolean;
  profile: CoachProfileUpdate | null;
  coachProfileId?: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return { success: false, profile: null };

    // Pull userId from session so we can fall back to /api/coaches/:userId
    // if the /me shortcut doesn't exist on this backend.
    let userId: string | undefined;
    try {
      const raw = cookieStore.get('user_data')?.value;
      if (raw) userId = (JSON.parse(raw) as { id?: string }).id;
    } catch { /* ignore */ }

    // Try /api/coaches/me first, then /api/coaches/:userId
    const endpoints = [
      `${apiUrl()}/api/coaches/me`,
      ...(userId ? [`${apiUrl()}/api/coaches/${userId}`] : []),
    ];

    let data: Record<string, unknown> | null = null;
    for (const url of endpoints) {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) { data = await res.json(); break; }
    }

    if (!data) return { success: true, profile: null };

    // Extract the CoachProfile.id (distinct from user ID) — needed for package endpoints.
    const rawData = (data.data ?? data.profile ?? data.coachProfile ?? data) as Record<string, unknown>;
    // Prefer explicit coachProfileId field, then snake_case variant,
    // then fall back to rawData.id (the coach_profiles PK when the response is a bare profile row)
    const coachProfileId = rawData.coachProfileId != null
      ? String(rawData.coachProfileId)
      : rawData.coach_profile_id != null
        ? String(rawData.coach_profile_id)
        : rawData.id != null
          ? String(rawData.id)
          : undefined;

    // Backend may return the profile at top level, or nested under common wrapper keys.
    // GET /api/coaches/:id returns { id, userId, bio, ... } (profile row at top level)
    // but some responses wrap it under data / profile / coachProfile.
    const p = (
      (data.data          as Record<string, unknown>) ??
      (data.profile       as Record<string, unknown>) ??
      (data.coachProfile  as Record<string, unknown>) ??
      data
    );

    // Resolve a value by camelCase OR snake_case key
    const f = (camel: string, snake: string): unknown =>
      p[camel] != null ? p[camel] : p[snake];

    // Coerce to string array — handles parsed arrays and JSON-encoded strings
    const toArr = (v: unknown): string[] => {
      if (Array.isArray(v)) return v.map(String);
      if (typeof v === 'string' && v.trimStart().startsWith('[')) {
        try { return JSON.parse(v) as string[]; } catch { /* fall through */ }
      }
      return [];
    };

    const str = (v: unknown) => (v != null && v !== '' ? String(v) : undefined);
    const num = (v: unknown) => (v != null && v !== '' && !isNaN(Number(v)) ? Number(v) : undefined);
    const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);

    return {
      success: true,
      coachProfileId,
      profile: {
        profileHeadline:        str(f('profileHeadline',        'profile_headline')),
        bio:                    str(f('bio',                    'bio')),
        videoIntroUrl:          str(f('videoIntroUrl',          'video_intro_url')),
        websiteUrl:             str(f('websiteUrl',             'website_url')),
        instagramHandle:        str(f('instagramHandle',        'instagram_handle')),
        specialties:            toArr(f('specialties',          'specialties')),
        trainingModalities:     toArr(f('trainingModalities',   'training_modalities')),
        targetClientTypes:      toArr(f('targetClientTypes',    'target_client_types')),
        certifications:         toArr(f('certifications',       'certifications')),
        languagesSpoken:        toArr(f('languagesSpoken',      'languages_spoken')),
        yearsOfExperience:      num(f('yearsOfExperience',      'years_of_experience')),
        coachingType:           (f('coachingType', 'coaching_type') as CoachProfileUpdate['coachingType']) ?? 'online',
        timezone:               str(f('timezone',               'timezone')),
        sessionDurationMinutes: num(f('sessionDurationMinutes', 'session_duration_minutes')) ?? 60,
        maxClientCapacity:      num(f('maxClientCapacity',      'max_client_capacity')),
        acceptingClients:       bool(f('acceptingClients',      'accepting_clients'), true),
        sessionRateUSD:         num(f('sessionRateUSD',         'session_rate_usd')),
        trialSessionAvailable:  bool(f('trialSessionAvailable', 'trial_session_available'), false),
        trialSessionRateUSD:    num(f('trialSessionRateUSD',    'trial_session_rate_usd')),
        totalClientsTrained:    num(f('totalClientsTrained',    'total_clients_trained')),
      },
    };
  } catch {
    return { success: false, profile: null };
  }
}

export async function updateCoachProfile(
  payload: CoachProfileUpdate
): Promise<{ success: boolean; message: string }> {
  try {
    const token = await getAccessToken();
    if (!token) return { success: false, message: 'Not authenticated' };

    // The backend treats [] as "no change" and null as "clear this field".
    // On the edit page an empty array means the coach explicitly cleared it,
    // so convert [] → null for all array fields before sending.
    const ARRAY_FIELDS: (keyof CoachProfileUpdate)[] = [
      'specialties', 'trainingModalities', 'targetClientTypes',
      'certifications', 'languagesSpoken',
    ];
    const body: Record<string, unknown> = { ...payload };
    for (const key of ARRAY_FIELDS) {
      if (Array.isArray(body[key]) && (body[key] as string[]).length === 0) {
        body[key] = null;
      }
    }

    const response = await fetch(`${apiUrl()}/api/auth/coach/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      if (Array.isArray(data.details) && data.details.length > 0) {
        const first = data.details[0];
        const msg =
          typeof first === 'object' && first !== null
            ? `${first.path ?? first.param ?? 'field'}: ${first.msg ?? first.message}`
            : String(first);
        return { success: false, message: msg };
      }
      return { success: false, message: data.message || 'Failed to update profile' };
    }

    return { success: true, message: data.message || 'Profile updated successfully' };
  } catch (error) {
    console.error('updateCoachProfile error:', error);
    return { success: false, message: 'Network error. Check that the API server is running.' };
  }
}


/**
 * Fetch a coach's public profile by their User ID.
 * Used by clients to see their assigned coach's info.
 * Calls GET /api/coaches/:userId — no auth token required (public endpoint).
 */
export async function getCoachProfileById(
  coachUserId: string
): Promise<{ success: boolean; coach: CoachPublicProfile | null; message?: string }> {
  try {
    const response = await fetch(`${apiUrl()}/api/coaches/${coachUserId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, coach: null, message: data.message || 'Failed to fetch coach profile' };
    }

    // Unwrap: { success, data: { ... } } or { success, coach: { ... } } or bare object
    const raw: Record<string, unknown> = data.data ?? data.coach ?? data.coachProfile ?? data;

    const rawUser = raw.user as Record<string, unknown> | undefined;
    const coach: CoachPublicProfile = {
      userId: coachUserId,
      coachProfileId: raw.coachProfileId != null ? String(raw.coachProfileId) : raw.id != null ? String(raw.id) : undefined,
      firstName: raw.firstName != null ? String(raw.firstName) : rawUser?.firstName != null ? String(rawUser.firstName) : undefined,
      lastName: raw.lastName != null ? String(raw.lastName) : rawUser?.lastName != null ? String(rawUser.lastName) : undefined,
      email: raw.email != null ? String(raw.email) : rawUser?.email != null ? String(rawUser.email) : undefined,
      avatar: rawUser?.avatar != null ? String(rawUser.avatar) : raw.avatar != null ? String(raw.avatar) : undefined,
      profileHeadline: raw.profileHeadline != null ? String(raw.profileHeadline) : undefined,
      bio: raw.bio != null ? String(raw.bio) : undefined,
      specialties: Array.isArray(raw.specialties) ? (raw.specialties as string[]) : undefined,
      trainingModalities: Array.isArray(raw.trainingModalities) ? (raw.trainingModalities as string[]) : undefined,
      yearsOfExperience: raw.yearsOfExperience != null ? Number(raw.yearsOfExperience) : undefined,
      certifications: Array.isArray(raw.certifications) ? (raw.certifications as string[]) : undefined,
      coachingType: raw.coachingType as CoachPublicProfile['coachingType'],
      sessionRateUSD: raw.sessionRateUSD != null ? Number(raw.sessionRateUSD) : undefined,
      trialSessionAvailable: raw.trialSessionAvailable != null ? Boolean(raw.trialSessionAvailable) : undefined,
      trialSessionRateUSD: raw.trialSessionRateUSD != null ? Number(raw.trialSessionRateUSD) : undefined,
      acceptingClients: raw.acceptingClients != null ? Boolean(raw.acceptingClients) : undefined,
      languagesSpoken: Array.isArray(raw.languagesSpoken) ? (raw.languagesSpoken as string[]) : undefined,
      instagramHandle: raw.instagramHandle != null ? String(raw.instagramHandle) : undefined,
      websiteUrl: raw.websiteUrl != null ? String(raw.websiteUrl) : undefined,
    };

    return { success: true, coach };
  } catch (error) {
    console.error('[coach] getCoachProfileById error:', error);
    return { success: false, coach: null, message: 'Network error' };
  }
}


