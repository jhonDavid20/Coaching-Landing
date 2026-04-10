"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

export default function CtaSection() {
  const locale = useLocale();
  const t = useTranslations("landing.cta");

  return (
    <section className="py-20 md:py-28 bg-[#162318]">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4">
          {t("heading")}
        </h2>
        <p className="text-[#c8dcc9] text-base mb-10 leading-relaxed">{t("description")}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/${locale}/auth?tab=register`}
            className="inline-flex items-center justify-center gap-2 bg-[#3a7d44] text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-[#52a85e] transition-colors text-base"
          >
            {t("primary")}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href={`/${locale}/vision`}
            className="inline-flex items-center justify-center gap-2 border border-[#3a7d44]/50 text-[#c8dcc9] font-semibold px-8 py-3.5 rounded-xl hover:border-[#3a7d44] hover:text-white transition-colors text-base"
          >
            {t("secondary")}
          </Link>
        </div>
      </div>
    </section>
  );
}
