import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import DashboardLayoutClient from '@/components/dashboard/layout-client';

async function validateToken(token: string): Promise<boolean> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002';
    const response = await fetch(`${baseUrl}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      return false;
    }
    
    const result = await response.json();
    return result.success === true || result.valid === true;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
}

export default async function DashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token');
  const userData = cookieStore.get('user_data');
  const { locale } = await params;

  // Check if user is authenticated
  if (!accessToken?.value || !userData?.value) {
    redirect(`/${locale}/auth`);
  }

  // Validate token
  const isValidUser = await validateToken(accessToken.value);
  if (!isValidUser) {
    redirect(`/${locale}/auth`);
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}