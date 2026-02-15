"use client"

import { useState, useTransition, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, UserCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface FollowButtonProps {
  /** The user ID to follow/unfollow */
  targetId: string
  /** Display name for toast messages */
  targetName: string
  /** Whether the current viewer is already following this user */
  isFollowing: boolean
  /** Initial follower count */
  followersCount: number
  /** Show follower count next to button */
  showCount?: boolean
  /** Button size variant */
  size?: "default" | "sm" | "lg"
  /** Additional className */
  className?: string
}

export function FollowButton({
  targetId,
  targetName,
  isFollowing: initialIsFollowing,
  followersCount: initialCount,
  showCount = true,
  size = "default",
  className,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [followersCount, setFollowersCount] = useState(initialCount)
  const [isHovering, setIsHovering] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleToggle = useCallback(() => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetId,
            action: isFollowing ? "unfollow" : "follow",
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          toast.error(data.error || "Failed to update follow status")
          return
        }

        setIsFollowing(data.isFollowing)
        setFollowersCount(data.followersCount)

        toast.success(
          data.isFollowing
            ? `You are now following ${targetName}`
            : `Unfollowed ${targetName}`,
          {
            icon: data.isFollowing ? "👥" : undefined,
          }
        )
      } catch {
        toast.error("Something went wrong. Please try again.")
      }
    })
  }, [targetId, targetName, isFollowing])

  // Format large numbers
  const formatCount = (count: number): string => {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
    if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
    return count.toString()
  }

  const buttonLabel = isPending
    ? ""
    : isFollowing
      ? isHovering
        ? "Unfollow"
        : "Following"
      : "Follow"

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant={isFollowing ? (isHovering ? "destructive" : "outline") : "default"}
        size={size}
        onClick={handleToggle}
        disabled={isPending}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={cn(
          "min-w-[110px] transition-all duration-200 font-medium",
          isFollowing && !isHovering && "border-primary/30 text-primary",
          size === "sm" && "min-w-[90px]"
        )}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isFollowing ? (
          isHovering ? (
            <>
              <UserPlus className="h-4 w-4 mr-1.5" />
              {buttonLabel}
            </>
          ) : (
            <>
              <UserCheck className="h-4 w-4 mr-1.5" />
              {buttonLabel}
            </>
          )
        ) : (
          <>
            <UserPlus className="h-4 w-4 mr-1.5" />
            {buttonLabel}
          </>
        )}
      </Button>

      {showCount && (
        <span className="text-sm text-muted-foreground tabular-nums">
          <span className="font-semibold text-foreground">{formatCount(followersCount)}</span>
          {" "}
          {followersCount === 1 ? "follower" : "followers"}
        </span>
      )}
    </div>
  )
}
