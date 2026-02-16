"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, Loader2, Send } from "lucide-react"
import { submitReview } from "@/lib/actions"
import { toast } from "sonner"

interface ReviewFormProps {
  revieweeId: string
  revieweeName: string
  projectId?: string
  projectTitle?: string
  onSubmitted?: () => void
}

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hoverValue, setHoverValue] = useState(0)

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            onClick={() => onChange(star)}
            className="p-0.5 transition-colors"
          >
            <Star
              className={`h-5 w-5 ${
                star <= (hoverValue || value)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 dark:text-gray-600"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export function ReviewForm({ revieweeId, revieweeName, projectId, projectTitle, onSubmitted }: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ratings, setRatings] = useState({
    overall: 0,
    communication: 0,
    quality: 0,
    timeliness: 0,
  })
  const [comment, setComment] = useState("")

  async function handleSubmit() {
    if (ratings.overall === 0) {
      toast.error("Please provide an overall rating")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await submitReview({
        revieweeId,
        projectId: projectId || "",
        overallRating: ratings.overall,
        communicationRating: ratings.communication || 0,
        qualityRating: ratings.quality || 0,
        timelinessRating: ratings.timeliness || 0,
        comment: comment.trim() || "",
      })

      if (result.success) {
        toast.success("Review submitted!")
        setRatings({ overall: 0, communication: 0, quality: 0, timeliness: 0 })
        setComment("")
        onSubmitted?.()
      } else {
        toast.error(result.error || "Failed to submit review")
      }
    } catch {
      toast.error("Failed to submit review")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">
          Review {revieweeName}
          {projectTitle && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              for &ldquo;{projectTitle}&rdquo;
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <StarRating
            value={ratings.overall}
            onChange={(v) => setRatings((prev) => ({ ...prev, overall: v }))}
            label="Overall *"
          />
          <StarRating
            value={ratings.communication}
            onChange={(v) => setRatings((prev) => ({ ...prev, communication: v }))}
            label="Communication"
          />
          <StarRating
            value={ratings.quality}
            onChange={(v) => setRatings((prev) => ({ ...prev, quality: v }))}
            label="Quality of Work"
          />
          <StarRating
            value={ratings.timeliness}
            onChange={(v) => setRatings((prev) => ({ ...prev, timeliness: v }))}
            label="Timeliness"
          />
        </div>

        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience working together..."
          rows={3}
        />

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || ratings.overall === 0}
          className="w-full gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Submit Review
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// Display component for reviews
interface ReviewDisplayProps {
  reviews: Array<{
    _id?: string
    reviewerName?: string
    overallRating: number
    communicationRating?: number
    qualityRating?: number
    timelinessRating?: number
    comment?: string
    createdAt: Date | string
    projectTitle?: string
  }>
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300 dark:text-gray-600"
          }`}
        />
      ))}
    </div>
  )
}

export function ReviewsList({ reviews }: ReviewDisplayProps) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No reviews yet
      </p>
    )
  }

  const avgRating =
    reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-3">
        <div className="text-3xl font-bold text-foreground">
          {avgRating.toFixed(1)}
        </div>
        <div>
          <StarDisplay rating={Math.round(avgRating)} />
          <p className="text-xs text-muted-foreground mt-0.5">
            {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-3">
        {reviews.map((review, i) => (
          <div
            key={review._id || i}
            className="border rounded-lg p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {review.reviewerName || "Anonymous"}
                </span>
                <StarDisplay rating={review.overallRating} />
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
            {review.projectTitle && (
              <p className="text-xs text-muted-foreground">
                Project: {review.projectTitle}
              </p>
            )}
            {review.comment && (
              <p className="text-sm text-foreground">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
