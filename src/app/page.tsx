import HeroSection from "@/components/hero-section"
import AssessmentSection from "@/components/assessment-section"
import ServicesSection from "@/components/services-section"
import AboutSection from "@/components/about-section"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <HeroSection />
      <AssessmentSection />
      <ServicesSection />
      <AboutSection />
    </main>
  )
}
