import Navbar from "@/components/navbar";
import HeroSection from "@/components/hero-section"
import AssessmentSection from "@/components/assessment-section"
import ServicesSection from "@/components/services-section"
import AboutSection from "@/components/about-section"
import CalSection from "@/components/cal-section";
import PhilosophySection from "@/components/philosophy-section";


export default function HomePage() {
  return (
    <div>
      <Navbar />
      <HeroSection />    
      <PhilosophySection />
      <ServicesSection />
      <AssessmentSection />
      <CalSection />
      <AboutSection />
    </div>
  )
}
