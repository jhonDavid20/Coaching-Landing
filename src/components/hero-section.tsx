"use client"

import { Button } from "@/components/ui/button"

import {useTranslations} from 'next-intl';

export default function HeroSection() {
  const t = useTranslations('HeroSection');

  const scrollToAssessment = () => {
    document.getElementById("assessment")?.scrollIntoView({ behavior: "smooth" })
  }

  const openCalBooking = (source: string) => {
    // In production, replace with actual Cal.com integration
    console.log(`Opening Cal.com booking from: ${source}`)
    // Example: window.open('https://cal.com/your-username/15min', '_blank')
    alert(`Cal.com booking would open here (source: ${source})`)
  }

  return (
    <section
      id="home"
      className="
        bg-gradient-to-b
        from-background
        to-muted
        dark:from-[#23272F]
        dark:to-[#1A202C]
        py-20 px-4
      "
    >
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-foreground dark:text-white mb-6 leading-tight">{t('title')}</h1>
        <p className="text-xl text-foreground dark:text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">{t('content')}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="
              px-8 py-4 text-lg
              bg-primary text-primary-foreground
              hover:bg-primary/90 hover:text-primary-foreground
              dark:bg-white dark:text-[#2D3748]
              dark:hover:bg-white/90 dark:hover:text-[#2D3748]
              transition-colors
            "
            onClick={scrollToAssessment}
          >
            {t('AssessmentButton')}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="
               px-8 py-4 text-lg
              bg-primary text-primary-foreground
              hover:bg-primary/90 hover:text-primary-foreground
              dark:bg-white dark:text-[#2D3748]
              dark:hover:bg-white/90 dark:hover:text-[#2D3748]
              transition-colors
            "
            onClick={() => openCalBooking("hero")}
          >
            {t('BookACallButton')}
          </Button>
        </div>
      </div>
    </section>
  )
}
