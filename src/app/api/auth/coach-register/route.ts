import { NextRequest, NextResponse } from 'next/server';

const apiUrl = () => process.env.API_BASE_URL || 'http://localhost:3001';

/**
 * POST /api/auth/coach-register
 * Public — registers a new coach via invite token.
 * Body: { token, firstName, lastName, password, confirmPassword }
 * Email is locked to the invite server-side — not user-supplied.
 * Proxies to Express POST /api/auth/coach/register
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${apiUrl()}/api/auth/coach/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Coach register proxy error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
