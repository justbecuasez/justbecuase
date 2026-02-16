"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface AICoverLetterProps {
  projectTitle: string
  projectDescription: string
  projectSkills: string[]
  volunteerName: string
  volunteerSkills: string[]
  volunteerBio: string
  matchScore?: number
  onGenerated?: (coverLetter: string) => void
}

export function AICoverLetterButton({
  projectTitle,
  projectDescription,
  projectSkills,
  volunteerName,
  volunteerSkills,
  volunteerBio,
  matchScore,
  onGenerated,
}: AICoverLetterProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<{
    coverLetter: string
    tips: string[]
    keyStrengths: string[]
  } | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    setIsGenerating(true)
    try {
      const res = await fetch("/api/ai/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle,
          projectDescription,
          projectSkills,
          volunteerName,
          volunteerSkills,
          volunteerBio,
          matchScore,
        }),
      })

      if (!res.ok) throw new Error("Failed to generate")
      const data = await res.json()
      setResult(data)
      if (data.coverLetter && onGenerated) {
        onGenerated(data.coverLetter)
      }
    } catch {
      toast.error("Failed to generate cover letter. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  function handleCopy() {
    if (result?.coverLetter) {
      navigator.clipboard.writeText(result.coverLetter)
      setCopied(true)
      toast.success("Copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (result) {
    return (
      <div className="space-y-3 rounded-lg bg-primary/5 border border-primary/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            AI-Generated Cover Letter
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 text-xs"
            >
              {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleGenerate}
              className="h-7 text-xs"
              disabled={isGenerating}
            >
              Regenerate
            </Button>
          </div>
        </div>

        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
          {result.coverLetter}
        </p>

        {result.keyStrengths.length > 0 && (
          <div className="pt-2 border-t border-primary/10">
            <p className="text-xs font-medium text-muted-foreground mb-1">Key Strengths Highlighted:</p>
            <div className="flex flex-wrap gap-1">
              {result.keyStrengths.map((s, i) => (
                <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {result.tips.length > 0 && (
          <div className="pt-2 border-t border-primary/10">
            <p className="text-xs font-medium text-muted-foreground mb-1">Tips:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {result.tips.map((t, i) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
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
      ) : (
        <>
          <Sparkles className="h-3.5 w-3.5" />
          AI Cover Letter
        </>
      )}
    </Button>
  )
}
