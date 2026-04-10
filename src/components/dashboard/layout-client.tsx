'use client';

import { useState } from 'react';
import Sidebar from '@/components/dashboard/sidebar';
import DashboardHeader from '@/components/dashboard/header';
import { useLocaleSwitch } from '@/components/providers/locale-switch-provider';

// LocaleSwitchProvider is now in the root layout — no need to wrap again here.
function DashboardContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { contentOpacity } = useLocaleSwitch();

  return (
    <div className="min-h-screen bg-[#f6f8f5]">
      {/* Sidebar — manages its own overlay internally */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Right panel */}
      <div className="lg:ml-60 flex flex-col min-h-screen">
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main
          className="flex-1 p-6 md:p-8"
          style={{ opacity: contentOpacity, transition: 'opacity 200ms ease-in-out' }}
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardContent>{children}</DashboardContent>;
}
