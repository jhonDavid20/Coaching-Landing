"use client";

/**
 * Client-side wrapper for token refresh
 *
 * This function is callable from client components and triggers
 * the server-side token refresh via API endpoint.
 *
 * @returns Promise<boolean> - Whether the refresh was successful
 */
export async function refreshTokenClient(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/refresh-client', {
      method: 'POST',
      credentials: 'include', // Include cookies in request
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Client token refresh failed:', error);
    return false;
  }
}
