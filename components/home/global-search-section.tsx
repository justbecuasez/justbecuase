"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Users, Building2, Briefcase, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion } from "motion/react"

export function GlobalSearchSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState<"all" | "opportunities" | "volunteers" | "ngos">("all")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    // Route to appropriate search page based on type
    if (searchType === "volunteers") {
      router.push(`/ngo/find-talent?q=${encodeURIComponent(searchQuery)}`)
    } else if (searchType === "ngos") {
      router.push(`/ngos?q=${encodeURIComponent(searchQuery)}`)
    } else {
      // Default to opportunities/projects search
      router.push(`/projects?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const quickSearches = [
    { label: "Web Development", query: "web development" },
    { label: "Graphic Design", query: "graphic design" },
    { label: "Marketing", query: "marketing" },
    { label: "Data Analysis", query: "data analysis" },
    { label: "Content Writing", query: "content writing" },
  ]

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Find What You're Looking For
          </h2>
          <p className="text-muted-foreground mb-8">
            Search for opportunities, skilled volunteers, or NGOs
          </p>

          {/* Search Type Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <button
              onClick={() => setSearchType("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                searchType === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSearchType("opportunities")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                searchType === "opportunities"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              Opportunities
            </button>
            <button
              onClick={() => setSearchType("volunteers")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                searchType === "volunteers"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              <Users className="h-4 w-4" />
              Volunteers
            </button>
            <button
              onClick={() => setSearchType("ngos")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                searchType === "ngos"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              <Building2 className="h-4 w-4" />
              NGOs
            </button>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearch} className="relative mb-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={
                    searchType === "volunteers" 
                      ? "Search for skills, location, or name..." 
                      : searchType === "ngos"
                      ? "Search for organizations..."
                      : "Search for opportunities, skills, or causes..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 pl-12 pr-4 text-lg rounded-xl border-2 focus:border-primary"
                />
              </div>
              <Button type="submit" size="lg" className="h-14 px-8 rounded-xl">
                Search
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Quick Search Tags */}
          <div className="flex flex-wrap justify-center gap-2">
            <span className="text-sm text-muted-foreground">Popular:</span>
            {quickSearches.map((item) => (
              <button
                key={item.query}
                onClick={() => {
                  setSearchQuery(item.query)
                  router.push(`/projects?q=${encodeURIComponent(item.query)}`)
                }}
                className="px-3 py-1 text-sm rounded-full bg-background border border-border hover:border-primary hover:text-primary transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
