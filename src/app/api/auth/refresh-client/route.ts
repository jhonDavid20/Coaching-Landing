import { NextResponse } from 'next/server';
import { refreshTokens } from '@/actions/auth';

/**
 * API endpoint for client-side token refresh
 *
 * This endpoint allows client components to trigger a token refresh
 * without directly calling server actions.
 *
 * POST /api/auth/refresh-client
 * @returns { success: boolean } - Whether the refresh was successful
 */
export async function POST() {
  try {
    const success = await refreshTokens();

    if (success) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, message: 'Token refresh failed' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
