'use server';

import { cookies } from 'next/headers';

// ── Admin User Management ──────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: 'admin' | 'coach' | 'client' | string;
  isActive: boolean;
  avatar?: string;
  createdAt: string;
}

export interface AdminUsersResult {
  success: boolean;
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
  error?: string;
}

export interface AdminUserActionResult {
  success: boolean;
  message?: string;
}

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

// ── Get paginated user list ────────────────────────────────────────────────

export async function getAdminUsers(opts: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: 'active' | 'locked' | '';
} = {}): Promise<AdminUsersResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return { success: false, users: [], total: 0, page: 1, totalPages: 1, error: 'Not authenticated' };

    const { page = 1, limit = 20, search = '', role = '', status = '' } = opts;
    const qs = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(search ? { search } : {}),
      ...(role   ? { role }   : {}),
      ...(status ? { status } : {}),
    });

    const res = await fetch(`${apiUrl()}/api/admin/users?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, users: [], total: 0, page: 1, totalPages: 1, error: (err as { message?: string }).message ?? 'Failed to load users' };
    }

    const data = await res.json();
    // Normalise: backend may return { users, total, page, totalPages } or { data, meta }
    const raw: Record<string, unknown>[] = data.users ?? data.data ?? [];
    const total: number = data.total ?? data.meta?.total ?? raw.length;
    const totalPages: number = data.totalPages ?? data.meta?.totalPages ?? Math.ceil(total / limit);

    const users: AdminUser[] = raw.map((u) => ({
      id: String(u.id),
      firstName: String(u.firstName ?? ''),
      lastName: String(u.lastName ?? ''),
      email: String(u.email ?? ''),
      username: String(u.username ?? ''),
      role: String(u.role ?? 'client'),
      isActive: u.isActive !== false, // default true if missing
      avatar: u.avatar ? String(u.avatar) : undefined,
      createdAt: String(u.createdAt ?? u.joinedAt ?? new Date().toISOString()),
    }));

    return { success: true, users, total, page, totalPages };
  } catch (err) {
    console.error('[admin] getAdminUsers error:', err);
    return { success: false, users: [], total: 0, page: 1, totalPages: 1, error: 'Network error' };
  }
}

// ── Lock a user ───────────────────────────────────────────────────────────

export async function lockUser(userId: string): Promise<AdminUserActionResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return { success: false, message: 'Not authenticated' };

    const res = await fetch(`${apiUrl()}/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    });

    const data = await res.json().catch(() => ({}));
    return res.ok
      ? { success: true }
      : { success: false, message: (data as { message?: string }).message ?? 'Failed to lock user' };
  } catch (err) {
    console.error('[admin] lockUser error:', err);
    return { success: false, message: 'Network error' };
  }
}

// ── Unlock a user ─────────────────────────────────────────────────────────

export async function unlockUser(userId: string): Promise<AdminUserActionResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return { success: false, message: 'Not authenticated' };

    const res = await fetch(`${apiUrl()}/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true }),
    });

    const data = await res.json().catch(() => ({}));
    return res.ok
      ? { success: true }
      : { success: false, message: (data as { message?: string }).message ?? 'Failed to unlock user' };
  } catch (err) {
    console.error('[admin] unlockUser error:', err);
    return { success: false, message: 'Network error' };
  }
}

// ── Remove a user's avatar ────────────────────────────────────────────────

export async function removeUserAvatar(userId: string): Promise<AdminUserActionResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return { success: false, message: 'Not authenticated' };

    const res = await fetch(`${apiUrl()}/api/admin/users/${userId}/avatar`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => ({}));
    return res.ok
      ? { success: true }
      : { success: false, message: (data as { message?: string }).message ?? 'Failed to remove avatar' };
  } catch (err) {
    console.error('[admin] removeUserAvatar error:', err);
    return { success: false, message: 'Network error' };
  }
}
