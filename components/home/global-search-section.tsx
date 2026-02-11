"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Search, Users, Building2, Briefcase, ArrowRight, MapPin, CheckCircle, Loader2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "motion/react"

interface SearchResult {
  type: "volunteer" | "ngo" | "opportunity"
  id: string
  title: string
  subtitle?: string
  description?: string
  location?: string
  skills?: string[]
  score: number
  avatar?: string
  verified?: boolean
}

export function GlobalSearchSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState<"all" | "opportunity" | "volunteer" | "ngo">("all")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Debounced search
  const performSearch = useCallback(async (query: string, type: string) => {
    if (!query || query.trim().length < 2) {
      setResults([])
      setHasSearched(false)
      return
    }

    setIsSearching(true)
    setHasSearched(true)

    try {
      const types = type === "all" ? "" : `&types=${type}`
      const res = await fetch(`/api/unified-search?q=${encodeURIComponent(query)}${types}&limit=12`)
      const data = await res.json()
      
      if (data.success) {
        setResults(data.results || [])
      } else {
        setResults([])
      }
    } catch (error) {
      console.error("Search failed:", error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery, searchType)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, searchType, performSearch])

  const clearSearch = () => {
    setSearchQuery("")
    setResults([])
    setHasSearched(false)
  }

  const quickSearches = [
    { label: "Web Development", query: "web development" },
    { label: "Graphic Design", query: "graphic design" },
    { label: "Marketing", query: "marketing" },
    { label: "Content Writing", query: "content writing" },
    { label: "Data Analysis", query: "data" },
  ]

  const getResultLink = (result: SearchResult) => {
    switch (result.type) {
      case "volunteer":
        return `/volunteers/${result.id}`
      case "ngo":
        return `/ngos/${result.id}`
      case "opportunity":
        return `/projects/${result.id}`
      default:
        return "#"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "volunteer":
        return <Users className="h-4 w-4" />
      case "ngo":
        return <Building2 className="h-4 w-4" />
      case "opportunity":
        return <Briefcase className="h-4 w-4" />
      default:
        return null
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "volunteer":
        return "bg-blue-100 text-blue-700"
      case "ngo":
        return "bg-green-100 text-green-700"
      case "opportunity":
        return "bg-purple-100 text-purple-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Find What You're Looking For
            </h2>
            <p className="text-muted-foreground">
              Search for opportunities, skilled volunteers, or NGOs
            </p>
          </div>

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
              onClick={() => setSearchType("opportunity")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                searchType === "opportunity"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              Opportunities
            </button>
            <button
              onClick={() => setSearchType("volunteer")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                searchType === "volunteer"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              <Users className="h-4 w-4" />
              Volunteers
            </button>
            <button
              onClick={() => setSearchType("ngo")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                searchType === "ngo"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              <Building2 className="h-4 w-4" />
              NGOs
            </button>
          </div>

          {/* Search Input */}
          <div className="relative mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={
                  searchType === "volunteer" 
                    ? "Search for skills, location, or name..." 
                    : searchType === "ngo"
                    ? "Search for organizations..."
                    : searchType === "opportunity"
                    ? "Search for opportunities..."
                    : "Search for opportunities, skills, or causes..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pl-12 pr-12 text-lg rounded-xl border-2 focus:border-primary"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            {isSearching && (
              <div className="absolute right-14 top-1/2 -translate-y-1/2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
          </div>

          {/* Quick Search Tags (only show when no results) */}
          {!hasSearched && (
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <span className="text-sm text-muted-foreground">Popular:</span>
              {quickSearches.map((item) => (
                <button
                  key={item.query}
                  onClick={() => setSearchQuery(item.query)}
                  className="px-3 py-1 text-sm rounded-full bg-background border border-border hover:border-primary hover:text-primary transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          <AnimatePresence mode="wait">
            {hasSearched && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6"
              >
                {isSearching ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Searching...</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-12 bg-background rounded-xl border">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-foreground font-medium mb-2">No results found</p>
                    <p className="text-sm text-muted-foreground">
                      Try different keywords or browse all opportunities
                    </p>
                    <Button asChild variant="outline" className="mt-4">
                      <Link href="/projects">Browse All Opportunities</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">
                        Found <span className="font-medium text-foreground">{results.length}</span> results
                      </p>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/projects?q=${encodeURIComponent(searchQuery)}`}>
                          View All <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {results.map((result, index) => (
                        <motion.div
                          key={`${result.type}-${result.id}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Link
                            href={getResultLink(result)}
                            className="block p-4 bg-background rounded-xl border hover:border-primary/50 hover:shadow-md transition-all group"
                          >
                            <div className="flex items-start gap-3">
                              {/* Avatar/Icon */}
                              <div className="flex-shrink-0">
                                {result.avatar ? (
                                  <img
                                    src={result.avatar}
                                    alt=""
                                    className="w-12 h-12 rounded-lg object-cover bg-muted"
                                  />
                                ) : (
                                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTypeBadgeColor(result.type)}`}>
                                    {getTypeIcon(result.type)}
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                {/* Title & Type Badge */}
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                    {result.title}
                                  </h3>
                                  {result.verified && (
                                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                  )}
                                </div>

                                {/* Subtitle */}
                                {result.subtitle && (
                                  <p className="text-sm text-muted-foreground truncate mb-2">
                                    {result.subtitle}
                                  </p>
                                )}

                                {/* Meta info */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="secondary" className={`text-xs ${getTypeBadgeColor(result.type)}`}>
                                    {result.type === "opportunity" ? "Opportunity" : result.type === "ngo" ? "NGO" : "Volunteer"}
                                  </Badge>
                                  {result.location && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {result.location}
                                    </span>
                                  )}
                                </div>

                                {/* Skills preview */}
                                {result.skills && result.skills.length > 0 && (
                                  <div className="flex gap-1 mt-2 flex-wrap">
                                    {result.skills.slice(0, 2).map((skill) => (
                                      <Badge key={skill} variant="outline" className="text-xs">
                                        {skill.replace(/-/g, " ")}
                                      </Badge>
                                    ))}
                                    {result.skills.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{result.skills.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
