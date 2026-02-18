// Payment Gateway Helper
// Provides unified interface for payment operations across different gateways

import { getDb } from "@/lib/database"
import type { PaymentGatewayType } from "@/lib/types"
import Stripe from "stripe"

const PAYMENT_CONFIG_COLLECTION = "paymentGatewayConfig"

// Helper to create Stripe instance with org key support
function createStripeClient(secretKey: string): Stripe {
  const accountId = process.env.STRIPE_ACCOUNT_ID
  return new Stripe(secretKey, {
    ...(accountId ? { stripeAccount: accountId } : {}),
  })
}

export interface PaymentCredentials {
  gateway: PaymentGatewayType
  isLive: boolean
  // Stripe
  stripePublishableKey?: string
  stripeSecretKey?: string
  // Razorpay
  razorpayKeyId?: string
  razorpayKeySecret?: string
}

// Get payment credentials from database (falls back to env vars)
export async function getPaymentCredentials(): Promise<PaymentCredentials> {
  try {
    const db = await getDb()
    const config = await db.collection(PAYMENT_CONFIG_COLLECTION).findOne({ type: "primary" })

    if (config && config.gateway && config.gateway !== "none") {
      return {
        gateway: config.gateway,
        isLive: config.isLive || false,
        stripePublishableKey: config.stripePublishableKey,
        stripeSecretKey: config.stripeSecretKey,
        razorpayKeyId: config.razorpayKeyId,
        razorpayKeySecret: config.razorpayKeySecret,
      }
    }
  } catch (error) {
    console.error("Error fetching payment credentials from DB:", error)
  }

  // Fallback to environment variables
  // Prioritize Stripe (primary gateway)
  const hasStripe = process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  const hasRazorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET

  if (hasStripe) {
    const sk = process.env.STRIPE_SECRET_KEY!
    return {
      gateway: "stripe",
      isLive: sk.startsWith("sk_live") || sk.startsWith("sk_org_live_") || false,
      stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      stripeSecretKey: sk,
    }
  }

  if (hasRazorpay) {
    return {
      gateway: "razorpay",
      isLive: process.env.RAZORPAY_KEY_ID?.startsWith("rzp_live") || false,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
    }
  }

  return { gateway: "none", isLive: false }
}

// Get Stripe client instance
export async function getStripeClient() {
  const creds = await getPaymentCredentials()
  
  if (creds.gateway !== "stripe" || !creds.stripeSecretKey) {
    throw new Error("Stripe is not configured")
  }

  const stripe = createStripeClient(creds.stripeSecretKey)
  return { stripe, publishableKey: creds.stripePublishableKey, isLive: creds.isLive }
}

// Get Razorpay client instance
export async function getRazorpayClient() {
  const creds = await getPaymentCredentials()
  
  if (creds.gateway !== "razorpay" || !creds.razorpayKeyId || !creds.razorpayKeySecret) {
    throw new Error("Razorpay is not configured")
  }

  const Razorpay = require("razorpay")
  const razorpay = new Razorpay({
    key_id: creds.razorpayKeyId,
    key_secret: creds.razorpayKeySecret,
  })

  return { razorpay, keyId: creds.razorpayKeyId, isLive: creds.isLive }
}

// Create a payment order (unified interface)
export interface CreateOrderParams {
  amount: number // in smallest currency unit (cents)
  currency: string
  receipt: string
  notes?: Record<string, string>
  description?: string
}

export interface PaymentOrder {
  gateway: PaymentGatewayType
  orderId: string
  amount: number
  currency: string
  // Gateway-specific
  clientSecret?: string // Stripe
  keyId?: string // Razorpay public key
  publishableKey?: string // Stripe
}

export async function createPaymentOrder(params: CreateOrderParams): Promise<PaymentOrder> {
  const creds = await getPaymentCredentials()

  if (creds.gateway === "stripe" && creds.stripeSecretKey) {
    const stripe = new Stripe(creds.stripeSecretKey)
    
    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency.toLowerCase(),
      metadata: params.notes,
      description: params.description,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return {
      gateway: "stripe",
      orderId: paymentIntent.id,
      amount: params.amount,
      currency: params.currency,
      clientSecret: paymentIntent.client_secret ?? undefined,
      publishableKey: creds.stripePublishableKey,
    }
  }

  if (creds.gateway === "razorpay" && creds.razorpayKeyId && creds.razorpayKeySecret) {
    const Razorpay = require("razorpay")
    const razorpay = new Razorpay({
      key_id: creds.razorpayKeyId,
      key_secret: creds.razorpayKeySecret,
    })

    const order = await razorpay.orders.create({
      amount: params.amount,
      currency: params.currency,
      receipt: params.receipt,
      notes: params.notes,
    })

    return {
      gateway: "razorpay",
      orderId: order.id,
      amount: params.amount,
      currency: params.currency,
      keyId: creds.razorpayKeyId,
    }
  }

  throw new Error("No payment gateway configured. Please configure Stripe or Razorpay in admin settings.")
}

// Verify payment signature
export interface VerifyPaymentParams {
  gateway: PaymentGatewayType
  // Stripe
  paymentIntentId?: string
  // Razorpay
  orderId?: string
  paymentId?: string
  signature?: string
}

export async function verifyPayment(params: VerifyPaymentParams): Promise<{ success: boolean; paymentId: string }> {
  const creds = await getPaymentCredentials()

  if (params.gateway === "stripe" && params.paymentIntentId) {
    if (!creds.stripeSecretKey) {
      throw new Error("Stripe not configured")
    }

    const stripe = new Stripe(creds.stripeSecretKey)
    const paymentIntent = await stripe.paymentIntents.retrieve(params.paymentIntentId)

    if (paymentIntent.status === "succeeded") {
      return { success: true, paymentId: paymentIntent.id }
    }
    
    throw new Error(`Payment not successful. Status: ${paymentIntent.status}`)
  }

  if (params.gateway === "razorpay" && params.orderId && params.paymentId && params.signature) {
    if (!creds.razorpayKeySecret) {
      throw new Error("Razorpay not configured")
    }

    const crypto = require("crypto")
    const generatedSignature = crypto
      .createHmac("sha256", creds.razorpayKeySecret)
      .update(`${params.orderId}|${params.paymentId}`)
      .digest("hex")

    if (generatedSignature === params.signature) {
      return { success: true, paymentId: params.paymentId }
    }

    throw new Error("Invalid payment signature")
  }

  throw new Error("Invalid verification parameters")
}
