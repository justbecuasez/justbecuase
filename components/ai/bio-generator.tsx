"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, Check, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface AIBioGeneratorProps {
  name: string
  skills: string[]
  causes: string[]
  completedProjects?: number
  hoursContributed?: number
  location?: string
  currentBio?: string
  onGenerated: (bio: string) => void
}

export function AIBioGenerator({
  name,
  skills,
  causes,
  completedProjects,
  hoursContributed,
  location,
  currentBio,
  onGenerated,
}: AIBioGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<{
    bio: string
    headline: string
    highlights: string[]
    keywords: string[]
  } | null>(null)
  const [applied, setApplied] = useState(false)

  async function handleGenerate() {
    setIsGenerating(true)
    setApplied(false)
    try {
      const res = await fetch("/api/ai/bio-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          skills,
          causes,
          completedProjects,
          hoursContributed,
          location,
          currentBio,
        }),
      })

      if (!res.ok) throw new Error("Failed to generate")
      const data = await res.json()
      setResult(data)
    } catch {
      toast.error("Failed to generate bio. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  function handleApply() {
    if (result?.bio) {
      onGenerated(result.bio)
      setApplied(true)
      toast.success("Bio applied! Don't forget to save.")
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Generating...
            </>
          ) : result ? (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate Bio
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Generate Bio with AI
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              AI Suggestion
            </span>
            <Button
              type="button"
              size="sm"
              variant={applied ? "ghost" : "default"}
              onClick={handleApply}
              disabled={applied}
              className="h-7 text-xs gap-1.5"
            >
              {applied ? (
                <>
                  <Check className="h-3 w-3" /> Applied
                </>
              ) : (
                "Use This Bio"
              )}
            </Button>
          </div>

          {result.headline && (
            <p className="text-sm font-medium text-foreground italic">
              &ldquo;{result.headline}&rdquo;
            </p>
          )}

          <p className="text-sm text-foreground leading-relaxed">{result.bio}</p>

          {result.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {result.keywords.map((kw, i) => (
                <span
                  key={i}
                  className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
