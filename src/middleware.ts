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

  // Only validate tokens for protected/auth routes (not landing pages)
  if (isOnDashboard || isOnAuth) {
    const accessToken = req.cookies.get('access_token');
    const userData = req.cookies.get('user_data');

    let isValidUser = false;

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
    }

    // If trying to access dashboard without valid auth, redirect to auth
    if (isOnDashboard && !isValidUser) {
      const locale = req.nextUrl.pathname.split('/')[1] || 'es';
      return NextResponse.redirect(new URL(`/${locale}/auth`, req.url));
    }

    // If valid user trying to access auth pages, redirect to dashboard
    if (isValidUser && isOnAuth) {
      const locale = req.nextUrl.pathname.split('/')[1] || 'es';
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
    }
  }

  // Apply internationalization middleware
  return intlMiddleware(req);
}
 
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)'
  ]
};