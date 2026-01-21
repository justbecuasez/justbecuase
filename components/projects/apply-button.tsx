"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowRight, Loader2 } from "lucide-react"
import { applyToProject } from "@/lib/actions"
import { toast } from "sonner"

interface ApplyButtonProps {
  projectId: string
  projectTitle?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function ApplyButton({ 
  projectId, 
  projectTitle,
  variant = "default", 
  size = "sm",
  className 
}: ApplyButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [coverMessage, setCoverMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleApply = async () => {
    setIsLoading(true)
    try {
      const result = await applyToProject(projectId, coverMessage)
      
      if (result.success) {
        toast.success("Application submitted successfully!")
        setOpen(false)
        setCoverMessage("")
        router.refresh()
      } else {
        if (result.data === "LIMIT_REACHED") {
          toast.error(result.error || "Application limit reached", {
            action: {
              label: "Upgrade",
              onClick: () => router.push("/pricing")
            }
          })
        } else {
          toast.error(result.error || "Failed to submit application")
        }
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button 
        size={size} 
        variant={variant}
        className={className}
        onClick={() => setOpen(true)}
      >
        Apply
        <ArrowRight className="h-4 w-4 ml-1" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Apply to Project</DialogTitle>
            <DialogDescription>
              {projectTitle && `Applying to: ${projectTitle}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="coverMessage">
                Cover Message <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Textarea
                id="coverMessage"
                placeholder="Tell the NGO why you're interested in this project and what you can bring..."
                value={coverMessage}
                onChange={(e) => setCoverMessage(e.target.value)}
                rows={5}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {coverMessage.length}/500 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
