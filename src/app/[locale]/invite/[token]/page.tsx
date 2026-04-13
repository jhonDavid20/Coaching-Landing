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
      <div className="min-h-screen flex items-center justify-center bg-[#0f1117] px-4">
        <div className="max-w-md w-full bg-[#1a1d27] rounded-2xl border border-gray-800 shadow-lg p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Ban className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Invalid Invite</h1>
          <p className="text-sm text-gray-500">
            {setup.message ?? 'This invite link is invalid or has already expired.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117] px-4 py-12">
      <InviteSignupClient inviteToken={token} lockedEmail={setup.email} />
    </div>
  );
}
