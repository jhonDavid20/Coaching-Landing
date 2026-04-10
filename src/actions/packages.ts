'use server';

import { cookies } from 'next/headers';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Package {
  id: string;
  coachId: string;          // CoachProfile.id
  name: string;
  description?: string;
  durationWeeks: number;
  sessionsIncluded: number;
  priceUSD: number;
  isActive: boolean;
  /** Bullet-point list of what this package includes, e.g. ["Nutrition plan", "Weekly check-ins"] */
  features?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PackageFormData {
  name: string;
  description?: string;
  durationWeeks: number;
  sessionsIncluded: number;
  priceUSD: number;
  features?: string[];
}

export interface ClientPackage {
  id: string;
  packageId: string;
  clientId: string;
  status: 'active' | 'completed' | 'cancelled';
  startDate?: string;
  /** Computed end date (startDate + durationWeeks). Provided by backend. */
  endDate?: string;
  /** Actual count of sessions marked completed by the coach. */
  sessionsCompleted?: number;
  /** Coach-written notes specific to this client's assignment. */
  notes?: string;
  /** Goals the coach set for this client within the plan. */
  goals?: string[];
  package?: Package;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const apiUrl = () => process.env.API_BASE_URL || 'http://localhost:3001';

async function getToken(): Promise<string | null> {
  const store = await cookies();
  return store.get('access_token')?.value ?? null;
}

// ─── Coach package management ─────────────────────────────────────────────────

/**
 * Fetch all packages for a given coach.
 * `:coachId` is the CoachProfile.id (not the user ID).
 * This is a public endpoint — no auth required, but we pass it anyway in case
 * the backend is permissive.
 */
export async function getCoachPackages(coachProfileId: string): Promise<{
  success: boolean;
  packages: Package[];
  error?: string;
}> {
  try {
    const token = await getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${apiUrl()}/api/packages/coach/${coachProfileId}`, {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, packages: [], error: (err as { message?: string }).message || 'Failed to load packages' };
    }

    const data = await res.json();
    // Response may be { packages: [...] } or { data: [...] } or a bare array
    const list: Package[] = Array.isArray(data)
      ? data
      : Array.isArray(data.packages)
        ? data.packages
        : Array.isArray(data.data)
          ? data.data
          : [];

    return { success: true, packages: list };
  } catch {
    return { success: false, packages: [], error: 'Network error. Check that the API server is running.' };
  }
}

/**
 * Create a new package template for the authenticated coach.
 * The backend resolves CoachProfile.id from the bearer token automatically.
 */
export async function createPackage(payload: PackageFormData): Promise<{
  success: boolean;
  message: string;
  package?: Package;
}> {
  try {
    const token = await getToken();
    if (!token) return { success: false, message: 'Not authenticated' };

    const res = await fetch(`${apiUrl()}/api/packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) return { success: false, message: data.message || 'Failed to create package' };

    const pkg: Package = data.package ?? data.data ?? data;
    return { success: true, message: data.message || 'Package created', package: pkg };
  } catch {
    return { success: false, message: 'Network error. Check that the API server is running.' };
  }
}

/**
 * Update an existing package template.
 */
export async function updatePackage(id: string, payload: Partial<PackageFormData>): Promise<{
  success: boolean;
  message: string;
  package?: Package;
}> {
  try {
    const token = await getToken();
    if (!token) return { success: false, message: 'Not authenticated' };

    const res = await fetch(`${apiUrl()}/api/packages/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) return { success: false, message: data.message || 'Failed to update package' };

    const pkg: Package = data.package ?? data.data ?? data;
    return { success: true, message: data.message || 'Package updated', package: pkg };
  } catch {
    return { success: false, message: 'Network error. Check that the API server is running.' };
  }
}

/**
 * Soft-delete a package template.
 */
export async function deletePackage(id: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const token = await getToken();
    if (!token) return { success: false, message: 'Not authenticated' };

    const res = await fetch(`${apiUrl()}/api/packages/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, message: (data as { message?: string }).message || 'Failed to delete package' };

    return { success: true, message: (data as { message?: string }).message || 'Package deleted' };
  } catch {
    return { success: false, message: 'Network error. Check that the API server is running.' };
  }
}

// ─── Package assignment (coach → client) ──────────────────────────────────────

export interface AssignPackageOptions {
  clientId: string;
  startDate?: string;
  notes?: string;
  goals?: string[];
}

export async function assignPackage(packageId: string, options: AssignPackageOptions): Promise<{
  success: boolean;
  message: string;
  clientPackage?: ClientPackage;
}> {
  try {
    const token = await getToken();
    if (!token) return { success: false, message: 'Not authenticated' };

    const body: Record<string, unknown> = { clientId: options.clientId };
    if (options.startDate) body.startDate = options.startDate;
    if (options.notes?.trim()) body.notes = options.notes.trim();
    if (options.goals && options.goals.length > 0) body.goals = options.goals;

    const res = await fetch(`${apiUrl()}/api/packages/${packageId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) return { success: false, message: data.message || 'Failed to assign package' };

    return {
      success: true,
      message: data.message || 'Package assigned',
      clientPackage: data.clientPackage ?? data.data ?? data,
    };
  } catch {
    return { success: false, message: 'Network error. Check that the API server is running.' };
  }
}

/**
 * Update notes, goals, and/or sessionsCompleted on an existing client package assignment.
 * PATCH /api/packages/client/:clientPackageId
 */
export async function updateClientPackageDetails(
  clientPackageId: string,
  updates: {
    notes?: string;
    goals?: string[];
    sessionsCompleted?: number;
  }
): Promise<{ success: boolean; message: string; clientPackage?: ClientPackage }> {
  try {
    const token = await getToken();
    if (!token) return { success: false, message: 'Not authenticated' };

    const res = await fetch(`${apiUrl()}/api/packages/client/${clientPackageId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) return { success: false, message: data.message || 'Failed to update package' };

    return {
      success: true,
      message: data.message || 'Package updated',
      clientPackage: data.clientPackage ?? data.data ?? undefined,
    };
  } catch {
    return { success: false, message: 'Network error. Check that the API server is running.' };
  }
}

/**
 * Update the status of a client's assigned package.
 * status: 'active' | 'completed' | 'cancelled'
 */
export async function updateClientPackageStatus(
  clientPackageId: string,
  status: 'active' | 'completed' | 'cancelled'
): Promise<{ success: boolean; message: string }> {
  try {
    const token = await getToken();
    if (!token) return { success: false, message: 'Not authenticated' };

    const res = await fetch(`${apiUrl()}/api/packages/client/${clientPackageId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) return { success: false, message: data.message || 'Failed to update status' };

    return { success: true, message: data.message || 'Status updated' };
  } catch {
    return { success: false, message: 'Network error. Check that the API server is running.' };
  }
}

// ─── Client side ──────────────────────────────────────────────────────────────

/**
 * Client fetches their own active package.
 */
export async function getMyActivePackage(): Promise<{
  success: boolean;
  clientPackage: ClientPackage | null;
}> {
  try {
    const token = await getToken();
    if (!token) return { success: false, clientPackage: null };

    const res = await fetch(`${apiUrl()}/api/packages/me/active`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) return { success: true, clientPackage: null };

    const data = await res.json();
    const pkg: ClientPackage = data.clientPackage ?? data.data ?? data;
    return { success: true, clientPackage: pkg };
  } catch {
    return { success: false, clientPackage: null };
  }
}

/**
 * Coach fetches the active (or most recent) package assigned to a specific client.
 * Tries GET /api/packages/client/:clientId — returns null if the endpoint is not yet available.
 */
export async function getClientActivePackage(clientId: string): Promise<{
  success: boolean;
  clientPackage: ClientPackage | null;
}> {
  try {
    const token = await getToken();
    if (!token) return { success: false, clientPackage: null };

    const res = await fetch(`${apiUrl()}/api/packages/client/${clientId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) return { success: true, clientPackage: null };

    const data = await res.json();
    // Response may be a single object or { clientPackage: ... } or { data: ... }
    const raw = data.clientPackage ?? data.data ?? data;
    // If the backend returns an array, pick the first active one
    const pkg: ClientPackage | null = Array.isArray(raw)
      ? (raw.find((p: ClientPackage) => p.status === 'active') ?? raw[0] ?? null)
      : raw;
    return { success: true, clientPackage: pkg?.id ? pkg : null };
  } catch {
    return { success: false, clientPackage: null };
  }
}

/**
 * Client requests a specific package from their coach.
 * Calls POST /api/packages/:packageId/request — client-authenticated.
 * The backend creates a client_packages row with status "pending" (or directly active
 * if the coach allows auto-assignment).
 */
export async function requestPackage(packageId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const token = await getToken();
    if (!token) return { success: false, message: 'Not authenticated' };

    const res = await fetch(`${apiUrl()}/api/packages/${packageId}/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, message: data.message ?? 'Failed to request package' };
    }
    return { success: true, message: data.message ?? 'Package requested successfully' };
  } catch {
    return { success: false, message: 'Network error' };
  }
}
