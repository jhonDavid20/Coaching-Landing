import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth';
import DashboardLayoutClient from '@/components/dashboard/layout-client';

export default async function DashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // getCurrentUser() verifies the token against the backend and falls back
  // to the cookie when the backend is unreachable — no redundant fetch needed here.
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/auth`);
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
