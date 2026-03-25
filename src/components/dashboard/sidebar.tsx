'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useParams } from 'next/navigation';
import { User, LogOut, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems = [
  {
    href: '/dashboard/profile',
    icon: User,
    label: 'profile'
  }
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const t = useTranslations('dashboard');
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;

  const handleLogout = async () => {
    try {
      const { logoutUserNoRedirect } = await import("@/actions/auth");
      await logoutUserNoRedirect();
      window.location.href = `/${locale}`;
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile header with close button */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">FC</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  FitCoach
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <p className="text-xl font-bold text-gray-600 dark:text-gray-400 mt-4 ">
              {t('title')}
            </p>
          </div>

          <nav className="flex-1 mt-6 flex flex-col">
            <div className="px-6 space-y-2 mb-8">
              {sidebarItems.map((item) => {
                const isActive = pathname === `/${locale}${item.href}`;
                const Icon = item.icon;

                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      window.location.href = `/${locale}${item.href}`;
                      onClose();
                    }}
                    className={cn(
                      "flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors text-left",
                      isActive
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    )}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {t(item.label)}
                  </button>
                );
              })}
            </div>

            <div className="mt-auto px-6 pt-6 pb-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3" />
                {t('logout')}
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">FC</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              FitCoach
            </h2>
          </div>
          <p className="text-xl font-bold text-gray-600 dark:text-gray-400 mt-4 ">
            {t('title')}
          </p>
        </div>

        <nav className="flex-1 mt-6 flex flex-col">
          <div className="px-6 space-y-2 mb-8">
            {sidebarItems.map((item) => {
              const isActive = pathname === `/${locale}${item.href}`;
              const Icon = item.icon;

              return (
                <button
                  key={item.href}
                  onClick={() => window.location.href = `/${locale}${item.href}`}
                  className={cn(
                    "flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors text-left",
                    isActive
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {t(item.label)}
                </button>
              );
            })}
          </div>

          <div className="mt-auto px-6 pt-6 pb-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              {t('logout')}
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}