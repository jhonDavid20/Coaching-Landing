import HeroSection from "@/components/hero-section"
import AssessmentSection from "@/components/assessment-section"
import ServicesSection from "@/components/services-section"
import AboutSection from "@/components/about-section"

import Navbar from "@/components/navbar";


export default function HomePage() {
  return (
    <div>
      <Navbar />
      <HeroSection />
      <AssessmentSection />
      <ServicesSection />
      <AboutSection />
    </div>
  )
}
