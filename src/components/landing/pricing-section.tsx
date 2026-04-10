"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";

type Plan = {
  name: string; price: string; period: string;
  description: string; cta: string; featured: boolean;
  features: string[];
};

export default function PricingSection() {
  const locale = useLocale();
  const t = useTranslations("landing.pricing");
  const plans = t.raw("plans") as Plan[];

  return (
    <section id="pricing" className="py-20 md:py-28 bg-[#f6f8f5]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="inline-block text-xs font-semibold text-[#3a7d44] bg-[#ddf0df] px-3 py-1.5 rounded-full mb-4">
            {t("badge")}
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0f1f10] leading-tight">
            {t("heading")}
          </h2>
          <p className="text-[#617061] mt-4 text-base">{t("description")}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 flex flex-col gap-6 ${
                plan.featured
                  ? "bg-[#162318] border-[#162318] shadow-xl scale-[1.03]"
                  : "bg-white border-[#d8e0d8]"
              }`}
            >
              <div>
                {plan.featured && (
                  <span className="inline-block text-[10px] font-bold text-[#162318] bg-[#c8dcc9] px-2.5 py-1 rounded-full mb-3 uppercase tracking-widest">
                    {t("popular")}
                  </span>
                )}
                <h3 className={`font-bold text-lg ${plan.featured ? "text-white" : "text-[#0f1f10]"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mt-1 ${plan.featured ? "text-[#c8dcc9]" : "text-[#617061]"}`}>
                  {plan.description}
                </p>
              </div>

              <div className="flex items-end gap-1">
                <span className={`text-4xl font-extrabold ${plan.featured ? "text-white" : "text-[#0f1f10]"}`}>
                  {plan.price}
                </span>
                <span className={`text-sm mb-1 ${plan.featured ? "text-[#c8dcc9]" : "text-[#617061]"}`}>
                  {plan.period}
                </span>
              </div>

              <Link
                href={`/${locale}/auth?tab=register`}
                className={`text-center text-sm font-semibold px-5 py-3 rounded-xl transition-colors ${
                  plan.featured
                    ? "bg-[#3a7d44] text-white hover:bg-[#52a85e]"
                    : "bg-[#f0faf0] text-[#162318] border border-[#d8e0d8] hover:bg-[#ddf0df]"
                }`}
              >
                {plan.cta}
              </Link>

              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${plan.featured ? "text-[#52a85e]" : "text-[#3a7d44]"}`} />
                    <span className={plan.featured ? "text-[#c8dcc9]" : "text-[#617061]"}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
