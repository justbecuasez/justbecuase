import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getDb, COLLECTIONS } from "@/lib/database"
import type { PaymentGatewayConfig, PaymentGatewayType } from "@/lib/types"
import Stripe from "stripe"

// Collection name for secure payment credentials
const PAYMENT_CONFIG_COLLECTION = "paymentGatewayConfig"

// GET - Retrieve payment gateway configuration (masked secrets)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can access payment config
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const db = await getDb()
    const config = await db.collection(PAYMENT_CONFIG_COLLECTION).findOne({ type: "primary" })

    if (!config) {
      return NextResponse.json({
        gateway: "none",
        isLive: false,
        stripeConfigured: false,
        razorpayConfigured: false,
      })
    }

    // Return masked configuration (never expose full secrets)
    return NextResponse.json({
      gateway: config.gateway || "none",
      isLive: config.isLive || false,
      // Stripe - show only last 4 chars
      stripeConfigured: !!config.stripeSecretKey,
      stripePublishableKey: config.stripePublishableKey || "",
      stripeSecretKeyMasked: config.stripeSecretKey 
        ? `sk_****${config.stripeSecretKey.slice(-8)}` 
        : "",
      // Razorpay - show only last 4 chars  
      razorpayConfigured: !!config.razorpayKeySecret,
      razorpayKeyId: config.razorpayKeyId || "",
      razorpayKeySecretMasked: config.razorpayKeySecret 
        ? `****${config.razorpayKeySecret.slice(-8)}` 
        : "",
      // Metadata
      configuredAt: config.configuredAt,
      configuredBy: config.configuredBy,
      lastTestedAt: config.lastTestedAt,
      testSuccessful: config.testSuccessful,
    })
  } catch (error: any) {
    console.error("Error fetching payment config:", error)
    return NextResponse.json({ error: "Failed to fetch payment configuration" }, { status: 500 })
  }
}

// POST - Save payment gateway configuration
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
    const { 
      gateway, 
      isLive,
      stripePublishableKey,
      stripeSecretKey,
      razorpayKeyId,
      razorpayKeySecret,
    } = body

    // Validate gateway type
    const validGateways: PaymentGatewayType[] = ["stripe", "razorpay", "none"]
    if (!validGateways.includes(gateway)) {
      return NextResponse.json({ error: "Invalid payment gateway" }, { status: 400 })
    }

    const db = await getDb()
    const collection = db.collection(PAYMENT_CONFIG_COLLECTION)

    // Get existing config to preserve unchanged secrets
    const existingConfig = await collection.findOne({ type: "primary" })

    // Build update object - only update fields that are provided
    const updateData: any = {
      type: "primary",
      gateway,
      isLive: isLive || false,
      configuredAt: new Date(),
      configuredBy: session.user.email || session.user.id,
    }

    // Stripe keys - only update if provided (not empty)
    if (stripePublishableKey !== undefined && stripePublishableKey !== "") {
      updateData.stripePublishableKey = stripePublishableKey
    } else if (existingConfig?.stripePublishableKey) {
      updateData.stripePublishableKey = existingConfig.stripePublishableKey
    }

    if (stripeSecretKey !== undefined && stripeSecretKey !== "" && !stripeSecretKey.includes("****")) {
      updateData.stripeSecretKey = stripeSecretKey
    } else if (existingConfig?.stripeSecretKey) {
      updateData.stripeSecretKey = existingConfig.stripeSecretKey
    }

    // Razorpay keys - only update if provided (not empty)
    if (razorpayKeyId !== undefined && razorpayKeyId !== "") {
      updateData.razorpayKeyId = razorpayKeyId
    } else if (existingConfig?.razorpayKeyId) {
      updateData.razorpayKeyId = existingConfig.razorpayKeyId
    }

    if (razorpayKeySecret !== undefined && razorpayKeySecret !== "" && !razorpayKeySecret.includes("****")) {
      updateData.razorpayKeySecret = razorpayKeySecret
    } else if (existingConfig?.razorpayKeySecret) {
      updateData.razorpayKeySecret = existingConfig.razorpayKeySecret
    }

    // Upsert the configuration
    await collection.updateOne(
      { type: "primary" },
      { $set: updateData },
      { upsert: true }
    )

    // Also update admin settings with the public key for frontend use
    const adminSettingsCollection = db.collection(COLLECTIONS.ADMIN_SETTINGS)
    if (gateway === "stripe" && updateData.stripePublishableKey) {
      await adminSettingsCollection.updateOne(
        {},
        { 
          $set: { 
            "paymentGateway.gateway": "stripe",
            "paymentGateway.isLive": isLive,
            "paymentGateway.stripePublishableKey": updateData.stripePublishableKey,
          } 
        },
        { upsert: true }
      )
    } else if (gateway === "razorpay" && updateData.razorpayKeyId) {
      await adminSettingsCollection.updateOne(
        {},
        { 
          $set: { 
            razorpayKeyId: updateData.razorpayKeyId,
            "paymentGateway.gateway": "razorpay",
            "paymentGateway.isLive": isLive,
            "paymentGateway.razorpayKeyId": updateData.razorpayKeyId,
          } 
        },
        { upsert: true }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: "Payment gateway configuration saved successfully" 
    })
  } catch (error: any) {
    console.error("Error saving payment config:", error)
    return NextResponse.json({ error: "Failed to save payment configuration" }, { status: 500 })
  }
}

