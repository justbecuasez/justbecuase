"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Users, Building2 } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background py-16 md:py-24 lg:py-32">
      {/* Minimal background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center">
          {/* Logo/Brand */}
          <div className="mb-8 flex flex-col items-center">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl md:text-6xl font-bold text-foreground tracking-tight">JBC</span>
              <Sparkles className="h-5 w-5 text-primary mb-4" />
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">JustBeCauseNetwork.com</span>
            </div>
            <div className="text-xs text-primary font-medium tracking-wide mt-1">
              Connecting Skills to Purpose
            </div>
          </div>

          {/* Main Headline - MISSION IMPOSSIBLE */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            MISSION <span className="line-through decoration-2 text-muted-foreground/60">IM</span><span className="text-primary">POSSIBLE</span>
          </h1>

          {/* Tagline */}
          <p className="mx-auto mb-6 max-w-xl text-lg text-foreground font-medium">
            You've spent years perfecting your <span className="font-bold">skill</span>; now, give it a <span className="font-bold">purpose</span>.
          </p>

          {/* Description */}
          <p className="mx-auto mb-12 max-w-2xl text-muted-foreground leading-relaxed">
            Across the globe, visionary NGOs are working tirelessly to change lives, but they shouldn't have to do it alone. 
            They have the passion, but they need your professional expertise to break through. 
            <span className="font-semibold text-foreground"> JustBeCause Network</span> is the bridge between your talent and their impact. 
            We believe that when your mastery meets their mission, the impossible becomes possible.
          </p>

          {/* Registration Options */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
            {/* NGO Registration */}
            <div className="flex flex-col items-center gap-2 p-6 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors min-w-[200px]">
              <Building2 className="h-8 w-8 text-primary mb-2" />
              <span className="font-bold text-lg text-foreground">NGO</span>
              <span className="text-xs text-muted-foreground text-center">
                Register here if you are an NGO looking for talent
              </span>
              <Button asChild size="sm" className="mt-3">
                <Link href="/auth/signup?role=ngo" className="flex items-center gap-2">
                  Register <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>

            {/* Volunteer Registration */}
            <div className="flex flex-col items-center gap-2 p-6 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors min-w-[200px]">
              <Users className="h-8 w-8 text-primary mb-2" />
              <span className="font-bold text-lg text-foreground">Impact Agent</span>
              <span className="text-xs text-muted-foreground text-center">
                Register here if you are an individual looking to offer your skill
              </span>
              <Button asChild size="sm" className="mt-3">
                <Link href="/auth/signup?role=volunteer" className="flex items-center gap-2">
                  Register <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
