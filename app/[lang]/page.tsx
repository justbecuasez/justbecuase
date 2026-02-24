import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/home/hero-section"
import { GlobalSearchSection } from "@/components/home/global-search-section"
import { HowItWorks } from "@/components/home/how-it-works"
import { FeaturedProjects } from "@/components/home/featured-projects"
import { Testimonials } from "@/components/home/testimonials"
import { CTASection } from "@/components/home/cta-section"
import { DictionaryProvider } from "@/components/dictionary-provider"
import { getDictionary } from "./dictionaries"
import type { Locale } from "@/lib/i18n-config"

// Render at request time (needs MongoDB connection)
export const dynamic = "force-dynamic"


export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const dict = await getDictionary(lang as Locale)

  return (
    <DictionaryProvider dictionary={dict}>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <HeroSection />
          <GlobalSearchSection />
          <FeaturedProjects />
          <HowItWorks />
          <Testimonials />
          <CTASection />
        </main>
        <Footer />
      </div>
    </DictionaryProvider>
  )
}
