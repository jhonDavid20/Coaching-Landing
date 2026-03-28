'use client';

import { usePathname } from 'next/navigation';
import Navbar from './navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Hide navbar on dashboard and onboarding routes
  const isHiddenRoute = pathname.includes('/dashboard') || pathname.includes('/onboarding');

  if (isHiddenRoute) {
    return null;
  }
  
  return <Navbar />;
}