'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';

const FADE_MS = 200;

interface LocaleSwitchContextType {
  contentOpacity: number;
  isTransitioning: boolean;
  toggleLocale: () => void;
}

const LocaleSwitchContext = createContext<LocaleSwitchContextType>({
  contentOpacity: 1,
  isTransitioning: false,
  toggleLocale: () => {},
});

export function LocaleSwitchProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const [contentOpacity, setContentOpacity] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevLocaleRef = useRef(locale);

  // When the locale actually changes (navigation resolved), fade back in
  useEffect(() => {
    if (prevLocaleRef.current !== locale) {
      prevLocaleRef.current = locale;
      // Double-RAF ensures new content is painted before we start fading in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setContentOpacity(1);
          setIsTransitioning(false);
        });
      });
    }
  }, [locale]);

  const toggleLocale = useCallback(() => {
    if (isTransitioning) return;
    const nextLocale = locale === 'en' ? 'es' : 'en';

    setIsTransitioning(true);
    setContentOpacity(0);

    // Wait for fade-out to finish, then navigate
    setTimeout(() => {
      router.replace(pathname, { locale: nextLocale, scroll: false });
    }, FADE_MS);
  }, [locale, pathname, router, isTransitioning]);

  return (
    <LocaleSwitchContext.Provider value={{ contentOpacity, isTransitioning, toggleLocale }}>
      {children}
    </LocaleSwitchContext.Provider>
  );
}

export const useLocaleSwitch = () => useContext(LocaleSwitchContext);
