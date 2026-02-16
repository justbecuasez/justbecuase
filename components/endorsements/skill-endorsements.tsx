"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, Loader2 } from "lucide-react"
import { endorseSkill, removeEndorsement, getEndorsementDetailsForUser } from "@/lib/actions"
import { toast } from "sonner"

interface SkillItem {
  categoryId: string
  subskillId: string
  name: string
}

interface SkillEndorsementsProps {
  userId: string
  skills: SkillItem[]
  currentUserId?: string
}

export function SkillEndorsements({ userId, skills, currentUserId }: SkillEndorsementsProps) {
  const [endorsements, setEndorsements] = useState<Record<string, number>>({})
  const [myEndorsements, setMyEndorsements] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [endorsing, setEndorsing] = useState<string | null>(null)

  function skillKey(s: SkillItem) { return `${s.categoryId}:${s.subskillId}` }

  useEffect(() => {
    async function loadEndorsements() {
      try {
        const result = await getEndorsementDetailsForUser(userId)
        if (result.success && result.data) {
          setEndorsements(result.data.counts)
          setMyEndorsements(new Set(result.data.myEndorsedKeys))
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false)
      }
    }

    loadEndorsements()
  }, [userId, currentUserId])

  async function handleEndorse(skill: SkillItem) {
    if (!currentUserId) {
      toast.error("Please sign in to endorse skills")
      return
    }
    if (currentUserId === userId) {
      toast.error("You can't endorse your own skills")
      return
    }

    const key = skillKey(skill)
    setEndorsing(key)
    try {
      if (myEndorsements.has(key)) {
        const result = await removeEndorsement({
          endorseeId: userId,
          skillCategoryId: skill.categoryId,
          skillSubskillId: skill.subskillId,
        })
        if (result.success) {
          setMyEndorsements((prev) => {
            const next = new Set(prev)
            next.delete(key)
            return next
          })
          setEndorsements((prev) => ({
            ...prev,
            [key]: Math.max(0, (prev[key] || 0) - 1),
          }))
        }
      } else {
        const result = await endorseSkill({
          endorseeId: userId,
          skillCategoryId: skill.categoryId,
          skillSubskillId: skill.subskillId,
        })
        if (result.success) {
          setMyEndorsements((prev) => new Set(prev).add(key))
          setEndorsements((prev) => ({
            ...prev,
            [key]: (prev[key] || 0) + 1,
          }))
          toast.success(`Endorsed ${skill.name}!`)
        } else {
          toast.error(result.error || "Failed to endorse")
        }
      }
    } catch {
      toast.error("Failed to endorse skill")
    } finally {
      setEndorsing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <Badge key={skillKey(skill)} variant="outline" className="animate-pulse py-1.5 px-3">
            {skill.name}
          </Badge>
        ))}
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">
        <ThumbsUp className="h-3.5 w-3.5 inline mr-1" />
        Endorse skills you&apos;ve seen in action
      </p>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => {
          const key = skillKey(skill)
          const count = endorsements[key] || 0
          const endorsed = myEndorsements.has(key)
          const isLoading = endorsing === key

          return (
            <Badge
              key={key}
              variant={endorsed ? "default" : "outline"}
              className={`py-1.5 px-3 transition-all cursor-default ${
                currentUserId && currentUserId !== userId ? "cursor-pointer hover:border-primary" : ""
              } ${endorsed ? "bg-primary/90" : ""}`}
              onClick={() => {
                if (currentUserId && currentUserId !== userId) {
                  handleEndorse(skill)
                }
              }}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
              ) : count > 0 ? (
                <ThumbsUp className={`h-3 w-3 mr-1.5 ${endorsed ? "fill-current" : ""}`} />
              ) : null}
              {skill.name}
              {count > 0 && (
                <span className="ml-1.5 text-xs opacity-75">({count})</span>
              )}
            </Badge>
          )
        })}
      </div>
    </div>
  )
}
