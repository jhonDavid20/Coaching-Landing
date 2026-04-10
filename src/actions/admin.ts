'use server';

import { cookies } from 'next/headers';

export interface SignupDay {
  date: string;  // "YYYY-MM-DD"
  count: number;
}

export interface AdminStats {
  users: {
    total: number;
    newThisWeek: number;
    byRole: Record<string, number>;
  };
  invites: {
    total: number;
    pending: number;
    accepted: number;
    expired: number;
  };
  signupsByDay: SignupDay[];
}

export interface AdminStatsResult {
  success: boolean;
  stats?: AdminStats;
  message?: string;
}

const apiUrl = () => process.env.API_BASE_URL || 'http://localhost:3001';

export async function getAdminStats(): Promise<AdminStatsResult> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token');

    if (!accessToken?.value) {
      return { success: false, message: 'Not authenticated' };
    }

    const response = await fetch(`${apiUrl()}/api/admin/stats`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken.value}` },
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || 'Failed to fetch stats' };
    }

    return { success: true, stats: data.stats };
  } catch (error) {
    console.error('getAdminStats error:', error);
    return { success: false, message: 'Network error' };
  }
}
