import { notFound } from 'next/navigation';
import ClientInviteSignup from './client-signup';

const apiUrl = () => process.env.API_BASE_URL || 'http://localhost:3001';

interface PageProps {
  params: Promise<{ token: string; locale: string }>;
}

/**
 * Validates the invite token against the backend.
 * Returns { valid, email, coachName, coachId } on success, or null on failure.
 */
async function validateClientInviteToken(token: string) {
  try {
    const res = await fetch(`${apiUrl()}/api/invites/validate/client/${token}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.valid || data.success ? data : null;
  } catch {
    return null;
  }
}

export default async function ClientInvitePage({ params }: PageProps) {
  const { token } = await params;

  const invite = await validateClientInviteToken(token);

  // If the backend returned null (token invalid/expired), show 404.
  // In development with no backend, we skip this check so the UI is still testable.
  if (invite === null && process.env.NODE_ENV === 'production') {
    notFound();
  }

  // Backend returns { valid, email, coachName, coachId } — use directly.
  // Fall back to placeholders for local dev when backend isn't running.
  const lockedEmail = invite?.email ?? 'client@example.com';
  const coachName = invite?.coachName ?? 'your coach';

  return (
    <ClientInviteSignup
      inviteToken={token}
      lockedEmail={lockedEmail}
      coachName={coachName}
    />
  );
}
