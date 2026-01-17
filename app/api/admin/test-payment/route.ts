import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { createPaymentOrder, getPaymentCredentials, verifyPayment } from "@/lib/payment-gateway"

// POST - Create a test payment (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { amount = 100, currency = "INR" } = body // Default 1 rupee (100 paise)

    // Check if any payment gateway is configured
    const creds = await getPaymentCredentials()
    if (creds.gateway === "none") {
      return NextResponse.json({ 
        error: "No payment gateway configured. Please configure Stripe or Razorpay first." 
      }, { status: 400 })
    }

    // Create test payment order
    const order = await createPaymentOrder({
      amount: amount, // Already in smallest unit (paise/cents)
      currency,
      receipt: `test_${Date.now()}`.slice(0, 40),
      description: "Test payment from admin panel",
      notes: {
        type: "test_payment",
        adminId: session.user.id,
        testAt: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      gateway: order.gateway,
      orderId: order.orderId,
      amount: amount,
      displayAmount: (amount / 100).toFixed(2),
      currency,
      // Stripe specific
      clientSecret: order.clientSecret,
      publishableKey: order.publishableKey,
      // Razorpay specific
      keyId: order.keyId,
      message: `Test payment of ${currency} ${(amount / 100).toFixed(2)} created successfully`,
    })
  } catch (error: any) {
    console.error("Error creating test payment:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to create test payment" 
    }, { status: 500 })
  }
}

// PUT - Verify a test payment
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { 
      gateway,
      // Stripe
      paymentIntentId,
      // Razorpay
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
    } = body

    let result

    if (gateway === "stripe" && paymentIntentId) {
      result = await verifyPayment({
        gateway: "stripe",
        paymentIntentId,
      })
    } else if (gateway === "razorpay" && razorpay_order_id) {
      result = await verifyPayment({
        gateway: "razorpay",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      })
    } else {
      return NextResponse.json({ error: "Invalid verification parameters" }, { status: 400 })
    }

    return NextResponse.json({
      success: result.success,
      paymentId: result.paymentId,
      message: "Test payment verified successfully! 🎉",
    })
  } catch (error: any) {
    console.error("Error verifying test payment:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to verify test payment" 
    }, { status: 500 })
  }
}
