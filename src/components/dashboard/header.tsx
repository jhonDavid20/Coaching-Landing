'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth/session-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sun, Moon, Bell, Home, LogOut, ChevronDown, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { logoutUserNoRedirect } from '@/actions/auth';
import { useLoading } from '@/components/providers/loading-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const t = useTranslations('dashboard');
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { startLoading } = useLoading();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleLocale = () => {
    const nextLocale = locale === 'en' ? 'es' : 'en';
    router.replace(pathname, { locale: nextLocale, scroll: false });
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 z-50">
      <div className="h-full px-4 md:px-6">
        <div className="flex items-center justify-between h-full">
          {/* Left side - Menu button (mobile) + Welcome message */}
          <div className="flex items-center space-x-3">
            {/* Hamburger menu button - visible only on mobile */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Welcome message - hidden on small mobile, visible on sm and up */}
            <div className="hidden sm:block">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                {t('welcome')}
                {user && (
                  <span className="text-blue-600 dark:text-blue-400 ml-2">
                    {user.firstName || user.username}
                  </span>
                )}
              </h1>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Language Toggle */}
            <button
              onClick={toggleLocale}
              className="px-2 py-1.5 md:px-3 md:py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {locale === 'en' ? 'ES' : 'EN'}
            </button>

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-1.5 md:p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-4 w-4 md:h-5 md:w-5" /> : <Moon className="h-4 w-4 md:h-5 md:w-5" />}
              </button>
            )}

            {/* Notifications - hidden on small mobile */}
            <button className="hidden sm:flex p-1.5 md:p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative">
              <Bell className="h-4 w-4 md:h-5 md:w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
            </button>
            
            {/* User Dropdown Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-2 md:space-x-3 px-2 py-1.5 md:px-3 md:py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <Avatar className="h-7 w-7 md:h-8 md:w-8">
                    <AvatarImage src={user.avatar || ""} alt={`${user.firstName} ${user.lastName}`} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs md:text-sm">
                      {user.firstName?.charAt(0) || user.username?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {user.role}
                    </p>
                  </div>
                  <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-gray-600 dark:text-gray-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-gray-900 dark:text-white">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      startLoading();
                      window.location.href = `/${locale}`;
                    }}
                    className="cursor-pointer text-gray-900 dark:text-white"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Go to Landing
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        startLoading();
                        await logoutUserNoRedirect();
                        window.location.href = `/${locale}`;
                      } catch (error) {
                        console.error('Logout failed:', error);
                      }
                    }}
                    className="cursor-pointer text-gray-900 dark:text-white"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}