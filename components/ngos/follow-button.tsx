"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { followNgo, unfollowNgo } from "@/lib/actions"
import { toast } from "sonner"

interface FollowButtonProps {
  ngoId: string
  ngoName: string
  isFollowing: boolean
}

export function FollowButton({ ngoId, ngoName, isFollowing: initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isPending, startTransition] = useTransition()

  const handleToggleFollow = () => {
    startTransition(async () => {
      const result = isFollowing 
        ? await unfollowNgo(ngoId)
        : await followNgo(ngoId)

      if (result.success) {
        setIsFollowing(!isFollowing)
        toast.success(
          isFollowing 
            ? `Unfollowed ${ngoName}` 
            : `Following ${ngoName}`
        )
      } else {
        toast.error(result.error || "Failed to update follow status")
      }
    })
  }

  return (
    <Button
      className="bg-primary hover:bg-primary/90"
      onClick={handleToggleFollow}
      disabled={isPending}
    >
      <Heart 
        className={`h-4 w-4 mr-2 ${isFollowing ? "fill-current" : ""}`}
      />
      {isFollowing ? "Following" : "Follow Organization"}
    </Button>
  )
}
