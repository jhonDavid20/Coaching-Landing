'use server';

import { apiClient, OnboardingData } from '@/lib/api-client';
import { cookies } from 'next/headers';

// Internal form shape produced by the onboarding page
export interface OnboardingFormInput {
  fitnessGoal: 'lose_weight' | 'gain_muscle' | 'maintain' | 'endurance';
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
  birthDate: string;
  gender: 'male' | 'female' | 'prefer_not_to_say' | 'other';
  height: number;
  currentWeight: number;
  targetWeight?: number;
  medicalConditions?: string[];
  injuries?: string[];
  medications?: string;
  foodAllergies?: string[];
  preferredSchedule: 'morning' | 'afternoon' | 'evening' | 'flexible';
  gymLocation?: string;
  timezone: string;
  phone?: string;
}

const GOAL_MAP: Record<OnboardingFormInput['fitnessGoal'], OnboardingData['fitnessGoal']> = {
  lose_weight: 'weight_loss',
  gain_muscle: 'muscle_gain',
  maintain: 'maintenance',
  endurance: 'endurance',
};

export async function completeOnboarding(
  data: OnboardingFormInput
): Promise<{ success: boolean; message: string }> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token');

    if (!accessToken?.value) {
      return { success: false, message: 'Not authenticated' };
    }

    // Map internal form field names → backend expected field names
    const payload: OnboardingData = {
      fitnessGoal: GOAL_MAP[data.fitnessGoal],
      activityLevel: data.activityLevel,
      dateOfBirth: data.birthDate,
      gender: data.gender,
      height: data.height,
      weight: data.currentWeight,
      medicalConditions: data.medicalConditions ?? [],
      injuries: data.injuries ?? [],
      medications: data.medications?.trim() ? [data.medications.trim()] : [],
      allergies: data.foodAllergies ?? [],
      preferredWorkoutTime: data.preferredSchedule,
      timezone: data.timezone,
    };

    // Optional numeric field — omit if NaN or missing
    if (data.targetWeight != null && !Number.isNaN(data.targetWeight)) {
      payload.targetWeight = data.targetWeight;
    }
    if (data.gymLocation?.trim()) payload.gymLocation = data.gymLocation.trim();
    if (data.phone?.trim()) payload.phone = data.phone.trim();

    const COOKIE_OPTS = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    };

    const response = await apiClient.completeOnboarding(accessToken.value, payload);

    if (response.success) {
      // Use the returned user object if available; otherwise patch the existing cookie
      const updatedUser = response.user ?? (() => {
        try {
          return JSON.parse(cookieStore.get('user_data')?.value ?? '{}');
        } catch {
          return {};
        }
      })();

      cookieStore.set('user_data', JSON.stringify({ ...updatedUser, hasCompletedOnboarding: true }), COOKIE_OPTS);
    }

    return { success: response.success, message: response.message };
  } catch (error) {
    console.error('completeOnboarding action error:', error);
    return { success: false, message: 'Failed to complete onboarding' };
  }
}
