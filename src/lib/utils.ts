import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUTCDate(
  dateStr: string,
  locale?: string,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: '2-digit' }
): string {
  return new Date(dateStr).toLocaleDateString(locale, { ...options, timeZone: 'UTC' });
}

export const scrollToAppointment = () => {
    document.getElementById("appointment")?.scrollIntoView({ behavior: "smooth" })
}

export const scrollToAssessment = () => {
    document.getElementById("assessment")?.scrollIntoView({ behavior: "smooth" })
  }