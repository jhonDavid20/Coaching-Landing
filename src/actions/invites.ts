'use server';

import { cookies } from 'next/headers';

export interface Invite {
  id: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
  expiresAt: string;
  createdBy?: { id: string; email: string; firstName: string; lastName: string };
}

export interface InviteListResult {
  success: boolean;
  invites?: Invite[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface CreateInviteResult {
  success: boolean;
  message: string;
  invite?: Invite;
}

export interface ValidateInviteResult {
  success: boolean;
  message?: string;
  invite?: {
    id: string;
    email: string;
    token: string;
    status: string;
    expiresAt: string;
  };
}

const apiUrl = () => process.env.API_BASE_URL || 'http://localhost:3001';

/** Admin: create an invite for a given email address */
export async function createInvite(email: string): Promise<CreateInviteResult> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token');

    if (!accessToken?.value) {
      return { success: false, message: 'Not authenticated' };
    }

    const response = await fetch(`${apiUrl()}/api/invites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken.value}`,
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
      message: data.message || 'Invite created successfully',
      invite: data.invite ?? data,
    };
  } catch (error) {
    console.error('createInvite error:', error);
    return { success: false, message: 'Network error' };
  }
}

/** Admin: list all invites (paginated) */
export async function listInvites(page = 1, limit = 20): Promise<InviteListResult> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token');

    if (!accessToken?.value) {
      return { success: false, message: 'Not authenticated' };
    }

    const response = await fetch(
      `${apiUrl()}/api/invites?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken.value}`,
        },
        cache: 'no-store',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || 'Failed to list invites' };
    }

    // The backend returns `used: boolean` instead of a `status` field.
    // Derive status: used=true → accepted, past expiresAt → expired, else pending.
    const now = Date.now();
    const rawInvites: Record<string, unknown>[] = data.invites ?? data.data ?? [];
    const invites = rawInvites.map((inv) => {
      let status: 'pending' | 'accepted' | 'expired';
      if (inv.used) {
        status = 'accepted';
      } else if (inv.expiresAt && new Date(inv.expiresAt as string).getTime() < now) {
        status = 'expired';
      } else {
        status = 'pending';
      }
      return { ...inv, status } as Invite;
    });

    return {
      success: true,
      invites,
      pagination: data.pagination,
    };
  } catch (error) {
    console.error('listInvites error:', error);
    return { success: false, message: 'Network error' };
  }
}

/** Admin: revoke a pending invite by ID */
export async function revokeInvite(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token');

    if (!accessToken?.value) {
      return { success: false, message: 'Not authenticated' };
    }

    const response = await fetch(`${apiUrl()}/api/invites/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken.value}` },
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || 'Failed to revoke invite' };
    }

    return { success: true, message: data.message || 'Invite revoked' };
  } catch (error) {
    console.error('revokeInvite error:', error);
    return { success: false, message: 'Network error' };
  }
}

/** Admin: permanently delete any invite regardless of status */
export async function permanentDeleteInvite(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token');

    if (!accessToken?.value) {
      return { success: false, message: 'Not authenticated' };
    }

    const response = await fetch(`${apiUrl()}/api/invites/${id}/permanent`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken.value}` },
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || 'Failed to delete invite' };
    }

    return { success: true, message: data.message || 'Invite deleted' };
  } catch (error) {
    console.error('permanentDeleteInvite error:', error);
    return { success: false, message: 'Network error' };
  }
}

/** Public: validate an invite token (no auth required) */
export async function validateInvite(token: string): Promise<ValidateInviteResult> {
  try {
    const response = await fetch(`${apiUrl()}/api/invites/validate/${token}`, {
      method: 'GET',
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.message || 'Invalid or expired invite' };
    }

    console.log( data);

    return {
      success: true,
      invite: data.invite ?? data,
    };
  } catch (error) {
    console.error('validateInvite error:', error);
    return { success: false, message: 'Network error' };
  }
}
