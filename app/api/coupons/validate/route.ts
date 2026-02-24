import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { couponsDb, adminSettingsDb } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { code, planId } = body

    if (!code || !planId) {
      return NextResponse.json({ error: "Coupon code and plan ID are required" }, { status: 400 })
    }

    // Get the plan price from admin settings (coerce to number — may be stored as string)
    const adminSettings = await adminSettingsDb.get()
    const amount = planId === "ngo-pro"
      ? (Number(adminSettings?.ngoProPrice) || 2999)
      : planId === "volunteer-pro"
        ? (Number(adminSettings?.volunteerProPrice) || 999)
        : 0

    if (amount <= 0) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const result = await couponsDb.validate(code, session.user.id, planId, amount)

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error }, { status: 200 })
    }

    const currency = adminSettings?.currency || "INR"

    return NextResponse.json({
      valid: true,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
      originalAmount: amount,
      currency,
      discountType: result.coupon!.discountType,
      discountValue: result.coupon!.discountValue,
    })
  } catch (error: any) {
    console.error("[Coupon Validate] Error:", error)
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 })
  }
}
