import { getCoachSetup } from '@/actions/auth';
import InviteSignupClient from './invite-signup-client';
import { Ban, LogIn } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function InvitePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;

  // Validate token server-side and get the locked email before rendering the form
  const setup = await getCoachSetup(token);

  if (!setup.success || !setup.email) {
    // If the token is already used, check whether this user already has a valid
    // coach session (they registered but didn't finish onboarding). If so,
    // redirect them to complete onboarding instead of showing an error.
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const userDataRaw = cookieStore.get('user_data')?.value;

    if (accessToken && userDataRaw) {
      try {
        const userData = JSON.parse(userDataRaw);
        if (userData?.role === 'coach') {
          redirect(`/${locale}/onboarding/coach`);
        }
      } catch {
        // Malformed user_data cookie — fall through to error UI
      }
    }

    // Detect "already used" tokens vs genuinely invalid ones
    const alreadyUsed = setup.message?.toLowerCase().includes('already');

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f8f5] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#d8e0d8] shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
            <Ban className="w-7 h-7 text-red-500" />
          </div>

          {alreadyUsed ? (
            <>
              <h1 className="text-xl font-bold text-[#0f1f10] mb-2">Account already created</h1>
              <p className="text-sm text-[#617061] mb-6">
                This invite has already been used. If you registered but didn&apos;t finish setting up your profile, log in to continue.
              </p>
              <Link
                href={`/${locale}/auth/login`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#162318] hover:bg-[#243d27] text-white text-sm font-medium transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Log in to continue
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-[#0f1f10] mb-2">Invalid Invite</h1>
              <p className="text-sm text-[#617061]">
                {setup.message ?? 'This invite link is invalid or has already expired.'}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return <InviteSignupClient inviteToken={token} lockedEmail={setup.email} />;
}
