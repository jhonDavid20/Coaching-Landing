'use client';

import { usePathname } from 'next/navigation';
import Navbar from './navbar';

const LOCALES = ['en', 'es'];

function stripLocale(pathname: string): string {
  for (const locale of LOCALES) {
    if (pathname === `/${locale}` || pathname === `/${locale}/`) return '/';
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return pathname;
}

export default function ConditionalNavbar() {
  const pathname = usePathname();
  const stripped = stripLocale(pathname);

  // Routes that manage their own navbar (or have no navbar at all)
  const isHiddenRoute =
    stripped.startsWith('/dashboard') ||
    stripped.startsWith('/onboarding') ||
    stripped.startsWith('/auth') || // auth page has its own minimal navbar
    stripped === '/'; // new landing page — has its own LandingNavbar

  if (isHiddenRoute) {
    return null;
  }

  // /vision is the founder's story page — no auth buttons
  const hideAuth = stripped.startsWith('/vision');

  return <Navbar hideAuth={hideAuth} />;
}
