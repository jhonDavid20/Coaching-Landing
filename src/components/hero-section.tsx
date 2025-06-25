"use client"

import { Button } from "@/components/ui/button"

export default function HeroSection() {
  const scrollToAssessment = () => {
    document.getElementById("assessment")?.scrollIntoView({ behavior: "smooth" })
  }

  const openCalBooking = (source: string) => {
    // In production, replace with actual Cal.com integration
    console.log(`Opening Cal.com booking from: ${source}`)
    // Example: window.open('https://cal.com/your-username/15min', '_blank')
    alert(`Cal.com booking would open here (source: ${source})`)
  }

  return (
    <section className="bg-white py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-[#2D3748] mb-6 leading-tight">Transform Your Body & Life</h1>
        <p className="text-xl text-[#2D3748] mb-12 max-w-2xl mx-auto leading-relaxed">
          Get personalized fitness and nutrition coaching that fits your lifestyle. Science-based approach, sustainable
          results.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-[#2D3748] hover:bg-[#2D3748]/90 text-white px-8 py-4 text-lg"
            onClick={scrollToAssessment}
          >
            Get Your Free Assessment
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-[#2D3748] text-[#2D3748] hover:bg-[#2D3748] hover:text-white px-8 py-4 text-lg"
            onClick={() => openCalBooking("hero")}
          >
            Book Discovery Call
          </Button>
        </div>
      </div>
    </section>
  )
}
