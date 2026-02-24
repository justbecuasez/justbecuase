import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getDashboardMetrics, getEventTimeSeries, ensureAnalyticsIndexes } from "@/lib/analytics"
import type { EventCategory, AnalyticsTimeRange } from "@/lib/analytics"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    // Auth check — admin only
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") || "dashboard"
    const days = parseInt(searchParams.get("days") || "30", 10)

    // Ensure indexes exist (idempotent)
    await ensureAnalyticsIndexes()

    if (type === "dashboard") {
      const metrics = await getDashboardMetrics(days)
      return NextResponse.json({ success: true, data: metrics })
    }

    if (type === "timeseries") {
      const category = searchParams.get("category") as EventCategory
      const action = searchParams.get("action") || null
      const granularity = (searchParams.get("granularity") || "day") as "hour" | "day" | "week" | "month"

      if (!category) {
        return NextResponse.json({ error: "category is required" }, { status: 400 })
      }

      const now = new Date()
      const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      const range: AnalyticsTimeRange = { start, end: now, granularity }

      const data = await getEventTimeSeries(category, action, range)
      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ error: "Invalid type. Use 'dashboard' or 'timeseries'" }, { status: 400 })
  } catch (err) {
    console.error("[Admin Analytics API] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
