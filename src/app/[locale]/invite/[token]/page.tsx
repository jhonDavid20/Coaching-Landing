import { getCoachSetup } from '@/actions/auth';
import InviteSignupClient from './invite-signup-client';
import { Ban } from 'lucide-react';

export default async function InvitePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { token } = await params;

  // Validate token server-side and get the locked email before rendering the form
  const setup = await getCoachSetup(token);

  if (!setup.success || !setup.email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f8f5] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#d8e0d8] shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
            <Ban className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-[#0f1f10] mb-2">Invalid Invite</h1>
          <p className="text-sm text-[#617061]">
            {setup.message ?? 'This invite link is invalid or has already expired.'}
          </p>
        </div>
      </div>
    );
  }

  return <InviteSignupClient inviteToken={token} lockedEmail={setup.email} />;
}
