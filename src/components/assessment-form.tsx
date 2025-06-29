"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

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

interface AssessmentFormProps {
  onSubmit: (data: AssessmentFormData) => void
}

export function AssessmentForm({ onSubmit }: AssessmentFormProps) {
  const [bmi, setBmi] = useState<number | null>(null)
  const [bmiCategory, setBmiCategory] = useState<string>("")
  const [recommendations, setRecommendations] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AssessmentFormData>()

  const watchedHeight = watch("height")
  const watchedWeight = watch("weight")
  const watchedGoal = watch("goal")
  const watchedActivityLevel = watch("activityLevel")

  // Calculate BMI and category
  const calculateBMI = (height: string, weight: string) => {
    const h = Number.parseFloat(height)
    const w = Number.parseFloat(weight)
    if (h > 0 && w > 0) {
      const bmiValue = w / (h / 100) ** 2
      setBmi(Math.round(bmiValue * 10) / 10)

      if (bmiValue < 18.5) setBmiCategory("Underweight")
      else if (bmiValue < 25) setBmiCategory("Normal Weight")
      else if (bmiValue < 30) setBmiCategory("Overweight")
      else setBmiCategory("Obese")
    } else {
      setBmi(null)
      setBmiCategory("")
    }
  }

  // Generate recommendations based on form data
  const generateRecommendations = (goal: string, activityLevel: string, bmiCategory: string) => {
    const recs: string[] = []

    if (goal === "lose-weight") {
      recs.push("Focus on creating a moderate caloric deficit through diet and exercise")
      recs.push("Incorporate both cardio and strength training for optimal results")
    } else if (goal === "build-muscle") {
      recs.push("Prioritize progressive overload in strength training")
      recs.push("Ensure adequate protein intake (1.6-2.2g per kg body weight)")
    } else if (goal === "tone-up") {
      recs.push("Combine resistance training with moderate cardio")
      recs.push("Focus on body recomposition rather than just weight loss")
    }

    if (activityLevel === "sedentary") {
      recs.push("Start with 2-3 workout sessions per week to build consistency")
    } else if (activityLevel === "very-active" || activityLevel === "extremely-active") {
      recs.push("Consider periodization to prevent overtraining and optimize recovery")
    }

    if (bmiCategory === "Underweight") {
      recs.push("Focus on gradual weight gain through increased caloric intake and strength training")
    } else if (bmiCategory === "Overweight" || bmiCategory === "Obese") {
      recs.push("Prioritize sustainable lifestyle changes over quick fixes")
    }

    setRecommendations(recs)
  }

  // Watch for changes and update calculations
  useEffect(() => {
    if (watchedHeight && watchedWeight) {
      calculateBMI(watchedHeight, watchedWeight)
    }
  }, [watchedHeight, watchedWeight])

  useEffect(() => {
    if (watchedGoal && watchedActivityLevel && bmiCategory) {
      generateRecommendations(watchedGoal, watchedActivityLevel, bmiCategory)
    }
  }, [watchedGoal, watchedActivityLevel, bmiCategory])

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardContent className="p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name" className="text-[#2D3748] font-medium">
                Name *
              </Label>
              <Input
                id="name"
                {...register("name", { required: "Name is required" })}
                className="border-[#2D3748] focus:border-[#2D3748] focus:ring-[#2D3748]"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email" className="text-[#2D3748] font-medium">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email", { required: "Email is required" })}
                className="border-[#2D3748] focus:border-[#2D3748] focus:ring-[#2D3748]"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="age" className="text-[#2D3748] font-medium">
                Age
              </Label>
              <Select onValueChange={(value) => setValue("age", value)}>
                <SelectTrigger className="border-[#2D3748]">
                  <SelectValue placeholder="Select age range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18-25">18-25</SelectItem>
                  <SelectItem value="26-35">26-35</SelectItem>
                  <SelectItem value="36-45">36-45</SelectItem>
                  <SelectItem value="46-55">46-55</SelectItem>
                  <SelectItem value="56+">56+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="gender" className="text-[#2D3748] font-medium">
                Gender
              </Label>
              <Select onValueChange={(value) => setValue("gender", value)}>
                <SelectTrigger className="border-[#2D3748]">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="height" className="text-[#2D3748] font-medium">
                Height (cm)
              </Label>
              <Input
                id="height"
                type="number"
                {...register("height")}
                className="border-[#2D3748] focus:border-[#2D3748] focus:ring-[#2D3748]"
              />
            </div>
            <div>
              <Label htmlFor="weight" className="text-[#2D3748] font-medium">
                Weight (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                {...register("weight")}
                className="border-[#2D3748] focus:border-[#2D3748] focus:ring-[#2D3748]"
              />
            </div>
          </div>

          {/* BMI Display */}
          {bmi && (
            <div className="bg-[#F7FAFC] p-4 rounded-lg">
              <p className="text-[#2D3748] font-medium">
                BMI: <span className="font-bold">{bmi}</span> ({bmiCategory})
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="activityLevel" className="text-[#2D3748] font-medium">
              Activity Level
            </Label>
            <Select onValueChange={(value) => setValue("activityLevel", value)}>
              <SelectTrigger className="border-[#2D3748]">
                <SelectValue placeholder="Select activity level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">Sedentary</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="very-active">Very Active</SelectItem>
                <SelectItem value="extremely-active">Extremely Active</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="goal" className="text-[#2D3748] font-medium">
              Primary Goal
            </Label>
            <Select onValueChange={(value) => setValue("goal", value)}>
              <SelectTrigger className="border-[#2D3748]">
                <SelectValue placeholder="Select your goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lose-weight">Lose Weight</SelectItem>
                <SelectItem value="build-muscle">Build Muscle</SelectItem>
                <SelectItem value="tone-up">Tone Up</SelectItem>
                <SelectItem value="improve-fitness">Improve Fitness</SelectItem>
                <SelectItem value="maintain-weight">Maintain Weight</SelectItem>
                <SelectItem value="athletic-performance">Athletic Performance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="experience" className="text-[#2D3748] font-medium">
              Fitness Experience
            </Label>
            <Textarea
              id="experience"
              {...register("experience")}
              placeholder="Tell us about your fitness background, any injuries, or specific concerns..."
              className="border-[#2D3748] focus:border-[#2D3748] focus:ring-[#2D3748] min-h-[100px]"
            />
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="bg-[#F7FAFC] p-6 rounded-lg">
              <h4 className="font-semibold text-[#2D3748] mb-3">Initial Recommendations:</h4>
              <ul className="space-y-2">
                {recommendations.map((rec, index) => (
                  <li key={index} className="text-[#2D3748] text-sm">
                    • {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button type="submit" className="w-full bg-[#2D3748] hover:bg-[#2D3748]/90 text-white py-3 text-lg">
            Get My Custom Plan
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
