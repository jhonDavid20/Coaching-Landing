"use server";

import { LoginFormData, SignupFormData, AuthResponse } from "@/lib/auth-schemas";
import { apiClient } from "@/lib/api-client";
import { cookies } from "next/headers";

export async function loginUser(data: LoginFormData): Promise<AuthResponse> {
  console.log('loginUser called with:', data.email);
  console.log('API_BASE_URL:', process.env.API_BASE_URL);
  console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  
  const response = await apiClient.login({
    email: data.email,
    password: data.password,
    rememberMe: false,
  });

  console.log('API response:', response);
  console.log('API response success:', response.success);
  console.log('API response tokens:', response.tokens ? 'present' : 'missing');
  console.log('API response user:', response.user ? 'present' : 'missing');

  if (response.success && response.tokens) {
    const cookieStore = await cookies();
    
    console.log('Setting cookies for user:', response.user?.email);
    console.log('Token expiry:', response.tokens.expiresIn);
    
    try {
      cookieStore.set("access_token", response.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: response.tokens.expiresIn,
        path: "/",
      });
      
      cookieStore.set("refresh_token", response.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });

      cookieStore.set("user_data", JSON.stringify(response.user), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: response.tokens.expiresIn,
        path: "/",
      });

      // Add token expiration timestamp for client-side refresh scheduling
      cookieStore.set("token_expires_at", String(Date.now() + (response.tokens.expiresIn * 1000)), {
        httpOnly: false, // Accessible from client for refresh timing
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: response.tokens.expiresIn,
        path: "/",
      });
      
      console.log('Cookies set successfully');
      
      // Immediate verification
      const testToken = cookieStore.get("access_token");
      const testUser = cookieStore.get("user_data");
      console.log('Immediate verification - token exists:', !!testToken?.value);
      console.log('Immediate verification - user exists:', !!testUser?.value);
      
    } catch (error) {
      console.error('Error setting cookies:', error);
    }
  } else {
    console.log('Not setting cookies - success:', response.success, 'tokens:', !!response.tokens);
  }

  return response;
}

export async function signupUser(data: SignupFormData): Promise<AuthResponse> {
  return await apiClient.register({
    firstName: data.firstName,
    lastName: data.lastName,
    username: data.username,
    email: data.email,
    password: data.password,
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
    
    console.log('getCurrentUser - userData:', userData?.value ? 'exists' : 'missing');
    console.log('getCurrentUser - accessToken:', accessToken?.value ? 'exists' : 'missing');
    
    if (!userData?.value || !accessToken?.value) {
      console.log('getCurrentUser - Missing cookies, returning null');
      return null;
    }
    
    // Try to verify token
    const verification = await apiClient.verifyToken(accessToken.value);
    console.log('Token verification result:', verification.valid);
    
    if (!verification.valid) {
      console.log('getCurrentUser - Invalid token, clearing cookies');
      cookieStore.delete("access_token");
      cookieStore.delete("refresh_token");
      cookieStore.delete("user_data");
      return null;
    }
    
    const user = JSON.parse(userData.value);
    console.log('getCurrentUser - Returning user:', user.email);
    return user;
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