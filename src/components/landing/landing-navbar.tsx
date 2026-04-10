"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useLocaleSwitch } from "@/components/providers/locale-switch-provider";
import { Menu, X } from "lucide-react";

export default function LandingNavbar() {
  const locale = useLocale();
  const t = useTranslations("landing.nav");
  const { toggleLocale, isTransitioning } = useLocaleSwitch();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const NAV_LINKS = [
    { label: t("features"),     href: "#features" },
    { label: t("howItWorks"),   href: "#how-it-works" },
    { label: t("pricing"),      href: "#pricing" },
    { label: t("testimonials"), href: "#testimonials" },
  ];

  const scrollTo = (href: string) => {
    setOpen(false);
    if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-[#d8e0d8]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#162318] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#c8dcc9]">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold text-lg text-[#162318] tracking-tight">
            Steady<span className="text-[#3a7d44]">Vitality</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="text-sm font-medium text-[#617061] hover:text-[#162318] transition-colors"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleLocale}
            disabled={isTransitioning}
            className="text-xs font-semibold text-[#617061] border border-[#d8e0d8] rounded-md px-3 py-1.5 hover:bg-[#eff2ee] hover:text-[#162318] transition-colors disabled:opacity-50"
          >
            {locale === "en" ? "ES" : "EN"}
          </button>
          <Link
            href={`/${locale}/auth`}
            className="text-sm font-medium text-[#617061] hover:text-[#162318] transition-colors px-4 py-2"
          >
            {t("login")}
          </Link>
          <Link
            href={`/${locale}/auth?tab=register`}
            className="text-sm font-semibold bg-[#162318] text-[#eef6ee] px-5 py-2 rounded-lg hover:bg-[#243d27] transition-colors"
          >
            {t("getStarted")}
          </Link>
        </div>

        {/* Mobile: language + hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={toggleLocale}
            disabled={isTransitioning}
            className="text-xs font-semibold text-[#617061] border border-[#d8e0d8] rounded-md px-2.5 py-1.5 hover:bg-[#eff2ee] transition-colors disabled:opacity-50"
          >
            {locale === "en" ? "ES" : "EN"}
          </button>
          <button
            className="p-2 rounded-lg text-[#162318]"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-[#d8e0d8] px-6 pb-6 pt-4 space-y-4">
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="block w-full text-left text-sm font-medium text-[#617061] hover:text-[#162318] py-2"
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 flex flex-col gap-3">
            <Link
              href={`/${locale}/auth`}
              className="text-center text-sm font-medium border border-[#d8e0d8] text-[#162318] px-4 py-2.5 rounded-lg"
              onClick={() => setOpen(false)}
            >
              {t("login")}
            </Link>
            <Link
              href={`/${locale}/auth?tab=register`}
              className="text-center text-sm font-semibold bg-[#162318] text-[#eef6ee] px-4 py-2.5 rounded-lg"
              onClick={() => setOpen(false)}
            >
              {t("getStarted")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
