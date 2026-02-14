import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { adminSettingsDb } from "@/lib/database"
import { createPaymentOrder, getPaymentCredentials } from "@/lib/payment-gateway"

// Create a payment order for subscription (supports Stripe & Razorpay)
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

    // Get admin settings for dynamic pricing
    const settings = await adminSettingsDb.get()
    const currency = settings?.currency || "USD"
    
    console.log("💰 Settings loaded:", {
      ngoProPrice: settings?.ngoProPrice,
      volunteerProPrice: settings?.volunteerProPrice,
      currency: settings?.currency
    })
    
    // Build plan prices from admin settings
    const PLAN_PRICES: Record<string, number> = {
      "ngo-free": 0,
      "ngo-pro": settings?.ngoProPrice || 2999,
      "volunteer-free": 0,
      "volunteer-pro": settings?.volunteerProPrice || 999,
    }
    
    console.log("📋 Plan prices:", PLAN_PRICES)
    console.log("💳 Selected plan:", planId, "Price:", PLAN_PRICES[planId])

    // Validate plan exists
    const planPrice = PLAN_PRICES[planId]
    if (planPrice === undefined) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    // Free plans don't need payment
    if (planPrice === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Free plan, no payment needed" 
      })
    }

    // Check if any payment gateway is configured
    const creds = await getPaymentCredentials()
    if (creds.gateway === "none") {
      return NextResponse.json({ 
        error: "Payment gateway not configured. Please configure Stripe or Razorpay in admin settings." 
      }, { status: 500 })
    }

    // Validate user role matches plan type
    const userRole = session.user.role as string
    const planRole = planId.startsWith("ngo-") ? "ngo" : "volunteer"
    if (userRole !== planRole) {
      return NextResponse.json({ 
        error: `This plan is for ${planRole}s only` 
      }, { status: 403 })
    }

    // Create payment order using unified interface
    const order = await createPaymentOrder({
      amount: planPrice * 100, // Amount in smallest currency unit
      currency,
      receipt: `sub_${Date.now()}`.slice(0, 40),
      description: `${planId} subscription`,
      notes: {
        userId: session.user.id,
        planId,
        type: "subscription",
      },
    })

    return NextResponse.json({
      gateway: order.gateway,
      orderId: order.orderId,
      amount: planPrice,
      currency,
      // Stripe specific
      clientSecret: order.clientSecret,
      publishableKey: order.publishableKey,
      // Razorpay specific
      keyId: order.keyId,
    })
  } catch (error: any) {
    console.error("Error creating subscription order:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to create order" 
    }, { status: 500 })
  }
}
