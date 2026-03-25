'use client';

import { useState } from 'react';
import Sidebar from '@/components/dashboard/sidebar';
import DashboardHeader from '@/components/dashboard/header';

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Navbar - fixed top */}
      <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      {/* Sidebar - fixed below navbar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content - offset by navbar height and sidebar width */}
      <main className="mt-16 lg:ml-64 min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6 md:px-6 md:py-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
