import { NextRequest, NextResponse } from "next/server"
import { followsDb, getDb } from "@/lib/database"

/**
 * GET /api/follow/followers?userId=xxx&page=1&limit=20
 * Returns paginated followers with user details
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50)

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const { followers, total, totalPages } = await followsDb.getFollowers(userId, page, limit)

    if (followers.length === 0) {
      return NextResponse.json({ users: [], total: 0, page, totalPages: 0 })
    }

    // Batch fetch user details
    const db = await getDb()
    const followerIds = followers.map(f => f.followerId)
    const users = await db.collection("user")
      .find({ id: { $in: followerIds } })
      .project({ id: 1, name: 1, image: 1, role: 1, bio: 1, orgName: 1, avatar: 1 })
      .toArray()

    const userMap = new Map(users.map(u => [u.id, u]))

    const enrichedUsers = followers.map(f => {
      const user = userMap.get(f.followerId)
      return {
        id: f.followerId,
        name: user?.role === "ngo" ? (user?.orgName || user?.name || "Unknown") : (user?.name || "Unknown"),
        avatar: user?.avatar || user?.image,
        role: f.followerRole,
        headline: user?.bio?.split("\n")[0]?.substring(0, 100),
      }
    })

    return NextResponse.json({ users: enrichedUsers, total, page, totalPages })
  } catch (error) {
    console.error("Followers API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
