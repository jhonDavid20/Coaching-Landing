import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextResponse, NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  const isOnAuth = pathname.includes('/auth');
  const isOnDashboard = pathname.includes('/dashboard');
  const isOnOnboarding = pathname.includes('/onboarding');

  if (!isOnDashboard && !isOnAuth && !isOnOnboarding) {
    return intlMiddleware(req);
  }

  const accessToken = req.cookies.get('access_token')?.value;
  const userDataRaw = req.cookies.get('user_data')?.value;

  // Treat the session as valid if both cookies are present.
  // Deep token verification happens server-side in getCurrentUser()
  // on each page — we avoid backend calls in middleware to keep
  // navigation fast and resilient to transient backend downtime.
  const hasSession = !!(accessToken && userDataRaw);

  let hasCompletedOnboarding: boolean | undefined;
  let userRole = 'user';

  if (hasSession && userDataRaw) {
    try {
      const parsed = JSON.parse(userDataRaw);
      hasCompletedOnboarding = parsed.hasCompletedOnboarding;
      userRole = parsed.role ?? 'user';
    } catch {
      // Malformed cookie — treat as unauthenticated
    }
  }

  const locale = pathname.split('/')[1] || 'es';
  const isCoach = userRole === 'coach';
  const onboardingDest = isCoach ? `/${locale}/onboarding/coach` : `/${locale}/onboarding`;

  // Unauthenticated → protected page: redirect to auth
  if (!hasSession && (isOnDashboard || isOnOnboarding)) {
    return NextResponse.redirect(new URL(`/${locale}/auth`, req.url));
  }

  // Authenticated → auth page: redirect to dashboard
  if (hasSession && isOnAuth) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
  }

  // Authenticated, onboarding incomplete → dashboard: send to correct onboarding
  if (hasSession && isOnDashboard && hasCompletedOnboarding === false) {
    return NextResponse.redirect(new URL(onboardingDest, req.url));
  }

  // Coach landing on client onboarding path → redirect to coach onboarding
  if (hasSession && isCoach && pathname.endsWith('/onboarding') && hasCompletedOnboarding === false) {
    return NextResponse.redirect(new URL(`/${locale}/onboarding/coach`, req.url));
  }

  // Authenticated, onboarding already done → onboarding page: redirect to dashboard
  if (hasSession && isOnOnboarding && hasCompletedOnboarding !== false) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)'
  ]
};
