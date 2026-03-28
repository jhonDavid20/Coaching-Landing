import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import { NextResponse, NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

async function validateToken(token: string): Promise<boolean> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002';
    const response = await fetch(`${baseUrl}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.success === true || result.valid === true;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
}

export default async function middleware(req: NextRequest) {
  // Skip auth middleware for API routes and NextAuth routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return;
  }

  const isOnAuth = req.nextUrl.pathname.includes('/auth');
  const isOnDashboard = req.nextUrl.pathname.includes('/dashboard');
  const isOnOnboarding = req.nextUrl.pathname.includes('/onboarding');

  if (isOnDashboard || isOnAuth || isOnOnboarding) {
    const accessToken = req.cookies.get('access_token');
    const userData = req.cookies.get('user_data');

    let isValidUser = false;
    let hasCompletedOnboarding: boolean | undefined;

    if (accessToken?.value && userData?.value) {
      try {
        isValidUser = await validateToken(accessToken.value);
      } catch (error) {
        console.error('Token validation error in middleware:', error);
        isValidUser = false;
      }

      // If token is invalid, clear cookies
      if (!isValidUser) {
        const response = intlMiddleware(req) || NextResponse.next();
        response.cookies.set('access_token', '', { maxAge: 0, path: '/' });
        response.cookies.set('refresh_token', '', { maxAge: 0, path: '/' });
        response.cookies.set('user_data', '', { maxAge: 0, path: '/' });
        return response;
      }

      // Parse hasCompletedOnboarding from user_data cookie
      if (isValidUser && userData?.value) {
        try {
          const parsed = JSON.parse(userData.value);
          hasCompletedOnboarding = parsed.hasCompletedOnboarding;
        } catch {
          hasCompletedOnboarding = undefined;
        }
      }
    }

    const locale = req.nextUrl.pathname.split('/')[1] || 'es';

    // Unauthenticated → dashboard: redirect to auth
    if (isOnDashboard && !isValidUser) {
      return NextResponse.redirect(new URL(`/${locale}/auth`, req.url));
    }

    // Unauthenticated → onboarding: redirect to auth
    if (isOnOnboarding && !isValidUser) {
      return NextResponse.redirect(new URL(`/${locale}/auth`, req.url));
    }

    // Authenticated → auth page: redirect to dashboard
    if (isValidUser && isOnAuth) {
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
    }

    // Authenticated, onboarding incomplete → dashboard: redirect to onboarding
    if (isValidUser && isOnDashboard && hasCompletedOnboarding === false) {
      return NextResponse.redirect(new URL(`/${locale}/onboarding`, req.url));
    }

    // Authenticated, onboarding complete (or flag absent) → onboarding page: redirect to dashboard
    if (isValidUser && isOnOnboarding && hasCompletedOnboarding !== false) {
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
    }

    // Authenticated, onboarding incomplete → onboarding page: allow through
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)'
  ]
};
