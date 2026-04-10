import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const apiUrl = () => process.env.API_BASE_URL || 'http://localhost:3001';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60,
  path: '/',
};

/**
 * POST /api/auth/client
 * Registers a client via a coach-sent invite token.
 * Proxies to the backend and sets auth cookies on success.
 */
export async function POST(request: NextRequest) {
  let firstName = '';
  let lastName = '';
  let token = '';
  let password = '';

  try {
    const body = await request.json();
    firstName = body.firstName ?? '';
    lastName = body.lastName ?? '';
    token = body.token ?? '';
    password = body.password ?? '';
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  if (!token || !firstName || !lastName || !password) {
    return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }

  try {
    const response = await fetch(`${apiUrl()}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, firstName, lastName, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Registration failed' },
        { status: response.status }
      );
    }

    const cookieStore = await cookies();

    if (data.accessToken) {
      cookieStore.set('access_token', data.accessToken, COOKIE_OPTS);
    }
    if (data.refreshToken) {
      cookieStore.set('refresh_token', data.refreshToken, {
        ...COOKIE_OPTS,
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    if (data.user) {
      cookieStore.set('user_data', JSON.stringify(data.user), COOKIE_OPTS);
    }

    return NextResponse.json({ success: true, message: data.message || 'Registered successfully' });
  } catch (error) {
    console.error('[client-register] Backend unavailable:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
