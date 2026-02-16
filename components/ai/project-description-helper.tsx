"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, Check, Copy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface AIProjectDescriptionProps {
  basicTitle: string
  basicDescription: string
  orgName: string
  orgMission?: string
  causes: string[]
  onApply: (data: {
    title: string
    description: string
    requirements: string[]
    deliverables: string[]
    tags: string[]
    suggestedDuration: string
    suggestedTimeCommitment: string
  }) => void
}

export function AIProjectDescriptionHelper({
  basicTitle,
  basicDescription,
  orgName,
  orgMission,
  causes,
  onApply,
}: AIProjectDescriptionProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<{
    title: string
    description: string
    requirements: string[]
    deliverables: string[]
    tags: string[]
    suggestedDuration: string
    suggestedTimeCommitment: string
  } | null>(null)
  const [applied, setApplied] = useState(false)

  async function handleGenerate() {
    if (!basicTitle.trim() && !basicDescription.trim()) {
      toast.error("Please enter at least a title or description first")
      return
    }

    setIsGenerating(true)
    setApplied(false)
    try {
      const res = await fetch("/api/ai/project-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basicTitle,
          basicDescription,
          orgName,
          orgMission,
          causes,
        }),
      })

      if (!res.ok) throw new Error("Failed to generate")
      const data = await res.json()
      setResult(data)
    } catch {
      toast.error("Failed to generate description. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  function handleApply() {
    if (result) {
      onApply(result)
      setApplied(true)
      toast.success("AI suggestions applied! Review and adjust as needed.")
    }
  }

  return (
    <div className="space-y-3">
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
            Enhancing with AI...
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5" />
            {result ? "Regenerate" : "Enhance with AI"}
          </>
        )}
      </Button>

      {result && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Enhanced Project Description
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
                "Apply All"
              )}
            </Button>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Suggested Title</p>
              <p className="font-medium text-foreground">{result.title}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Enhanced Description</p>
              <p className="text-foreground leading-relaxed">{result.description}</p>
            </div>

            {result.requirements.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Requirements</p>
                <ul className="list-disc list-inside text-foreground space-y-0.5">
                  {result.requirements.map((r, i) => (
                    <li key={i} className="text-sm">{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.deliverables.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Deliverables</p>
                <ul className="list-disc list-inside text-foreground space-y-0.5">
                  {result.deliverables.map((d, i) => (
                    <li key={i} className="text-sm">{d}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Duration</p>
                <Badge variant="secondary">{result.suggestedDuration}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Time Commitment</p>
                <Badge variant="secondary">{result.suggestedTimeCommitment}</Badge>
              </div>
            </div>

            {result.tags.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Suggested Tags</p>
                <div className="flex flex-wrap gap-1">
                  {result.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
