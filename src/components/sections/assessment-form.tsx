"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
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

interface AssessmentFormProps {
  onSubmit: (data: AssessmentFormData) => void
}

export function AssessmentForm({ onSubmit }: AssessmentFormProps) {
  const t = useTranslations('AssessmentSection');
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
    <Card className="bg-card dark:bg-[#23272F] shadow-lg border border-border dark:border-white">
      <CardContent className="p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name" className="text-foreground dark:text-white font-medium">
                {t('Name')} *
              </Label>
              <Input
                id="name"
                {...register("name", { required: t('NameRequired') })}
                className="border-border dark:border-white focus:border-primary focus:ring-primary bg-background dark:bg-[#23272F] text-foreground dark:text-white"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email" className="text-foreground dark:text-white font-medium">
                {t('Email')} *
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email", { required: t('EmailRequired') })}
                className="border-border dark:border-white focus:border-primary focus:ring-primary bg-background dark:bg-[#23272F] text-foreground dark:text-white"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="age" className="text-foreground dark:text-white font-medium">
                {t('Age')}
              </Label>
              <Select onValueChange={(value) => setValue("age", value)}>
                <SelectTrigger className="border-border dark:border-white bg-background dark:bg-[#23272F] text-foreground dark:text-white">
                  <SelectValue placeholder={t('AgePlaceholder')} />
                </SelectTrigger>
                <SelectContent className="bg-background dark:bg-[#23272F] text-foreground dark:text-white">
                  <SelectItem value="18-25">18-25</SelectItem>
                  <SelectItem value="26-35">26-35</SelectItem>
                  <SelectItem value="36-45">36-45</SelectItem>
                  <SelectItem value="46-55">46-55</SelectItem>
                  <SelectItem value="56+">56+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="gender" className="text-foreground dark:text-white font-medium">
                {t('Gender')}
              </Label>
              <Select onValueChange={(value) => setValue("gender", value)}>
                <SelectTrigger className="border-border dark:border-white bg-background dark:bg-[#23272F] text-foreground dark:text-white">
                  <SelectValue placeholder={t('GenderPlaceholder')} />
                </SelectTrigger>
                <SelectContent className="bg-background dark:bg-[#23272F] text-foreground dark:text-white">
                  <SelectItem value="male">{t('Male')}</SelectItem>
                  <SelectItem value="female">{t('Female')}</SelectItem>
                  <SelectItem value="other">{t('Other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="height" className="text-foreground dark:text-white font-medium">
                {t('Height')}
              </Label>
              <Input
                id="height"
                type="number"
                {...register("height")}
                className="border-border dark:border-white focus:border-primary focus:ring-primary bg-background dark:bg-[#23272F] text-foreground dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="weight" className="text-foreground dark:text-white font-medium">
                {t('Weight')}
              </Label>
              <Input
                id="weight"
                type="number"
                {...register("weight")}
                className="border-border dark:border-white focus:border-primary focus:ring-primary bg-background dark:bg-[#23272F] text-foreground dark:text-white"
              />
            </div>
          </div>

          {/* BMI Display */}
          {bmi && (
            <div className="bg-muted dark:bg-[#23272F] p-4 rounded-lg">
              <p className="text-foreground dark:text-white font-medium">
                {t('BMI')}: <span className="font-bold">{bmi}</span> ({bmiCategory})
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="activityLevel" className="text-foreground dark:text-white font-medium">
              {t('ActivityLevel')}
            </Label>
            <Select onValueChange={(value) => setValue("activityLevel", value)}>
              <SelectTrigger className="border-border dark:border-white bg-background dark:bg-[#23272F] text-foreground dark:text-white">
                <SelectValue placeholder={t('ActivityLevelPlaceholder')} />
              </SelectTrigger>
              <SelectContent className="bg-background dark:bg-[#23272F] text-foreground dark:text-white">
                <SelectItem value="sedentary">{t('Sedentary')}</SelectItem>
                <SelectItem value="light">{t('Light')}</SelectItem>
                <SelectItem value="moderate">{t('Moderate')}</SelectItem>
                <SelectItem value="very-active">{t('VeryActive')}</SelectItem>
                <SelectItem value="extremely-active">{t('ExtremelyActive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="goal" className="text-foreground dark:text-white font-medium">
              {t('Goal')}
            </Label>
            <Select onValueChange={(value) => setValue("goal", value)}>
              <SelectTrigger className="border-border dark:border-white bg-background dark:bg-[#23272F] text-foreground dark:text-white">
                <SelectValue placeholder={t('GoalPlaceholder')} />
              </SelectTrigger>
              <SelectContent className="bg-background dark:bg-[#23272F] text-foreground dark:text-white">
                <SelectItem value="lose-weight">{t('LoseWeight')}</SelectItem>
                <SelectItem value="build-muscle">{t('BuildMuscle')}</SelectItem>
                <SelectItem value="tone-up">{t('ToneUp')}</SelectItem>
                <SelectItem value="improve-fitness">{t('ImproveFitness')}</SelectItem>
                <SelectItem value="maintain-weight">{t('MaintainWeight')}</SelectItem>
                <SelectItem value="athletic-performance">{t('AthleticPerformance')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="experience" className="text-foreground dark:text-white font-medium">
              {t('FitnessExperience')}
            </Label>
            <Textarea
              id="experience"
              {...register("experience")}
              placeholder={t('ExperiencePlaceholder')}
              className="border-border dark:border-white focus:border-primary focus:ring-primary bg-background dark:bg-[#23272F] text-foreground dark:text-white min-h-[100px]"
            />
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="bg-muted dark:bg-[#23272F] p-6 rounded-lg">
              <h4 className="font-semibold text-foreground dark:text-white mb-3">{t('InitialRecommendations')}</h4>
              <ul className="space-y-2">
                {recommendations.map((rec, index) => (
                  <li key={index} className="text-foreground dark:text-white text-sm">
                    • {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground dark:bg-white dark:text-[#2D3748] dark:hover:bg-white/90 py-3 text-lg">
            {t('GetMyCustomPlan')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
