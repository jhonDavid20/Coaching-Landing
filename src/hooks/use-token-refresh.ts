"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Custom hook that manages automatic token refresh based on token expiration time.
 *
 * @param onRefreshNeeded - Async callback function to execute when token needs refresh
 *
 * How it works:
 * 1. Reads token_expires_at cookie to determine when token expires
 * 2. Calculates 90% of token lifetime for proactive refresh
 * 3. Schedules setTimeout to refresh at that time
 * 4. On successful refresh, reschedules next refresh
 * 5. On failure, redirects to /auth page
 */
export function useTokenRefresh(onRefreshNeeded: () => Promise<void>) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);
  const router = useRouter();

  const scheduleRefresh = useCallback(() => {
    // Clear existing timer to prevent duplicates
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Get token expiration timestamp from cookie
    const expiresAt = getCookie("token_expires_at");

    if (!expiresAt) {
      console.log("No token expiration found, skipping refresh schedule");
      return; // No token, nothing to refresh
    }

    const expirationTime = parseInt(expiresAt, 10);
    const now = Date.now();

    // Calculate 90% of token lifetime for proactive refresh
    const tokenLifetime = expirationTime - now;
    const refreshDelay = tokenLifetime * 0.9;

    console.log("Token expires at:", new Date(expirationTime).toISOString());
    console.log("Token lifetime remaining:", Math.round(tokenLifetime / 1000), "seconds");
    console.log("Refresh scheduled in:", Math.round(refreshDelay / 1000), "seconds");

    // If already expired or expires very soon, refresh immediately
    if (refreshDelay <= 0) {
      console.log("Token expired or expires soon, refreshing immediately");
      performRefresh();
      return;
    }

    // Schedule refresh at 90% of token lifetime
    timerRef.current = setTimeout(() => {
      performRefresh();
    }, refreshDelay);

  }, [onRefreshNeeded]);

  const performRefresh = async () => {
    // Prevent multiple simultaneous refresh calls
    if (isRefreshingRef.current) {
      console.log("Refresh already in progress, skipping");
      return;
    }

    isRefreshingRef.current = true;
    console.log("Starting token refresh...");

    try {
      await onRefreshNeeded();
      console.log("Token refresh completed successfully");

      // After successful refresh, schedule next refresh
      scheduleRefresh();
    } catch (error) {
      console.error("Token refresh failed:", error);

      // On refresh failure, redirect to auth page
      // This gives the user a chance to log in again
      router.push("/auth");
    } finally {
      isRefreshingRef.current = false;
    }
  };

  // Set up refresh timer on mount and when dependencies change
  useEffect(() => {
    scheduleRefresh();

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [scheduleRefresh]);

  return { scheduleRefresh };
}

/**
 * Utility function to read a cookie value from document.cookie
 *
 * @param name - Name of the cookie to read
 * @returns Cookie value if found, null otherwise
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null; // SSR safety
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }

  return null;
}
