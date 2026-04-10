'use server';

import { cookies } from 'next/headers';

export type CoachingType = 'online' | 'in_person' | 'hybrid';

export interface CoachOnboardingPayload {
  // Step 1 — Story
  profileHeadline: string;
  bio: string;
  videoIntroUrl?: string;

  // Step 2 — Expertise
  specialties: string[];
  trainingModalities: string[];
  targetClientTypes: string[];
  yearsOfExperience: number;
  certifications: string[];

  // Step 3 — Coaching style
  coachingType: CoachingType;
  languagesSpoken: string[];
  instagramHandle?: string;
  websiteUrl?: string;

  // Step 4 — Availability
  timezone: string;
  sessionDurationMinutes: number;
  maxClientCapacity: number;
  acceptingClients: boolean;
  totalClientsTrained?: number;

  // Step 5 — Pricing
  sessionRateUSD: number;
  trialSessionAvailable: boolean;
  trialSessionRateUSD?: number;
}

const apiUrl = () => process.env.API_BASE_URL || 'http://localhost:3001';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60,
  path: '/',
};

export async function completeCoachOnboarding(
  payload: CoachOnboardingPayload
): Promise<{ success: boolean; message: string }> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token');

    if (!accessToken?.value) {
      return { success: false, message: 'Not authenticated' };
    }

    const response = await fetch(`${apiUrl()}/api/auth/coach/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken.value}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      // Surface express-validator details[] if present, otherwise fall back to message
      if (Array.isArray(data.details) && data.details.length > 0) {
        const firstDetail = data.details[0];
        const fieldMsg =
          typeof firstDetail === 'object' && firstDetail !== null
            ? `${firstDetail.path ?? firstDetail.param ?? 'field'}: ${firstDetail.msg ?? firstDetail.message}`
            : String(firstDetail);
        return { success: false, message: fieldMsg };
      }
      return { success: false, message: data.message || 'Failed to complete onboarding' };
    }

    // Use the authoritative user object returned by the backend to update the
    // user_data cookie — this ensures hasCompletedOnboarding (and any other
    // server-side changes) are reflected immediately without waiting for
    // token refresh.
    if (data.user) {
      cookieStore.set('user_data', JSON.stringify(data.user), COOKIE_OPTS);
    } else {
      // Fallback: manually flip the flag if the response didn't include user
      const existing = cookieStore.get('user_data');
      if (existing?.value) {
        try {
          const parsed = JSON.parse(existing.value);
          cookieStore.set(
            'user_data',
            JSON.stringify({ ...parsed, hasCompletedOnboarding: true }),
            COOKIE_OPTS,
          );
        } catch {
          // malformed cookie — backend already flipped the flag server-side
        }
      }
    }

    return { success: true, message: data.message || 'Coach profile created successfully' };
  } catch (error) {
    console.error('completeCoachOnboarding error:', error);
    return { success: false, message: 'Network error. Check that the API server is running.' };
  }
}
