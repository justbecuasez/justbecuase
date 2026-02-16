"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react"

interface AIMatchExplanationProps {
  volunteerSkills: string[]
  volunteerBio?: string
  volunteerLocation?: string
  projectTitle: string
  projectDescription: string
  projectSkills: string[]
  matchScore?: number
}

export function AIMatchExplanation({
  volunteerSkills,
  volunteerBio,
  volunteerLocation,
  projectTitle,
  projectDescription,
  projectSkills,
  matchScore,
}: AIMatchExplanationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [result, setResult] = useState<{
    explanation: string
    strengths: string[]
    gaps: string[]
    compatibilityScore: string
  } | null>(null)

  async function handleExplain() {
    if (result) {
      setExpanded(!expanded)
      return
    }

    setIsLoading(true)
    setExpanded(true)
    try {
      const res = await fetch("/api/ai/match-explanation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          volunteerSkills,
          volunteerBio,
          volunteerLocation,
          projectTitle,
          projectDescription,
          projectSkills,
          matchScore,
        }),
      })

      if (!res.ok) throw new Error("Failed to explain")
      const data = await res.json()
      setResult(data)
    } catch {
      setExpanded(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleExplain}
        disabled={isLoading}
        className="gap-1.5 text-xs h-7 text-primary hover:text-primary hover:bg-primary/5"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="h-3 w-3" />
            Why this match?
            {result && (expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
          </>
        )}
      </Button>

      {result && expanded && (
        <div className={`mt-2 rounded-lg border p-3 space-y-2 text-xs animate-in slide-in-from-top-2 ${
          result.compatibilityScore === "Poor" || result.compatibilityScore === "Weak"
            ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
            : result.compatibilityScore === "Fair"
            ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
            : "bg-primary/5 border-primary/20"
        }`}>
          {result.compatibilityScore && (
            <span className={`inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${
              result.compatibilityScore === "Poor" || result.compatibilityScore === "Weak"
                ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                : result.compatibilityScore === "Fair"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                : result.compatibilityScore === "Good"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
            }`}>
              {result.compatibilityScore}
            </span>
          )}
          <p className="text-foreground leading-relaxed">{result.explanation}</p>

          {result.strengths.length > 0 && (
            <div>
              <p className="font-medium text-green-600 dark:text-green-400 mb-0.5">Strengths</p>
              <ul className="text-muted-foreground space-y-0.5">
                {result.strengths.map((s, i) => (
                  <li key={i}>✓ {s}</li>
                ))}
              </ul>
            </div>
          )}

          {result.gaps.length > 0 && (
            <div>
              <p className="font-medium text-amber-600 dark:text-amber-400 mb-0.5">Growth Areas</p>
              <ul className="text-muted-foreground space-y-0.5">
                {result.gaps.map((g, i) => (
                  <li key={i}>→ {g}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
