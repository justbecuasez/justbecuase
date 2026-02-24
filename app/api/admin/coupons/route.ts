import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { couponsDb } from "@/lib/database"

export const dynamic = "force-dynamic"

// GET: List all coupons
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const coupons = await couponsDb.findAll()
    return NextResponse.json({ success: true, data: coupons })
  } catch (error: any) {
    console.error("[Admin Coupons GET]", error)
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 })
  }
}

// POST: Create a new coupon
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      code,
      description,
      discountType,
      discountValue,
      maxUses = 0,
      maxUsesPerUser = 1,
      applicablePlans = [],
      minAmount = 0,
      validFrom,
      validUntil,
      isActive = true,
    } = body

    if (!code || !discountType || !discountValue || !validFrom || !validUntil) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check for duplicate code
    const existing = await couponsDb.findByCode(code.toUpperCase())
    if (existing) {
      return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 409 })
    }

    const now = new Date()
    const id = await couponsDb.create({
      code: code.toUpperCase().trim(),
      description: description || undefined,
      discountType,
      discountValue: Number(discountValue),
      maxUses: Number(maxUses),
      usedCount: 0,
      maxUsesPerUser: Number(maxUsesPerUser),
      applicablePlans,
      minAmount: minAmount ? Number(minAmount) : undefined,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      isActive,
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({ success: true, id })
  } catch (error: any) {
    console.error("[Admin Coupons POST]", error)
    if (error.code === 11000) {
      return NextResponse.json({ error: "Duplicate coupon code" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 })
  }
}
