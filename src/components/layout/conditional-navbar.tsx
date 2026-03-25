'use client';

import { usePathname } from 'next/navigation';
import Navbar from './navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Hide navbar on dashboard routes
  const isDashboardRoute = pathname.includes('/dashboard');
  
  if (isDashboardRoute) {
    return null;
  }
  
  return <Navbar />;
}