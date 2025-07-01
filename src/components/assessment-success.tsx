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
    <Card className="bg-white shadow-lg border-0">
      <CardContent className="p-8 text-center">
        <h3 className="text-2xl font-bold text-[#2D3748] mb-4">{t("title")}</h3>
        <p className="text-[#2D3748] mb-6">{t("content1")}</p>
        <p className="text-lg font-medium text-[#2D3748] mb-6">{t("content2")}</p>
        <Button
          onClick={() => openCalBooking("post-assessment")}
          className="bg-[#2D3748] hover:bg-[#2D3748]/90 text-white px-8 py-3"
        >
          <Calendar className="mr-2 h-4 w-4" />
          {t("button")}
        </Button>
      </CardContent>
    </Card>
  )
}
