import { type NextRequest, NextResponse } from "next/server"

interface AssessmentData {
  name: string
  email: string
  age: string
  gender: string
  height: string
  weight: string
  activityLevel: string
  goal: string
  experience: string
  locale?: string
}

// Base URL of the Steady Vitality backend API (server-side only, no NEXT_PUBLIC_).
// When unset (e.g. a standalone landing deploy without a backend), the route
// degrades gracefully: it logs the submission and still returns success.
const API_URL = process.env.API_URL

export async function POST(request: NextRequest) {
  try {
    const data: AssessmentData = await request.json()

    if (!data?.name || !data?.email) {
      return NextResponse.json(
        { success: false, message: "Name and email are required" },
        { status: 400 },
      )
    }

    if (!API_URL) {
      console.warn("API_URL not configured — logging assessment instead of persisting:", data)
      return NextResponse.json({ success: true, message: "Assessment received" })
    }

    const response = await fetch(`${API_URL}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => "")
      console.error("Backend rejected assessment:", response.status, detail)
      return NextResponse.json(
        { success: false, message: "Failed to submit assessment" },
        { status: 502 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Assessment submitted successfully",
    })
  } catch (error) {
    console.error("Assessment submission error:", error)
    return NextResponse.json({ success: false, message: "Failed to submit assessment" }, { status: 500 })
  }
}