// PUT - Test payment gateway connection
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
    const { gateway } = body

    const db = await getDb()
    const config = await db.collection(PAYMENT_CONFIG_COLLECTION).findOne({ type: "primary" })

    if (!config) {
      return NextResponse.json({ 
        success: false, 
        error: "No payment configuration found" 
      }, { status: 400 })
    }

    let testResult = { success: false, message: "", details: {} as any }

    if (gateway === "stripe") {
      if (!config.stripeSecretKey) {
        return NextResponse.json({ 
          success: false, 
          error: "Stripe secret key not configured" 
        }, { status: 400 })
      }

      try {
        const stripe = new Stripe(config.stripeSecretKey)
        const account = await stripe.accounts.retrieve()
        
        testResult = {
          success: true,
          message: "Stripe connection successful!",
          details: {
            accountId: account.id,
            country: account.country,
            currency: account.default_currency?.toUpperCase(),
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
          }
        }
      } catch (stripeError: any) {
        testResult = {
          success: false,
          message: stripeError.message || "Failed to connect to Stripe",
          details: { code: stripeError.code }
        }
      }
    } else if (gateway === "razorpay") {
      if (!config.razorpayKeyId || !config.razorpayKeySecret) {
        return NextResponse.json({ 
          success: false, 
          error: "Razorpay credentials not configured" 
        }, { status: 400 })
      }

      try {
        const Razorpay = require("razorpay")
        const razorpay = new Razorpay({
          key_id: config.razorpayKeyId,
          key_secret: config.razorpayKeySecret,
        })
        
        // Test by fetching payments (limited)
        await razorpay.payments.all({ count: 1 })
        
        testResult = {
          success: true,
          message: "Razorpay connection successful!",
          details: {
            keyId: config.razorpayKeyId,
          }
        }
      } catch (razorpayError: any) {
        testResult = {
          success: false,
          message: razorpayError.message || "Failed to connect to Razorpay",
          details: {}
        }
      }
    } else {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid gateway specified" 
      }, { status: 400 })
    }

    // Update last tested info
    await db.collection(PAYMENT_CONFIG_COLLECTION).updateOne(
      { type: "primary" },
      { 
        $set: { 
          lastTestedAt: new Date(),
          testSuccessful: testResult.success,
        } 
      }
    )

    return NextResponse.json(testResult)
  } catch (error: any) {
    console.error("Error testing payment gateway:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to test payment gateway" 
    }, { status: 500 })
  }
}
