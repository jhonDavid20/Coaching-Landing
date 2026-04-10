import { NextRequest, NextResponse } from 'next/server';

const apiUrl = () => process.env.API_BASE_URL || 'http://localhost:3001';

/**
 * GET /api/auth/coach-setup/[token]
 * Public — validates the invite token and returns the locked email address
 * before the registration form renders.
 * Proxies to Express GET /api/auth/coach/setup/:token
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const response = await fetch(`${apiUrl()}/api/auth/coach/setup/${token}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Coach setup proxy error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
