import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { couponsDb } from "@/lib/database"

// PUT: Update a coupon
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Only allow updating certain fields
    const updates: Record<string, any> = {}
    if (body.description !== undefined) updates.description = body.description
    if (body.discountType !== undefined) updates.discountType = body.discountType
    if (body.discountValue !== undefined) updates.discountValue = Number(body.discountValue)
    if (body.maxUses !== undefined) updates.maxUses = Number(body.maxUses)
    if (body.maxUsesPerUser !== undefined) updates.maxUsesPerUser = Number(body.maxUsesPerUser)
    if (body.applicablePlans !== undefined) updates.applicablePlans = body.applicablePlans
    if (body.minAmount !== undefined) updates.minAmount = body.minAmount ? Number(body.minAmount) : undefined
    if (body.validFrom !== undefined) updates.validFrom = new Date(body.validFrom)
    if (body.validUntil !== undefined) updates.validUntil = new Date(body.validUntil)
    if (body.isActive !== undefined) updates.isActive = body.isActive

    const success = await couponsDb.update(id, updates)
    if (!success) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Admin Coupons PUT]", error)
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 })
  }
}

// DELETE: Delete a coupon
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const success = await couponsDb.delete(id)
    if (!success) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Admin Coupons DELETE]", error)
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 })
  }
}
