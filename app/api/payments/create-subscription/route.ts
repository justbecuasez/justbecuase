import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getStripeClient } from "@/lib/payment-gateway"

// Stripe Price IDs for each plan (from Stripe Dashboard)
const STRIPE_PRICE_IDS: Record<string, string> = {
  "ngo-pro": "price_1SqZeBK5qwIJJQ03wHVdc5Ij",         // NGO Pro - $0.50/month recurring
  "volunteer-pro": "price_1SqZP4K5qwIJJQ03s0vB1zR2",    // Volunteer Pro - $0.50/month recurring
}

// Create a Stripe Checkout Session for subscription
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { planId } = body

    if (!planId) {
      return NextResponse.json({ error: "Plan ID required" }, { status: 400 })
    }

    // Free plans don't need payment
    if (planId === "ngo-free" || planId === "volunteer-free") {
      return NextResponse.json({ 
        success: true, 
        message: "Free plan, no payment needed" 
      })
    }

    // Validate plan exists in Stripe
    const priceId = STRIPE_PRICE_IDS[planId]
    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    // Validate user role matches plan type
    const userRole = session.user.role as string
    const planRole = planId.startsWith("ngo-") ? "ngo" : "volunteer"
    if (userRole !== planRole) {
      return NextResponse.json({ 
        error: `This plan is for ${planRole}s only` 
      }, { status: 403 })
    }

    // Get Stripe client (handles org key + account context automatically)
    const { stripe } = await getStripeClient()

    // Build URLs
    const origin = request.headers.get("origin") || process.env.FRONTEND_URL || "https://justbecausenetwork.com"

    // Create Stripe Checkout Session with the recurring price
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: session.user.id,
      customer_email: session.user.email || undefined,
      metadata: {
        userId: session.user.id,
        planId,
        userRole,
      },
      success_url: `${origin}/api/payments/stripe-callback?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`,
      cancel_url: `${origin}/pricing?payment=cancelled`,
    })

    return NextResponse.json({
      gateway: "stripe",
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    })
  } catch (error: any) {
    console.error("Error creating Stripe checkout session:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to create checkout session" 
    }, { status: 500 })
  }
}
