'use client';

import { useAuth } from '@/components/auth/session-provider';
import { Bell, Menu } from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import { useLocaleSwitch } from '@/components/providers/locale-switch-provider';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const t = useTranslations('DashboardHeader');
  const { user } = useAuth();
  const locale = useLocale();
  const { toggleLocale, isTransitioning } = useLocaleSwitch();

  const greeting = () => {
    const h = new Date().getHours();
    console.log(h);
    if (h < 12) return t('GoodMorning');
    if (h < 18) return t('GoodAfternoon');
    return t('GoodEvening');
  };

  return (
    <header className="h-16 bg-white border-b border-[#d8e0d8] flex items-center justify-between px-6 flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-4">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg border border-[#d8e0d8] text-[#617061] hover:bg-[#eff2ee] transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-lg font-bold text-[#0f1f10] leading-tight">
            {greeting()},{' '}
            <span className="text-[#3a7d44]">
              {user?.firstName || user?.username || '—'}
            </span>
          </h1>
          <p className="text-xs text-[#617061] hidden sm:block capitalize">
            {t(user?.role === 'coach' ? 'Coach' : 'Client')}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Language */}
        <button
          onClick={toggleLocale}
          disabled={isTransitioning}
          className="text-xs font-semibold text-[#617061] border border-[#d8e0d8] rounded-md px-3 py-1.5 hover:bg-[#eff2ee] hover:text-[#162318] transition-colors disabled:opacity-50"
        >
          {locale === 'en' ? 'ES' : 'EN'}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg border border-[#d8e0d8] text-[#617061] hover:bg-[#eff2ee] transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#3a7d44] rounded-full" />
        </button>

      </div>
    </header>
  );
}
