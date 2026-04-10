"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useLocaleSwitch } from "@/components/providers/locale-switch-provider";

export default function AuthHeader() {
  const locale = useLocale();
  const { toggleLocale, isTransitioning } = useLocaleSwitch();

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-[#d8e0d8] bg-white flex-shrink-0">
      {/* Logo */}
      <Link
        href={`/${locale}`}
        className="flex items-center gap-2 font-bold text-[#162318] text-base"
      >
        <div className="w-6 h-6 rounded-md bg-[#162318] flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#c8dcc9]">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        Steady<span className="text-[#3a7d44]">Vitality</span>
      </Link>

      {/* Language toggle */}
      <button
        onClick={toggleLocale}
        disabled={isTransitioning}
        className="text-xs font-semibold text-[#617061] border border-[#d8e0d8] rounded-md px-3 py-1.5 hover:bg-[#eff2ee] hover:text-[#162318] transition-colors disabled:opacity-50"
      >
        {locale === "en" ? "ES" : "EN"}
      </button>
    </header>
  );
}
