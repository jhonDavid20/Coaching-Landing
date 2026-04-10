"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";

type Testimonial = { name: string; role: string; avatar: string; quote: string };

export default function TestimonialsSection() {
  const t = useTranslations("landing.testimonials");
  const items = t.raw("items") as Testimonial[];

  return (
    <section id="testimonials" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="inline-block text-xs font-semibold text-[#3a7d44] bg-[#ddf0df] px-3 py-1.5 rounded-full mb-4">
            {t("badge")}
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0f1f10] leading-tight">
            {t("heading")}
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.name} className="bg-[#f6f8f5] border border-[#d8e0d8] rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#3a7d44] text-[#3a7d44]" />
                ))}
              </div>
              <p className="text-sm text-[#617061] leading-relaxed flex-1">&quot;{item.quote}&quot;</p>
              <div className="flex items-center gap-3 pt-2 border-t border-[#d8e0d8]">
                <div className="w-9 h-9 rounded-full bg-[#ddf0df] flex items-center justify-center text-[#2d5a31] text-xs font-bold">
                  {item.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0f1f10]">{item.name}</p>
                  <p className="text-xs text-[#617061]">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
