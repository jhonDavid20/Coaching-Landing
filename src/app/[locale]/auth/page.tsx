import AuthSection from "@/components/auth/auth-section";
import AboutSection from "@/components/sections/about-section";
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

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

export default async function AuthPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token');
  const userData = cookieStore.get('user_data');
  const { locale } = await params;

  // If user is already authenticated, redirect to dashboard
  if (accessToken?.value && userData?.value) {
    const isValidUser = await validateToken(accessToken.value);
    if (isValidUser) {
      redirect(`/${locale}/dashboard`);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted to-background dark:from-[#1A202C] dark:to-[#23272F]">
      <div className="flex-1 flex items-center justify-center py-20">
        <AuthSection />
      </div>
      <AboutSection />
    </div>
  );
}