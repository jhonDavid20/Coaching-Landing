import HeroSection from "@/components/sections/hero-section"
import AssessmentSection from "@/components/sections/assessment-section"
import ServicesSection from "@/components/sections/services-section"
import AboutSection from "@/components/sections/about-section"
import CalSection from "@/components/sections/cal-section";
import PhilosophySection from "@/components/sections/philosophy-section";


export default function HomePage() {
  return (
    <div className="pt-16">
      <HeroSection />
      <PhilosophySection />
      <ServicesSection />
      <AssessmentSection />
      <CalSection />
      <AboutSection />
    </div>
  )
}
