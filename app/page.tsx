import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/home/hero-section"
import { MissionSection } from "@/components/home/mission-section"
import  { ImpactMetrics }  from "@/components/home/impact-metrics"
import { HowItWorks } from "@/components/home/how-it-works"
import { FeaturedProjects } from "@/components/home/featured-projects"
import { SkillCategories } from "@/components/home/skill-categories"
import { Testimonials } from "@/components/home/testimonials"
import { CTASection } from "@/components/home/cta-section"
import { getImpactMetrics } from "@/lib/actions"


export default async function HomePage() {
  // Fetch real impact metrics from database
  const impactMetrics = await getImpactMetrics()
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <MissionSection />
        <ImpactMetrics impactMetrics={impactMetrics} />
        <HowItWorks />
        <FeaturedProjects />
        <SkillCategories />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
