"use client"

import { useState } from "react"
import { AssessmentForm } from "./assessment-form"
import { AssessmentSuccess } from "./assessment-success"
import { Button } from "./ui/button"

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
  const [showSuccess, setShowSuccess] = useState(false)

  const handleFormSubmit = (data: AssessmentFormData) => {
    console.log("Assessment data:", data)
    // Here you would typically send the data to your backend
    setShowSuccess(true)
  }

  return (
    <section id="assessment" className="bg-[#F7FAFC] py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold text-[#2D3748] text-center mb-12">Free Fitness Assessment</h2>
        {showSuccess ? (
          <>
            <AssessmentSuccess />
            <div className="flex justify-center mt-8">
              <Button onClick={() => setShowSuccess(false)}>
                New Assessment
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
