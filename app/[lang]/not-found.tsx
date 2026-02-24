import LocaleLink from "@/components/locale-link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Home, Search, ArrowLeft, HelpCircle } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-primary/20">404</h1>
          </div>
          
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Page Not Found
          </h2>
          
          <p className="text-muted-foreground mb-8">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. 
            It might have been moved, deleted, or maybe it never existed.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <LocaleLink href="/">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </LocaleLink>
            </Button>
            <Button asChild variant="outline">
              <LocaleLink href="/projects">
                <Search className="h-4 w-4 mr-2" />
                Browse Opportunities
              </LocaleLink>
            </Button>
          </div>

          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">
              Need help? Here are some useful links:
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <LocaleLink href="/contact" className="text-primary hover:underline flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                Contact Support
              </LocaleLink>
              <LocaleLink href="/for-volunteers" className="text-primary hover:underline">
                For Impact Agents
              </LocaleLink>
              <LocaleLink href="/for-ngos" className="text-primary hover:underline">
                For NGOs
              </LocaleLink>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
