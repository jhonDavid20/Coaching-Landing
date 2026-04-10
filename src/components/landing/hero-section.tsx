"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, CheckCircle2, Users, TrendingUp, Star } from "lucide-react";

export default function HeroSection() {
  const locale = useLocale();
  const t = useTranslations("landing.hero");

  const TRUST = [t("trust1"), t("trust2"), t("trust3")];

  return (
    <section id="hero" className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#ddf0df]/50 blur-3xl translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#ddf0df]/30 blur-3xl -translate-x-1/4 translate-y-1/4" />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[#ddf0df] text-[#2d5a31] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Star className="w-3.5 h-3.5 fill-[#3a7d44]" />
              {t("badge")}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#0f1f10] leading-[1.1] tracking-tight mb-6">
              {t("headlinePart1")}{" "}
              <span className="text-[#3a7d44]">{t("headlinePart2")}</span>
            </h1>

            <p className="text-lg text-[#617061] max-w-lg mb-8 leading-relaxed">
              {t("description")}
            </p>

            <ul className="flex flex-wrap gap-x-6 gap-y-2 mb-10">
              {TRUST.map((pt) => (
                <li key={pt} className="flex items-center gap-1.5 text-sm text-[#617061]">
                  <CheckCircle2 className="w-4 h-4 text-[#3a7d44] flex-shrink-0" />
                  {pt}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-4">
              <Link
                href={`/${locale}/auth?tab=register`}
                className="inline-flex items-center gap-2 bg-[#162318] text-[#eef6ee] font-semibold px-7 py-3.5 rounded-xl hover:bg-[#243d27] transition-colors text-base"
              >
                {t("ctaPrimary")}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/${locale}/vision`}
                className="inline-flex items-center gap-2 border border-[#d8e0d8] text-[#162318] font-semibold px-7 py-3.5 rounded-xl hover:bg-[#e4ede4] transition-colors text-base"
              >
                {t("ctaSecondary")}
              </Link>
            </div>
          </div>

          {/* Right — mock dashboard */}
          <div className="relative hidden lg:block">
            <div className="rounded-2xl bg-white border border-[#d8e0d8] shadow-xl overflow-hidden">
              <div className="bg-[#162318] px-5 py-4 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                </div>
                <span className="text-[#c8dcc9] text-xs font-medium mx-auto">{t("mockTitle")}</span>
              </div>

              <div className="grid grid-cols-3 gap-px bg-[#d8e0d8] border-b border-[#d8e0d8]">
                {[
                  { label: t("mockActiveClients"), value: "24", icon: Users },
                  { label: t("mockSessionsDone"),  value: "186", icon: TrendingUp },
                  { label: t("mockMonthlyRev"),    value: "$12.4k", icon: Star },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-white px-4 py-4">
                    <p className="text-xs text-[#617061] mb-1">{label}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-[#0f1f10]">{value}</p>
                      <div className="w-7 h-7 rounded-lg bg-[#ddf0df] flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-[#3a7d44]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="divide-y divide-[#eff2ee]">
                {[
                  { name: "Emma Johnson",     pkg: "Premium Training",    pct: 75, active: true },
                  { name: "Michael Chen",     pkg: "Nutrition + Fitness", pct: 60, active: true },
                  { name: "Sophia Williams",  pkg: "Basic Plan",          pct: 90, active: true },
                  { name: "James Rodriguez",  pkg: "Premium Training",    pct: 45, active: false },
                ].map((client) => (
                  <div key={client.name} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-full bg-[#ddf0df] flex items-center justify-center text-[#2d5a31] text-xs font-bold flex-shrink-0">
                      {client.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0f1f10] truncate">{client.name}</p>
                      <p className="text-xs text-[#617061] truncate">{client.pkg}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24">
                        <div className="h-1.5 rounded-full bg-[#eff2ee] overflow-hidden">
                          <div className="h-full rounded-full bg-[#3a7d44]" style={{ width: `${client.pct}%` }} />
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${client.active ? "bg-[#ddf0df] text-[#2d5a31]" : "bg-amber-50 text-amber-700"}`}>
                        {client.active ? "Active" : "Paused"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -bottom-4 -left-6 bg-white border border-[#d8e0d8] rounded-xl shadow-lg px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#ddf0df] flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#3a7d44]" />
              </div>
              <div>
                <p className="text-[10px] text-[#617061]">{t("mockThisMonth")}</p>
                <p className="text-sm font-bold text-[#0f1f10]">{t("mockNewClients")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
