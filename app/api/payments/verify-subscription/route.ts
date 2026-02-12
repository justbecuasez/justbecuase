import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { ngoProfilesDb, volunteerProfilesDb, transactionsDb } from "@/lib/database"
import { verifyPayment } from "@/lib/payment-gateway"
import type { PaymentGatewayType } from "@/lib/types"

// Calculate subscription expiry (1 month from now)
function getSubscriptionExpiry(): Date {
  const expiry = new Date()
  expiry.setMonth(expiry.getMonth() + 1)
  return expiry
}

// Calculate next reset date (1st of next month)
function getNextResetDate(): Date {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return nextMonth
}

// Verify payment and activate subscription (supports Stripe & Razorpay)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      gateway,
      planId,
      // Stripe
      paymentIntentId,
      // Razorpay
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
    } = body

    if (!planId) {
      return NextResponse.json({ error: "Plan ID required" }, { status: 400 })
    }

    // Determine gateway type
    const paymentGateway: PaymentGatewayType = gateway || (razorpay_order_id ? "razorpay" : "stripe")
    let paymentVerification: { success: boolean; paymentId: string }

    // Verify payment based on gateway
    if (paymentGateway === "stripe") {
      if (!paymentIntentId) {
        return NextResponse.json({ error: "Payment intent ID required for Stripe" }, { status: 400 })
      }
      paymentVerification = await verifyPayment({
        gateway: "stripe",
        paymentIntentId,
      })
    } else if (paymentGateway === "razorpay") {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json({ error: "Missing Razorpay payment details" }, { status: 400 })
      }
      paymentVerification = await verifyPayment({
        gateway: "razorpay",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      })
    } else {
      return NextResponse.json({ error: "Invalid payment gateway" }, { status: 400 })
    }

    if (!paymentVerification.success) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
    }

    const userId = session.user.id
    const userRole = session.user.role as string
    const subscriptionExpiry = getSubscriptionExpiry()
    const resetDate = getNextResetDate()

    // Determine plan type and update appropriate profile
    const isNgoPlan = planId.startsWith("ngo-")
    const isPro = planId.endsWith("-pro")

    if (isNgoPlan && userRole === "ngo") {
      // Update NGO profile
      const profile = await ngoProfilesDb.findByUserId(userId)
      if (!profile) {
        return NextResponse.json({ error: "NGO profile not found" }, { status: 404 })
      }

      await ngoProfilesDb.update(userId, {
        subscriptionPlan: isPro ? "pro" : "free",
        subscriptionExpiry,
        monthlyUnlocksUsed: 0, // Reset on upgrade
        monthlyUnlocksLimit: isPro ? 999999 : 0, // Free plan = 0 unlocks
        subscriptionResetDate: resetDate,
      })
    } else if (!isNgoPlan && userRole === "volunteer") {
      // Update Volunteer profile
      const profile = await volunteerProfilesDb.findByUserId(userId)
      if (!profile) {
        return NextResponse.json({ error: "Impact agent profile not found" }, { status: 404 })
      }

      await volunteerProfilesDb.update(userId, {
        subscriptionPlan: isPro ? "pro" : "free",
        subscriptionExpiry,
        monthlyApplicationsUsed: 0, // Reset on upgrade
        subscriptionResetDate: resetDate,
      })
    } else {
      return NextResponse.json({ error: "Plan does not match user role" }, { status: 400 })
    }

    // Create transaction record
    const amount = planId === "ngo-pro" ? 2999 : planId === "volunteer-pro" ? 999 : 0
    await transactionsDb.create({
      userId,
      type: "subscription",
      referenceId: planId,
      referenceType: "subscription",
      amount,
      currency: "INR",
      paymentGateway: paymentGateway,
      paymentId: paymentVerification.paymentId,
      status: "completed",
      paymentStatus: "completed",
      description: `${isPro ? "Pro" : "Free"} Plan Subscription`,
      createdAt: new Date(),
    })

    return NextResponse.json({ 
      success: true, 
      message: "Subscription activated successfully" 
    })
  } catch (error: any) {
    console.error("Error verifying subscription payment:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to verify payment" 
    }, { status: 500 })
  }
}
