"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"

export function WelcomeToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  useEffect(() => {
    const welcomeName = searchParams.get("welcome")
    if (welcomeName) {
      // Show welcome toast with the volunteer's name
      toast.success(`Welcome to JustBeCause, ${decodeURIComponent(welcomeName)}!`, {
        description: "Your profile has been set up successfully. Start exploring impact opportunities!",
        duration: 5000,
      })
      
      // Clean up the URL by removing the welcome parameter
      const newUrl = window.location.pathname
      router.replace(newUrl)
    }
  }, [searchParams, router])
  
  return null
}
