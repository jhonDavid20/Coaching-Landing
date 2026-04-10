import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const userDataCookie = cookieStore.get('user_data');

  let role = 'user';
  if (userDataCookie?.value) {
    try {
      const parsed = JSON.parse(userDataCookie.value);
      role = parsed.role ?? 'user';
    } catch {
      // malformed cookie — default to user
    }
  }

  if (role === 'admin') {
    redirect(`/${locale}/dashboard/admin`);
  }

  if (role === 'coach') {
    redirect(`/${locale}/dashboard/coach`);
  }

  redirect(`/${locale}/dashboard/profile`);
}
