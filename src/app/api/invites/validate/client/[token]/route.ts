import { NextRequest, NextResponse } from 'next/server';

const apiUrl = () => process.env.API_BASE_URL || 'http://localhost:3001';

/** GET /api/invites/validate/client/[token] — public, validates a coach-to-client invite */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const response = await fetch(`${apiUrl()}/api/invites/validate/client/${token}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Validate client invite proxy error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
