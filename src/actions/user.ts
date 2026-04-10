'use server';

import { cookies } from 'next/headers';

export interface UserProfile {
  id?: string;
  userId?: string;
  gender?: string;
  dateOfBirth?: string;
  height?: number;
  weight?: number;
  targetWeight?: number;
  phone?: string;
  activityLevel?: string;
  fitnessGoal?: string;
  medicalConditions?: string[];
  medications?: string[];
  injuries?: string[];
  allergies?: string[];
  dietaryRestrictions?: string[];
  preferredWorkoutTime?: string;
  gymLocation?: string;
  timezone?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserWithProfile {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'client' | 'coach' | 'admin';
  isEmailVerified: boolean;
  hasCompletedOnboarding: boolean;
  /** ID of the User record of the assigned coach (source of truth: users.coachId) */
  coachId?: string;
  profile: UserProfile;
}

export async function updateProfileFields(
  data: Partial<Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<{ success: boolean; message: string }> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token');
    if (!accessToken?.value) return { success: false, message: 'Not authenticated' };

    const apiUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/users/me/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken.value}`,
      },
      body: JSON.stringify(data),
      cache: 'no-store',
    });

    const result = await response.json();
    return {
      success: response.ok,
      message: result.message || (response.ok ? 'Perfil actualizado' : 'Error al actualizar'),
    };
  } catch (error) {
    console.error('updateProfileFields error:', error);
    return { success: false, message: 'Error al actualizar el perfil' };
  }
}

export async function getFullUserProfile(): Promise<UserWithProfile | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token');

    if (!accessToken?.value) return null;

    const apiUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/users/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.user ?? data ?? null;
  } catch (error) {
    console.error('getFullUserProfile error:', error);
    return null;
  }
}
