import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { followsDb } from "@/lib/database"

/**
 * GET /api/follow/stats?userId=xxx
 * Returns followersCount, followingCount, isFollowing (relative to viewer)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const session = await auth.api.getSession({ headers: await headers() })
    const viewerId = session?.user?.id

    const stats = await followsDb.getStats(userId, viewerId)

    return NextResponse.json({
      followersCount: stats.followersCount,
      followingCount: stats.followingCount,
      isFollowing: stats.isFollowing,
    })
  } catch (error) {
    console.error("Follow stats API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
