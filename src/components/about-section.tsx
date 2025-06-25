"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

const credentials = [
  "Certified Personal Trainer (NASM-CPT)",
  "Precision Nutrition Level 1 Certified",
  "10+ years coaching experience",
  "500+ successful client transformations",
]

export default function AboutSection() {
  const openCalBooking = (source: string) => {
    // In production, replace with actual Cal.com integration
    console.log(`Opening Cal.com booking from: ${source}`)
    alert(`Cal.com booking would open here (source: ${source})`)
  }

  return (
    <section className="bg-[#2D3748] py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-white mb-8">Your Transformation Partner</h2>
            <p className="text-white text-lg mb-8 leading-relaxed">
              With over a decade of experience in fitness and nutrition coaching, I've helped hundreds of clients
              achieve sustainable transformations. My approach combines scientific principles with practical, real-world
              application.
            </p>
            <div className="space-y-4 mb-8">
              {credentials.map((credential, index) => (
                <div key={index} className="flex items-start">
                  <span className="text-white mr-3">•</span>
                  <span className="text-white">{credential}</span>
                </div>
              ))}
            </div>
            <div className="text-center lg:text-left">
              <p className="text-white text-lg mb-6">Ready to start your transformation? Schedule a consultation.</p>
              <Button
                onClick={() => openCalBooking("about")}
                className="bg-white text-[#2D3748] hover:bg-white/90 px-8 py-3"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Consultation
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="w-80 h-80 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">Coach Photo Placeholder</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
