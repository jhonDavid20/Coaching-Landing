"use client"

import { useState } from "react"
import { AssessmentForm } from "./assessment-form"
import { AssessmentSuccess } from "./assessment-success"
import { useTranslations, useLocale } from 'next-intl'

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
  const locale = useLocale()
  const [showSuccess, setShowSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFormSubmit = async (data: AssessmentFormData) => {
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
      })

      if (!response.ok) {
        throw new Error("Request failed")
      }

      setShowSuccess(true)
    } catch (err) {
      console.error("Assessment submission error:", err)
      setError(t('SubmitError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="assessment" className="bg-background dark:bg-[#23272F] py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold text-foreground dark:text-white text-center mb-12">{t('title')}</h2>
        <p className="text-lg text-foreground dark:text-gray-300 text-center mb-12">{t('content')}</p>
        {showSuccess ? (
          <AssessmentSuccess onBackToForm={() => setShowSuccess(false)} />
        ) : (
          <>
            {error && (
              <p className="text-red-500 text-center mb-6" role="alert">
                {error}
              </p>
            )}
            <AssessmentForm onSubmit={handleFormSubmit} submitting={submitting} />
          </>
        )}
      </div>
    </section>
  )
}
