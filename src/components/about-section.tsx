"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import { useTranslations } from "next-intl"

export default function AboutSection() {
  const t = useTranslations("AboutSection")
  const credentials: string[] = t.raw("credentials")

  const openCalBooking = (source: string) => {
    // In production, replace with actual Cal.com integration
    console.log(`Opening Cal.com booking from: ${source}`)
    alert(`Cal.com booking would open here (source: ${source})`)
  }

  return (
    <section
      id="about"
      className="bg-[#2D3748] py-20 px-4"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-white mb-8">{t("title")}</h2>
            <p className="text-white text-lg mb-8 leading-relaxed">{t("content")}</p>
            <div className="space-y-4 mb-8">
              {credentials.map((credential, index) => (
                <div key={index} className="flex items-start">
                  <span className="text-white mr-3">•</span>
                  <span className="text-white">{credential}</span>
                </div>
              ))}
            </div>
            <div className="text-center lg:text-left">
              <p className="text-white text-lg mb-6">{t("cta")}</p>
              <Button
                onClick={() => openCalBooking("about")}
                className="
                  bg-white text-[#2D3748] 
                  hover:bg-gray-200 hover:text-[#2D3748]
                  dark:bg-gray-100 dark:text-[#2D3748] 
                  dark:hover:bg-white dark:hover:text-[#2D3748]
                  px-8 py-3 transition-colors
                "
              >
                <Calendar className="mr-2 h-4 w-4" />
                {t("button")}
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="w-80 h-80 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">{t("photoPlaceholder")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
