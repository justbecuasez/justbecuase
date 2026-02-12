import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { ngoProfilesDb, volunteerProfilesDb, transactionsDb } from "@/lib/database"
import { STRIPE_PAYMENT_LINKS } from "@/lib/stripe-payment-links"

// This endpoint handles the redirect back from Stripe Payment Links
// Configure this URL in your Payment Link settings: "After payment" → "Redirect to website"
// 
// FOR NGO PRO:
//   URL: http://localhost:3000/api/payments/stripe-link-callback?type=subscription&plan=ngo-pro
//   OR for production: https://yourdomain.com/api/payments/stripe-link-callback?type=subscription&plan=ngo-pro
//
// FOR VOLUNTEER PRO:
//   URL: http://localhost:3000/api/payments/stripe-link-callback?type=subscription&plan=volunteer-pro
//   OR for production: https://yourdomain.com/api/payments/stripe-link-callback?type=subscription&plan=volunteer-pro

export async function GET(request: NextRequest) {
  try {
    console.log("🔔 STRIPE CALLBACK HIT!")
    console.log("📍 Full URL:", request.url)
    
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    const { searchParams } = new URL(request.url)
    
    // Log all incoming params
    console.log("📋 All URL params:", Object.fromEntries(searchParams.entries()))
    
    // Stripe sends these params after successful payment
    const checkoutSessionId = searchParams.get("session_id")
    const clientReferenceId = searchParams.get("client_reference_id")
    const paymentType = searchParams.get("type") || "subscription"
    const planId = searchParams.get("plan")
    const volunteerId = searchParams.get("volunteerId")

    console.log("📝 Parsed params:", {
      checkoutSessionId,
      clientReferenceId,
      paymentType,
      planId,
      volunteerId,
      userLoggedIn: !!session?.user,
      userId: session?.user?.id,
      userRole: session?.user?.role,
    })

    if (!session?.user) {
      console.log("❌ No session - redirecting to login")
      const returnUrl = encodeURIComponent(request.url)
      return NextResponse.redirect(new URL(`/auth/signin?redirect=${returnUrl}`, request.url))
    }

    const userId = clientReferenceId || session.user.id
    const userRole = session.user.role as string
    
    console.log("👤 User info:", { userId, userRole })

    // Handle based on payment type
    if (paymentType === "subscription") {
      const now = new Date()
      const expiryDate = new Date(now)
      expiryDate.setMonth(expiryDate.getMonth() + 1)

      // Determine plan from URL param OR from user role
      const effectivePlan = planId || (userRole === "ngo" ? "ngo-pro" : "volunteer-pro")
      console.log("📦 Effective plan:", effectivePlan)

      if (effectivePlan.includes("ngo") || userRole === "ngo") {
        console.log("🏢 Updating NGO subscription...")
        const ngoProfile = await ngoProfilesDb.findByUserId(userId)
        console.log("📄 Found NGO profile:", ngoProfile ? "YES" : "NO", ngoProfile?._id)
        
        if (ngoProfile && ngoProfile._id) {
          await ngoProfilesDb.update(ngoProfile._id.toString(), {
            subscriptionPlan: "pro",
            subscriptionExpiry: expiryDate,
            monthlyUnlocksUsed: 0, // Reset unlocks
          })
          console.log("✅ NGO subscription updated to PRO!")
          
          // Also create a transaction record
          try {
            const ngoLinkConfig = STRIPE_PAYMENT_LINKS["ngo-pro-monthly"]
            await transactionsDb.create({
              userId: userId,
              type: "subscription",
              referenceId: effectivePlan,
              referenceType: "subscription",
              amount: ngoLinkConfig.price,
              currency: ngoLinkConfig.currency,
              paymentGateway: "stripe",
              paymentId: checkoutSessionId || `stripe_link_${Date.now()}`,
              status: "completed",
              paymentStatus: "completed",
              description: "NGO Pro Subscription via Stripe Payment Link",
              createdAt: new Date(),
            })
            console.log("✅ Transaction record created")
          } catch (txError) {
            console.error("⚠️ Failed to create transaction:", txError)
          }
        } else {
          console.log("❌ NGO profile not found!")
        }
        return NextResponse.redirect(new URL("/ngo/dashboard?subscription=success", request.url))
        
      } else if (effectivePlan.includes("volunteer") || userRole === "volunteer") {
        console.log("👤 Updating Volunteer subscription...")
        const volunteerProfile = await volunteerProfilesDb.findByUserId(userId)
        console.log("📄 Found Volunteer profile:", volunteerProfile ? "YES" : "NO", volunteerProfile?._id)
        
        if (volunteerProfile && volunteerProfile._id) {
          await volunteerProfilesDb.update(volunteerProfile._id.toString(), {
            subscriptionPlan: "pro",
            subscriptionExpiry: expiryDate,
            monthlyApplicationsUsed: 0, // Reset applications
          })
          console.log("✅ Volunteer subscription updated to PRO!")
          
          // Create transaction record
          try {
            const volunteerLinkConfig = STRIPE_PAYMENT_LINKS["volunteer-pro-monthly"]
            await transactionsDb.create({
              userId: userId,
              type: "subscription",
              referenceId: effectivePlan,
              referenceType: "subscription",
              amount: volunteerLinkConfig.price,
              currency: volunteerLinkConfig.currency,
              paymentGateway: "stripe",
              paymentId: checkoutSessionId || `stripe_link_${Date.now()}`,
              status: "completed",
              paymentStatus: "completed",
              description: "Impact Agent Pro Subscription via Stripe Payment Link",
              createdAt: new Date(),
            })
            console.log("✅ Transaction record created")
          } catch (txError) {
            console.error("⚠️ Failed to create transaction:", txError)
          }
        } else {
          console.log("❌ Volunteer profile not found!")
        }
        return NextResponse.redirect(new URL("/volunteer/dashboard?subscription=success", request.url))
      }
    } else if (paymentType === "unlock" && volunteerId) {
      return NextResponse.redirect(new URL(`/volunteers/${volunteerId}?unlocked=pending`, request.url))
    }

    // Default redirect
    console.log("⚠️ No matching condition - redirecting to pricing")
    return NextResponse.redirect(new URL("/pricing?payment=success", request.url))
  } catch (error: any) {
    console.error("❌ Payment link callback error:", error)
    return NextResponse.redirect(new URL("/pricing?payment=error", request.url))
  }
}
