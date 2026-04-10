import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const apiUrl = () => process.env.API_BASE_URL || 'http://localhost:3001';

/** GET /api/admin/stats — proxies to Express GET /api/admin/stats */
export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token');

    if (!accessToken?.value) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const response = await fetch(`${apiUrl()}/api/admin/stats`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken.value}` },
      cache: 'no-store',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin stats proxy error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
