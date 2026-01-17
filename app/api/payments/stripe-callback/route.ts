import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import Stripe from "stripe"
import { getPaymentCredentials } from "@/lib/payment-gateway"
import { ngoProfilesDb, adminSettingsDb, transactionsDb, profileUnlocksDb } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }

    const { searchParams } = new URL(request.url)
    const paymentIntentId = searchParams.get("payment_intent")
    const type = searchParams.get("type")
    const volunteerId = searchParams.get("volunteerId")
    const plan = searchParams.get("plan")

    if (!paymentIntentId) {
      return NextResponse.redirect(new URL("/pricing?error=missing_payment_intent", request.url))
    }

    // Get Stripe credentials
    const creds = await getPaymentCredentials()
    if (creds.gateway !== "stripe" || !creds.stripeSecretKey) {
      return NextResponse.redirect(new URL("/pricing?error=invalid_gateway", request.url))
    }

    const stripe = new Stripe(creds.stripeSecretKey)

    // Retrieve the payment intent to verify
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.redirect(new URL(`/pricing?error=payment_${paymentIntent.status}`, request.url))
    }

    // Handle based on payment type
    if (type === "unlock" && volunteerId) {
      // Profile unlock payment
      await handleProfileUnlock(session.user.id, volunteerId, paymentIntent)
      return NextResponse.redirect(new URL(`/volunteers/${volunteerId}?unlocked=true`, request.url))
    } else if (type === "subscription" && plan) {
      // Subscription payment
      await handleSubscription(session.user.id, plan, paymentIntent)
      return NextResponse.redirect(new URL("/ngo/dashboard?subscription=success", request.url))
    }

    return NextResponse.redirect(new URL("/pricing?error=unknown_type", request.url))
  } catch (error: any) {
    console.error("Stripe callback error:", error)
    return NextResponse.redirect(new URL(`/pricing?error=${encodeURIComponent(error.message)}`, request.url))
  }
}

async function handleProfileUnlock(ngoId: string, volunteerId: string, paymentIntent: Stripe.PaymentIntent) {
  const amount = paymentIntent.amount / 100
  const currency = paymentIntent.currency.toUpperCase()
  const now = new Date()
  
  // Save transaction record
  await transactionsDb.create({
    userId: ngoId,
    type: "profile_unlock",
    amount,
    currency,
    paymentStatus: "completed",
    status: "completed",
    paymentGateway: "stripe",
    paymentId: paymentIntent.id,
    createdAt: now,
  })

  // Create profile unlock record
  await profileUnlocksDb.create({
    ngoId,
    volunteerId,
    amountPaid: amount,
    currency,
    paymentId: paymentIntent.id,
    paymentMethod: "stripe",
    unlockedAt: now,
  })

  // Update NGO profile to add unlocked volunteer
  const ngoProfile = await ngoProfilesDb.findByUserId(ngoId)
  if (ngoProfile && ngoProfile._id) {
    await ngoProfilesDb.incrementMonthlyUnlocks(ngoId)
  }
}

async function handleSubscription(ngoId: string, plan: string, paymentIntent: Stripe.PaymentIntent) {
  const amount = paymentIntent.amount / 100
  const currency = paymentIntent.currency.toUpperCase()

  // Calculate subscription end date (30 days)
  const now = new Date()
  const subscriptionEndDate = new Date(now)
  subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30)

  // Save transaction record
  await transactionsDb.create({
    userId: ngoId,
    type: "subscription",
    description: `${plan} subscription`,
    amount,
    currency,
    paymentStatus: "completed",
    status: "completed",
    paymentGateway: "stripe",
    paymentId: paymentIntent.id,
    createdAt: now,
  })

  // Update NGO profile with subscription
  const ngoProfile = await ngoProfilesDb.findByUserId(ngoId)
  if (ngoProfile && ngoProfile._id) {
    const subscriptionPlan = plan.includes("pro") ? "pro" : "free"
    await ngoProfilesDb.update(ngoProfile._id.toString(), {
      subscriptionPlan: subscriptionPlan as "free" | "pro",
      subscriptionExpiry: subscriptionEndDate,
    })
  }
}
