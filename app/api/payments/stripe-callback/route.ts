import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getStripeClient } from "@/lib/payment-gateway"
import { ngoProfilesDb, volunteerProfilesDb, transactionsDb, notificationsDb } from "@/lib/database"
import { getDb, userIdQuery } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }

    const { searchParams } = new URL(request.url)
    const checkoutSessionId = searchParams.get("session_id")
    const plan = searchParams.get("plan")

    if (!checkoutSessionId) {
      return NextResponse.redirect(new URL("/pricing?error=missing_session", request.url))
    }

    // Get Stripe client (handles org key automatically)
    const { stripe } = await getStripeClient()

    // Retrieve the checkout session to verify payment
    const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId)

    if (checkoutSession.payment_status !== "paid") {
      console.error("Payment not completed. Status:", checkoutSession.payment_status)
      return NextResponse.redirect(new URL("/pricing?error=payment_not_completed", request.url))
    }

    // Get user info from session metadata or auth
    const userId = checkoutSession.client_reference_id || session.user.id
    const planId = checkoutSession.metadata?.planId || plan
    const userRole = checkoutSession.metadata?.userRole || session.user.role as string

    if (!planId) {
      return NextResponse.redirect(new URL("/pricing?error=missing_plan", request.url))
    }

    // Determine plan type
    const isNgoPlan = planId.startsWith("ngo-")
    const isPro = planId.endsWith("-pro")
    const dashboardPath = isNgoPlan ? "/ngo/dashboard" : "/volunteer/dashboard"

    // Calculate subscription dates
    const now = new Date()
    const subscriptionExpiry = new Date(now)
    subscriptionExpiry.setMonth(subscriptionExpiry.getMonth() + 1)

    // Activate subscription in the appropriate profile
    if (isNgoPlan) {
      const profile = await ngoProfilesDb.findByUserId(userId)
      if (profile && profile._id) {
        await ngoProfilesDb.update(profile._id.toString(), {
          subscriptionPlan: isPro ? "pro" : "free",
          subscriptionExpiry,
          monthlyUnlocksUsed: 0,
        })
      }
    } else {
      const profile = await volunteerProfilesDb.findByUserId(userId)
      if (profile && profile._id) {
        await volunteerProfilesDb.update(profile._id.toString(), {
          subscriptionPlan: isPro ? "pro" : "free",
          subscriptionExpiry,
          monthlyApplicationsUsed: 0,
        })
      }
    }

    // Get actual amount from checkout session
    const amount = (checkoutSession.amount_total || 0) / 100
    const currency = (checkoutSession.currency || "usd").toUpperCase()

    // Create transaction record
    const subscriptionId = typeof checkoutSession.subscription === 'string' 
      ? checkoutSession.subscription 
      : checkoutSession.subscription?.id

    await transactionsDb.create({
      userId,
      type: "subscription",
      referenceId: planId,
      referenceType: "subscription",
      amount,
      currency,
      paymentGateway: "stripe",
      paymentId: checkoutSessionId,
      status: "completed",
      paymentStatus: "completed",
      description: `${isPro ? "Pro" : "Free"} Plan Subscription${subscriptionId ? ` (sub: ${subscriptionId})` : ""}`,
      createdAt: now,
    })

    // Create in-app notification
    try {
      await notificationsDb.create({
        userId,
        type: "subscription_activated",
        title: "Pro Plan Activated!",
        message: "Your Pro subscription is now active. Enjoy unlimited access!",
        referenceId: planId,
        referenceType: "subscription",
        link: dashboardPath,
        isRead: false,
        createdAt: now,
      })
    } catch (notifErr) {
      console.error("[stripe-callback] Failed to create notification:", notifErr)
    }

    // Send confirmation email
    try {
      const db = await getDb()
      const userRecord = await db.collection("user").findOne(userIdQuery(userId))
      if (userRecord?.email) {
        const { sendEmail, getSubscriptionConfirmationEmailHtml } = await import("@/lib/email")
        const planName = isNgoPlan ? "NGO Pro" : "Impact Agent Pro"
        const expiryFormatted = subscriptionExpiry.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        const html = getSubscriptionConfirmationEmailHtml(
          userRecord.name || "there",
          planName,
          amount,
          currency,
          expiryFormatted,
          isNgoPlan ? "ngo" : "volunteer"
        )
        await sendEmail({
          to: userRecord.email,
          subject: `Your ${planName} subscription is active!`,
          html,
          text: `Hi ${userRecord.name || "there"}, your ${planName} subscription is now active! Valid until ${expiryFormatted}. Enjoy your Pro benefits!`,
        })
      }
    } catch (emailErr) {
      console.error("[stripe-callback] Failed to send confirmation email:", emailErr)
    }

    return NextResponse.redirect(new URL(`${dashboardPath}?subscription=success`, request.url))
  } catch (error: any) {
    console.error("Stripe callback error:", error)
    return NextResponse.redirect(new URL(`/pricing?error=${encodeURIComponent(error.message)}`, request.url))
  }
}
