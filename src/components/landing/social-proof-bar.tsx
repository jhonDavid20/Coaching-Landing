"use client";

import { useTranslations } from "next-intl";

export default function SocialProofBar() {
  const t = useTranslations("landing.social");

  const stats = [
    { value: t("coachesValue"),   label: t("coachesLabel") },
    { value: t("clientsValue"),   label: t("clientsLabel") },
    { value: t("retentionValue"), label: t("retentionLabel") },
    { value: t("ratingValue"),    label: t("ratingLabel") },
  ];

  return (
    <section className="border-y border-[#d8e0d8] bg-white py-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl md:text-3xl font-extrabold text-[#162318]">{stat.value}</p>
              <p className="text-sm text-[#617061] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
