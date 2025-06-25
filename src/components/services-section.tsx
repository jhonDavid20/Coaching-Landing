import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Utensils, TrendingUp } from "lucide-react"

const services = [
  {
    icon: User,
    title: "Personal Training",
    description:
      "Customized workout programs designed for your goals, fitness level, and schedule. Progressive training that adapts as you grow stronger.",
  },
  {
    icon: Utensils,
    title: "Nutrition Coaching",
    description:
      "Evidence-based nutrition strategies that fit your lifestyle. Learn sustainable eating habits for long-term success.",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description:
      "Comprehensive monitoring of your transformation journey. Data-driven adjustments to optimize your results.",
  },
]

export default function ServicesSection() {
  return (
    <section className="bg-white py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-[#2D3748] text-center mb-16">Comprehensive Coaching Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <service.icon className="h-12 w-12 text-[#2D3748] mx-auto mb-4" />
                <CardTitle className="text-xl font-bold text-[#2D3748]">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-[#2D3748] leading-relaxed">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
