"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getCurrentUser } from "@/actions/auth";
import { getFullUserProfile } from "@/actions/user";
import { useTokenRefresh } from "@/hooks/use-token-refresh";
import { refreshTokenClient } from "@/actions/refresh-token-client";

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  isEmailVerified: boolean;
  hasCompletedOnboarding?: boolean;
  /** Set once a client is connected to a coach. Null/undefined = no coach yet. */
  coachId?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** The current user's avatar URL — kept in sync across the whole app. */
  avatarUrl: string | null;
  /** Call this after a successful upload or delete to propagate the change everywhere. */
  setAvatarUrl: (url: string | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  avatarUrl: null,
  setAvatarUrl: () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to refresh user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Whenever the user identity is confirmed, load the avatar from the profile endpoint.
  // We keep this separate so auth loading stays fast (cookie-only) while the avatar
  // fetches in the background.
  useEffect(() => {
    if (!user) {
      setAvatarUrl(null);
      return;
    }
    getFullUserProfile()
      .then((profile) => {
        if (profile?.avatar) {
          // Bust the cache so the browser always fetches the latest file on
          // page load — the backend reuses the same filename so without this
          // the browser would serve its cached (possibly stale) copy.
          const url = `${profile.avatar.split('?')[0]}?v=${Date.now()}`;
          setAvatarUrl(url);
        }
      })
      .catch(() => {}); // non-critical — silently ignore
  }, [user?.id]); // re-run only when the logged-in user changes

  // Token refresh callback for automatic refresh
  const handleTokenRefresh = async () => {
    const success = await refreshTokenClient();
    if (success) {
      console.log("Token refreshed successfully");
      await refreshUser(); // Update user context with fresh data
    } else {
      console.error("Token refresh failed");
      setUser(null); // Clear user on refresh failure
      setAvatarUrl(null);
      throw new Error("Token refresh failed");
    }
  };

  // Activate automatic token refresh
  useTokenRefresh(handleTokenRefresh);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, loading, avatarUrl, setAvatarUrl, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
