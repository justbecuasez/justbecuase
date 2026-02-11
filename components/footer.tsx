"use client"

import Link from "next/link"
import { Linkedin, Twitter, Instagram, Facebook } from "lucide-react"
import Image from "next/image"
import { NewsletterSubscribe } from "./newsletter-subscribe"
import { usePlatformSettingsStore } from "@/lib/store"

export function Footer() {
  // Get platform settings for branding and social links
  const platformSettings = usePlatformSettingsStore((state) => state.settings)
  const platformName = platformSettings?.platformName || "JustBeCause Network"
  const socialLinks = platformSettings?.socialLinks

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/logo.svg" alt="JBC Logo" width={140} height={56} className="h-10 w-auto" />
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {platformSettings?.platformDescription || "Connecting Skills with Purpose. Turn your expertise into lasting impact."}
            </p>
            <div className="flex items-center gap-4">
              {(socialLinks?.linkedin || !socialLinks) && (
                <a href={socialLinks?.linkedin || "https://www.linkedin.com/in/just-because-network-07599a3a9/"} className="text-muted-foreground hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-5 w-5" />
                  <span className="sr-only">LinkedIn</span>
                </a>
              )}
              {(socialLinks?.twitter || !socialLinks) && (
                <a href={socialLinks?.twitter || "https://twitter.com/justbecausenet"} className="text-muted-foreground hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </a>
              )}
              {(socialLinks?.instagram || !socialLinks) && (
                <a href={socialLinks?.instagram || "https://www.instagram.com/justbecausenet/"} className="text-muted-foreground hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-5 w-5" />
                  <span className="sr-only">Instagram</span>
                </a>
              )}
              {(socialLinks?.facebook || !socialLinks) && (
                <a href={socialLinks?.facebook || "https://www.facebook.com/people/Justbecausenetwork/61587223264929/"} className="text-muted-foreground hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">
                  <Facebook className="h-5 w-5" />
                  <span className="sr-only">Facebook</span>
                </a>
              )}
            </div>
          </div>

          {/* For Volunteers */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">For Volunteers</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/projects" className="text-muted-foreground hover:text-foreground transition-colors">
                  Browse Opportunities
                </Link>
              </li>
              <li>
                <Link href="/for-volunteers" className="text-muted-foreground hover:text-foreground transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className="text-muted-foreground hover:text-foreground transition-colors">
                  Create Profile
                </Link>
              </li>
              <li>
                <Link
                  href="/volunteer/dashboard"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* For NGOs */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">For NGOs</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/for-ngos" className="text-muted-foreground hover:text-foreground transition-colors">
                  Why Partner
                </Link>
              </li>
              <li>
                <Link
                  href="/ngo/post-project"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Post an Opportunity
                </Link>
              </li>
              <li>
                <Link href="/ngo/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Changelog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8">
          {/* Newsletter */}
          <div className="max-w-md mx-auto mb-8">
            <h4 className="font-semibold text-foreground mb-2 text-center">Stay Updated</h4>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Get the latest opportunities and impact stories delivered to your inbox.
            </p>
            <NewsletterSubscribe />
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {platformName}. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
