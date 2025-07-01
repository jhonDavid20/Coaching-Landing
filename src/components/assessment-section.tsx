"use client"

import { useState } from "react"
import { AssessmentForm } from "./assessment-form"
import { AssessmentSuccess } from "./assessment-success"
import { Button } from "./ui/button"
import {useTranslations} from 'next-intl';


interface AssessmentFormData {
  name: string
  email: string
  age: string
  gender: string
  height: string
  weight: string
  activityLevel: string
  goal: string
  experience: string
}

export default function AssessmentSection() {
  const t = useTranslations('AssessmentSection');
  const [showSuccess, setShowSuccess] = useState(false)

  const handleFormSubmit = (data: AssessmentFormData) => {
    console.log("Assessment data:", data)
    // Here you would typically send the data to your backend
    setShowSuccess(true)
  }

  return (
    <section id="assessment" className="bg-background dark:bg-[#23272F] py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold text-foreground dark:text-white text-center mb-12">{t('title')}</h2>
        <p className="text-lg text-foreground dark:text-gray-300 text-center mb-12">{t('content')}</p>
        {showSuccess ? (
          <>
            <AssessmentSuccess />
            <div className="flex justify-center mt-8">
              <Button
                className="
                  bg-primary text-primary-foreground
                  hover:bg-primary/90 hover:text-primary-foreground
                  dark:bg-white dark:text-[#2D3748]
                  dark:hover:bg-white/90 dark:hover:text-[#2D3748]
                  transition-colors
                "
                onClick={() => setShowSuccess(false)}
              >
                {t('BackToFormButton')}
              </Button>
            </div>
          </>
        ) : (
          <AssessmentForm onSubmit={handleFormSubmit} />
        )}
      </div>
    </section>
  )
}
