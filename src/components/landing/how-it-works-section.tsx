"use client";

import { useTranslations } from "next-intl";

export default function HowItWorksSection() {
  const t = useTranslations("landing.howItWorks");
  const steps = t.raw("steps") as Array<{ num: string; title: string; description: string }>;

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-[#162318]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-xs font-semibold text-[#c8dcc9] bg-[#243d27] px-3 py-1.5 rounded-full mb-4">
            {t("badge")}
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
            {t("heading")}
          </h2>
          <p className="text-[#c8dcc9] mt-4 text-base leading-relaxed">{t("description")}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={step.num} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-[calc(100%-1rem)] w-8 h-px bg-[#3a7d44]/40" />
              )}
              <div className="bg-[#1e3320] rounded-2xl border border-[#2d5a31]/50 p-6 h-full">
                <div className="text-3xl font-extrabold text-[#3a7d44] mb-4 font-mono">{step.num}</div>
                <h3 className="font-bold text-white mb-2 text-base">{step.title}</h3>
                <p className="text-sm text-[#c8dcc9] leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
