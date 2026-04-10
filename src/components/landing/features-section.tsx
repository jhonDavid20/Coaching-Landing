"use client";

import { useTranslations } from "next-intl";
import {
  Users, Package, BarChart3, CalendarCheck, MessageSquare, ShieldCheck,
} from "lucide-react";

const ICONS = [Users, Package, BarChart3, CalendarCheck, MessageSquare, ShieldCheck];

export default function FeaturesSection() {
  const t = useTranslations("landing.features");
  const items = t.raw("items") as Array<{ title: string; description: string }>;

  return (
    <section id="features" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-xs font-semibold text-[#3a7d44] bg-[#ddf0df] px-3 py-1.5 rounded-full mb-4">
            {t("badge")}
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0f1f10] leading-tight">
            {t("heading")}
          </h2>
          <p className="text-[#617061] mt-4 text-base leading-relaxed">{t("description")}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((feat, i) => {
            const Icon = ICONS[i] ?? Users;
            return (
              <div
                key={feat.title}
                className="bg-white rounded-2xl border border-[#d8e0d8] p-6 hover:shadow-md transition-shadow group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#ddf0df] flex items-center justify-center mb-4 group-hover:bg-[#162318] transition-colors">
                  <Icon className="w-5 h-5 text-[#3a7d44] group-hover:text-[#c8dcc9] transition-colors" />
                </div>
                <h3 className="font-bold text-[#0f1f10] mb-2">{feat.title}</h3>
                <p className="text-sm text-[#617061] leading-relaxed">{feat.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
