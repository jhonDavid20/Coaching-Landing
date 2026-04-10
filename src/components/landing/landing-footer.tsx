"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export default function LandingFooter() {
  const locale = useLocale();
  const t = useTranslations("landing.footer");

  return (
    <footer className="bg-[#0f1a10] text-[#c8dcc9] py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
          <div className="max-w-xs">
            <p className="font-bold text-white text-lg mb-2">
              Steady<span className="text-[#3a7d44]">Vitality</span>
            </p>
            <p className="text-sm text-[#617061] leading-relaxed">{t("tagline")}</p>
          </div>

          <div className="flex flex-wrap gap-12">
            <div>
              <p className="text-xs font-semibold text-white uppercase tracking-widest mb-4">{t("product")}</p>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white transition-colors">{t("linkFeatures")}</button></li>
                <li><button onClick={() => document.querySelector("#pricing")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white transition-colors">{t("linkPricing")}</button></li>
                <li><button onClick={() => document.querySelector("#how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white transition-colors">{t("linkHowItWorks")}</button></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-white uppercase tracking-widest mb-4">{t("company")}</p>
              <ul className="space-y-3 text-sm">
                <li><Link href={`/${locale}/vision`} className="hover:text-white transition-colors">{t("linkStory")}</Link></li>
                <li><Link href={`/${locale}/auth`} className="hover:text-white transition-colors">{t("linkLogin")}</Link></li>
                <li><Link href={`/${locale}/auth?tab=register`} className="hover:text-white transition-colors">{t("linkSignup")}</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-[#1e3320] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#617061]">
          <p>© {new Date().getFullYear()} SteadyVitality. {t("copyright")}</p>
          <p>{t("moto")}</p>
        </div>
      </div>
    </footer>
  );
}
