import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const scrollToAppointment = () => {
    document.getElementById("appointment")?.scrollIntoView({ behavior: "smooth" })
}

export const scrollToAssessment = () => {
    document.getElementById("assessment")?.scrollIntoView({ behavior: "smooth" })
  }