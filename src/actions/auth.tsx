"use server";

import { LoginFormData, SignupFormData, AuthResponse } from "@/lib/auth-schemas";
import { apiClient } from "@/lib/api-client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const loginApiUrl = () => process.env.API_BASE_URL || 'http://localhost:3001';

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export async function loginUser(data: LoginFormData): Promise<AuthResponse> {
  try {
    const res = await fetch(`${loginApiUrl()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email, password: data.password }),
    });

    const result = await res.json();

    if (!res.ok) {
      return { success: false, message: result.message || 'Invalid credentials' };
    }

    const tokens = result.tokens;
    const user = result.user;

    if (tokens?.accessToken) {
      const cookieStore = await cookies();
      cookieStore.set('access_token', tokens.accessToken, {
        ...COOKIE_BASE,
        maxAge: tokens.expiresIn ?? 3600,
      });
      cookieStore.set('refresh_token', tokens.refreshToken, {
        ...COOKIE_BASE,
        maxAge: 7 * 24 * 60 * 60,
      });
      if (user) {
        cookieStore.set('user_data', JSON.stringify(user), {
          ...COOKIE_BASE,
          maxAge: tokens.expiresIn ?? 3600,
        });
      }
      cookieStore.set('token_expires_at', String(Date.now() + (tokens.expiresIn ?? 3600) * 1000), {
        ...COOKIE_BASE,
        httpOnly: false,
        maxAge: tokens.expiresIn ?? 3600,
      });
    }

    return { success: true, message: result.message || 'Login successful', user, tokens };
  } catch {
    return { success: false, message: 'Network error. Please check if the server is running.' };
  }
}

export async function signupUser(
  data: SignupFormData,
  inviteToken?: string
): Promise<AuthResponse> {
  return await apiClient.register({
    firstName: data.firstName,
    lastName: data.lastName,
    username: data.username,
    email: data.email,
    password: data.password,
    ...(inviteToken ? { inviteToken } : {}),
  });
}

export async function logoutUser(): Promise<void> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token");
  
  if (accessToken?.value) {
    await apiClient.logout(accessToken.value);
  }
  
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("user_data");
  cookieStore.delete("token_expires_at");

  redirect("/");
}

export async function logoutUserNoRedirect(): Promise<void> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token");
  
  if (accessToken?.value) {
    await apiClient.logout(accessToken.value);
  }
  
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("user_data");
  cookieStore.delete("token_expires_at");
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const userData = cookieStore.get("user_data");
    const accessToken = cookieStore.get("access_token");

    if (!userData?.value || !accessToken?.value) {
      return null;
    }

    // Try to verify the token with the backend
    const verification = await apiClient.verifyToken(accessToken.value);

    if (verification.valid) {
      // Backend confirmed the token — use its fresher user data if returned
      const cookieUser = JSON.parse(userData.value);
      return verification.user ? { ...cookieUser, ...verification.user } : cookieUser;
    }

    if (verification.networkError) {
      // Backend unreachable (connection refused, timeout, etc.)
      // Trust the existing cookie rather than wiping a potentially valid session.
      console.warn('[getCurrentUser] Backend unreachable — trusting cookie session');
      return JSON.parse(userData.value);
    }

    // Backend definitively rejected the token (401/403) — session is invalid, clear it
    console.log('[getCurrentUser] Token rejected by server, clearing session');
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
    cookieStore.delete("user_data");
    cookieStore.delete("token_expires_at");
    return null;
  } catch (error) {
    console.error('getCurrentUser error:', error);
    return null;
  }
}

export async function refreshTokens(): Promise<boolean> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token");
  
  if (!refreshToken?.value) {
    return false;
  }
  
  const response = await apiClient.refreshToken(refreshToken.value);
  
  if (response.success && response.tokens) {
    cookieStore.set("access_token", response.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: response.tokens.expiresIn,
      path: "/",
    });

    // Update token expiration timestamp after refresh
    cookieStore.set("token_expires_at", String(Date.now() + (response.tokens.expiresIn * 1000)), {
      httpOnly: false, // Accessible from client for refresh timing
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: response.tokens.expiresIn,
      path: "/",
    });

    return true;
  }

  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("user_data");
  cookieStore.delete("token_expires_at");
  return false;
}

export async function updateUserProfile(data: {
  firstName?: string;
  lastName?: string;
  username?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token");

    if (!accessToken?.value) {
      return { success: false, message: "Not authenticated" };
    }

    const response = await apiClient.updateProfile(accessToken.value, data);

    if (response.success && response.user) {
      cookieStore.set("user_data", JSON.stringify(response.user), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60, // 1 hour, will be refreshed with token
        path: "/",
      });
    }

    return { success: response.success, message: response.message };
  } catch (error) {
    console.error("updateUserProfile error:", error);
    return { success: false, message: "Failed to update profile" };
  }
}

export async function checkServerHealth(): Promise<boolean> {
  return await apiClient.checkServerHealth();
}

// ── Coach invite flow ─────────────────────────────────────────────────────────

const apiUrl = () => process.env.API_BASE_URL || 'http://localhost:3001';

export interface CoachSetupResult {
  success: boolean;
  email?: string;
  message?: string;
}

/**
 * Validates an invite token and returns the locked email address.
 * Called server-side before the registration form renders.
 * Hits GET /api/auth/coach/setup/:token
 */
export async function getCoachSetup(token: string): Promise<CoachSetupResult> {
  try {
    const response = await fetch(`${apiUrl()}/api/auth/coach/setup/${token}`, {
      method: 'GET',
      cache: 'no-store',
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.message || 'Invalid or expired invite' };
    }

    // Backend may return email at data.email or data.invite.email — handle both
    return { success: true, email: data.email ?? data.invite?.email };
  } catch {
    return { success: false, message: 'Network error' };
  }
}

export interface ClientRegisterData {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}

/**
 * Registers a new client via a coach-sent invite token.
 * Email and coachId are resolved server-side from the invite — not user-supplied.
 * Hits POST /api/invites/accept/client on the backend.
 * On success, persists tokens + user_data cookies (same as loginUser).
 */
export async function registerClient(data: ClientRegisterData): Promise<AuthResponse> {
  try {
    const response = await fetch(`${apiUrl()}/api/invites/accept/client`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: data.token,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, message: result.message || 'Registration failed' };
    }

    if (result.accessToken || result.tokens) {
      const cookieStore = await cookies();
      const accessToken = result.accessToken ?? result.tokens?.accessToken;
      const refreshToken = result.refreshToken ?? result.tokens?.refreshToken;
      const expiresIn = result.tokens?.expiresIn ?? 3600;

      if (accessToken) {
        cookieStore.set('access_token', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: expiresIn,
          path: '/',
        });
      }
      if (refreshToken) {
        cookieStore.set('refresh_token', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });
      }
      if (result.user) {
        cookieStore.set('user_data', JSON.stringify(result.user), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: expiresIn,
          path: '/',
        });
      }
    }

    return { success: result.success ?? true, message: result.message, user: result.user };
  } catch {
    return { success: false, message: 'Network error. Check that the API server is running.' };
  }
}

export interface CoachRegisterData {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

/**
 * Registers a new coach via invite token.
 * Email is locked server-side to the invite — not user-supplied.
 * Hits POST /api/auth/coach/register
 * On success, persists tokens + user_data cookies (same as loginUser).
 */
export async function registerCoach(data: CoachRegisterData): Promise<AuthResponse> {
  try {
    const response = await fetch(`${apiUrl()}/api/auth/coach/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success && result.tokens) {
      const cookieStore = await cookies();
      cookieStore.set('access_token', result.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: result.tokens.expiresIn ?? 3600,
        path: '/',
      });
      cookieStore.set('refresh_token', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      if (result.user) {
        cookieStore.set('user_data', JSON.stringify(result.user), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 3600,
          path: '/',
        });
      }
    }

    return { success: result.success, message: result.message, user: result.user, tokens: result.tokens };
  } catch {
    return { success: false, message: 'Network error' };
  }
}