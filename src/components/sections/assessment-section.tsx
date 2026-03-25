"use client"

import { useState } from "react"
import { AssessmentForm } from "./assessment-form"
import { AssessmentSuccess } from "./assessment-success"
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('AssessmentSection')
  const [showSuccess, setShowSuccess] = useState(false)

  const handleFormSubmit = (data: AssessmentFormData) => {
    console.log("Assessment data:", data)
    // Here you would typically send the data to your backend
    setShowSuccess(true)
  }

  return (
    <section id="assessment" className="bg-background dark:bg-[#23272F] py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold text-foreground dark:text-white text-center mb-12">{t('title')}</h2>
        <p className="text-lg text-foreground dark:text-gray-300 text-center mb-12">{t('content')}</p>
        {showSuccess ? (
          <AssessmentSuccess onBackToForm={() => setShowSuccess(false)} />
        ) : (
          <AssessmentForm onSubmit={handleFormSubmit} />
        )}
      </div>
    </section>
  )
}
