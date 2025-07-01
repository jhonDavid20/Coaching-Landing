"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Utensils, TrendingUp } from "lucide-react"
import { useTranslations } from "next-intl"

export default function ServicesSection() {
  const t = useTranslations("ServicesSection")
  const services: { title: string; description: string }[] = t.raw("services")
  const icons = [User, Utensils, TrendingUp]

  return (
    <section
      id="services"
      className="
    bg-gradient-to-b
    from-muted
    to-background
    dark:from-[#1A202C]
    dark:to-[#23272F]
    py-20 px-4
  "
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-foreground dark:text-white text-center mb-16">{t("title")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = icons[index]
            return (
              <Card key={index} className="bg-card dark:bg-[#23272F] text-card-foreground dark:text-white shadow-lg border-0 hover:shadow-xl transition-shadow">
                <CardHeader className="text-center pb-4">
                  <Icon className="h-12 w-12 text-primary dark:text-white mx-auto mb-4" />
                  <CardTitle className="text-xl font-bold text-foreground dark:text-white">{service.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-foreground dark:text-gray-300 leading-relaxed">{service.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
