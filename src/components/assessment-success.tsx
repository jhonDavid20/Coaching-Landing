"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { useTranslations } from "next-intl"

export function AssessmentSuccess() {
  const t = useTranslations("AssessmentSuccess")

  const openCalBooking = (source: string) => {
    // In production, replace with actual Cal.com integration
    console.log(`Opening Cal.com booking from: ${source}`)
    alert(`Cal.com booking would open here (source: ${source})`)
  }

  return (
    <Card className="bg-card dark:bg-[#23272F] text-card-foreground dark:text-white shadow-lg border-0">
      <CardContent className="p-8 text-center">
        <h3 className="text-2xl font-bold text-foreground dark:text-white mb-4">{t("title")}</h3>
        <p className="text-foreground dark:text-gray-300 mb-6">{t("content1")}</p>
        <p className="text-lg font-medium text-foreground dark:text-gray-300 mb-6">{t("content2")}</p>
        <Button
          onClick={() => openCalBooking("post-assessment")}
          className="bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-white dark:text-[#2D3748] dark:hover:bg-white/90 px-8 py-3"
        >
          <Calendar className="mr-2 h-4 w-4" />
          {t("button")}
        </Button>
      </CardContent>
    </Card>
  )
}
