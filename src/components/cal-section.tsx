"use client"

import Cal from "@calcom/embed-react"
import { useTranslations } from "next-intl"

// Cal.com booking config — override via environment variables.
const CAL_LINK = process.env.NEXT_PUBLIC_CAL_LINK ?? "jhonda/30min"
const CAL_NAMESPACE = process.env.NEXT_PUBLIC_CAL_NAMESPACE ?? "coaching"

export default function CalSection() {
  const t = useTranslations("CalSection")
  return (
    <section
      id="appointment"
      className="bg-background dark:bg-[#23272F] relative py-8 px-4 flex justify-center"
    >
      <div className="w-full max-w-l bg-white dark:bg-[#181C23] rounded-lg shadow-lg p-4 sm:p-8 overflow-hidden min-h-[500px]">
        <h2 className="text-3xl font-bold text-center mb-6 text-foreground dark:text-white">
          {t("title")}
        </h2>
        <p className="text-lg text-foreground dark:text-gray-300 text-center">
          {t('content')}
        </p>
        <Cal
          namespace={CAL_NAMESPACE}
          calLink={CAL_LINK}
          style={{
            paddingBottom: "2rem",
            width: "100%",
            height: "100%",
            minWidth: 0,
            borderRadius: "0.5rem",
            background: "transparent",
          }}
          config={{ layout: "month_view" }}
        />
      </div>
    </section>
  )
}