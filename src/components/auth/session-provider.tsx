"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser } from "@/actions/auth";
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
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
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

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to refresh user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Token refresh callback for automatic refresh
  const handleTokenRefresh = async () => {
    const success = await refreshTokenClient();
    if (success) {
      console.log("Token refreshed successfully");
      await refreshUser(); // Update user context with fresh data
    } else {
      console.error("Token refresh failed");
      setUser(null); // Clear user on refresh failure
      throw new Error("Token refresh failed");
    }
  };

  // Activate automatic token refresh
  useTokenRefresh(handleTokenRefresh);

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}