"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { scrollToAppointment } from "@/lib/utils"
import { Calendar, RotateCcw } from "lucide-react"
import { useTranslations } from "next-intl"

interface AssessmentSuccessProps {
  onBackToForm: () => void
}

export function AssessmentSuccess({ onBackToForm }: AssessmentSuccessProps) {
  const t = useTranslations("AssessmentSuccess")
  const f = useTranslations("AssessmentSection")
  return (
    <Card className="bg-card dark:bg-[#23272F] text-card-foreground dark:text-white shadow-lg border-0">
      <CardContent className="p-8 text-center">
        <h3 className="text-2xl font-bold text-foreground dark:text-white mb-4">{t("title")}</h3>
        <p className="text-foreground dark:text-gray-300 mb-6">{t("content1")}</p>
        <p className="text-lg font-medium text-foreground dark:text-gray-300 mb-6">{t("content2")}</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button
            onClick={scrollToAppointment}
            className="bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-white dark:text-[#2D3748] dark:hover:bg-white/90 px-8 py-3"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {t("button")}
          </Button>
          <Button
            className="
              bg-primary text-primary-foreground
              hover:bg-primary/90 hover:text-primary-foreground
              dark:bg-white dark:text-[#2D3748]
              dark:hover:bg-white/90 dark:hover:text-[#2D3748]
              transition-colors
            "
            onClick={onBackToForm}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {f('BackToFormButton')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
