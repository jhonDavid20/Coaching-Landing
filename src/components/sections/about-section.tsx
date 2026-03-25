"use client"

import { useTranslations } from "next-intl"

export default function AboutSection() {
  const t = useTranslations("AboutSection")
  const credentials: string[] = t.raw("credentials")

  return (
    <section
      id="about"
      className="bg-[#2D3748] py-16 px-4"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h2 className="text-4xl font-bold text-white mb-8">{t("title")}</h2>
            <p className="text-white text-lg mb-8 leading-relaxed">{t("content")}</p>
            <div className="space-y-4 mb-8">
              {credentials.map((credential, index) => (
                <div key={index} className="flex items-start justify-center lg:justify-start">
                  <span className="text-white mr-3">•</span>
                  <span className="text-white">{credential}</span>
                </div>
              ))}
            </div>
            <p className="text-white text-lg mb-6">{t("cta")}</p>
          </div>
          <div className="flex justify-center mb-8 lg:mb-0">
            <div className="w-80 h-80 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">{t("photoPlaceholder")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
