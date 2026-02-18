// @deprecated - This component is no longer used. Payment Links have been replaced by Stripe Checkout Sessions.
// See app/pricing/page.tsx handleSubscribe() for the new flow.
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { STRIPE_PAYMENT_LINKS, getPaymentLinkUrl } from "@/lib/stripe-payment-links"

interface PaymentLinkButtonProps {
  linkType: keyof typeof STRIPE_PAYMENT_LINKS
  userId: string
  metadata?: Record<string, string>
  children: React.ReactNode
  className?: string
  variant?: "default" | "outline" | "secondary"
}

export function PaymentLinkButton({
  linkType,
  userId,
  metadata,
  children,
  className,
  variant = "default",
}: PaymentLinkButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = () => {
    const link = STRIPE_PAYMENT_LINKS[linkType]
    
    if (!link.url) {
      toast.error("Payment not configured", {
        description: "Payment link not set up yet. Please contact support.",
      })
      return
    }

    setIsLoading(true)

    // Build the payment URL
    const paymentUrl = getPaymentLinkUrl(linkType, {
      userId,
      metadata,
    })

    if (paymentUrl) {
      // Redirect to Stripe Payment Link
      window.location.href = paymentUrl
    } else {
      toast.error("Payment error", {
        description: "Unable to create payment link",
      })
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      className={className}
      variant={variant}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirecting...
        </>
      ) : (
        <>
          {children}
          <ExternalLink className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  )
}
