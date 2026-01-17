import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { ngoProfilesDb, volunteerProfilesDb, transactionsDb } from "@/lib/database"

// This endpoint handles the redirect back from Stripe Payment Links
// Configure this URL in your Payment Link settings: "After payment" → "Redirect to website"
// URL: https://yoursite.com/api/payments/stripe-link-callback

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    const { searchParams } = new URL(request.url)
    
    // Stripe sends these params after successful payment
    const checkoutSessionId = searchParams.get("session_id") // Only if you set up webhooks
    const clientReferenceId = searchParams.get("client_reference_id")
    const paymentType = searchParams.get("type") || "subscription"
    const planId = searchParams.get("plan")
    const volunteerId = searchParams.get("volunteerId")

    // For Payment Links, Stripe redirects after payment
    // The payment is already complete at this point
    // You should use webhooks for reliable payment confirmation
    
    // For now, we'll trust the redirect and update the user's status
    // In production, ALWAYS verify via webhooks!

    if (!session?.user) {
      // User not logged in - redirect to login with return URL
      const returnUrl = encodeURIComponent(request.url)
      return NextResponse.redirect(new URL(`/auth/signin?redirect=${returnUrl}`, request.url))
    }

    const userId = clientReferenceId || session.user.id

    // Handle based on payment type
    if (paymentType === "subscription" && planId) {
      // Update subscription status
      const now = new Date()
      const expiryDate = new Date(now)
      expiryDate.setMonth(expiryDate.getMonth() + 1)

      if (planId.startsWith("ngo-")) {
        const ngoProfile = await ngoProfilesDb.findByUserId(userId)
        if (ngoProfile && ngoProfile._id) {
          await ngoProfilesDb.update(ngoProfile._id.toString(), {
            subscriptionPlan: "pro",
            subscriptionExpiry: expiryDate,
          })
        }
        return NextResponse.redirect(new URL("/ngo/dashboard?subscription=success", request.url))
      } else if (planId.startsWith("volunteer-")) {
        const volunteerProfile = await volunteerProfilesDb.findByUserId(userId)
        if (volunteerProfile && volunteerProfile._id) {
          await volunteerProfilesDb.update(volunteerProfile._id.toString(), {
            subscriptionPlan: "pro",
            subscriptionExpiry: expiryDate,
          })
        }
        return NextResponse.redirect(new URL("/volunteer/dashboard?subscription=success", request.url))
      }
    } else if (paymentType === "unlock" && volunteerId) {
      // Record profile unlock
      // Note: You should verify payment via webhook before doing this in production
      return NextResponse.redirect(new URL(`/volunteers/${volunteerId}?unlocked=pending`, request.url))
    }

    // Default redirect
    return NextResponse.redirect(new URL("/pricing?payment=success", request.url))
  } catch (error: any) {
    console.error("Payment link callback error:", error)
    return NextResponse.redirect(new URL("/pricing?payment=error", request.url))
  }
}
