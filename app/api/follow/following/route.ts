import { NextRequest, NextResponse } from "next/server"
import { followsDb, getDb } from "@/lib/database"

/**
 * GET /api/follow/following?userId=xxx&page=1&limit=20
 * Returns paginated list of who this user follows, with user details
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

    const { following, total, totalPages } = await followsDb.getFollowing(userId, page, limit)

    if (following.length === 0) {
      return NextResponse.json({ users: [], total: 0, page, totalPages: 0 })
    }

    // Batch fetch user details
    const db = await getDb()
    const followingIds = following.map(f => f.followingId)
    const users = await db.collection("user")
      .find({ id: { $in: followingIds } })
      .project({ id: 1, name: 1, image: 1, role: 1, bio: 1, orgName: 1, avatar: 1 })
      .toArray()

    const userMap = new Map(users.map(u => [u.id, u]))

    const enrichedUsers = following.map(f => {
      const user = userMap.get(f.followingId)
      return {
        id: f.followingId,
        name: user?.role === "ngo" ? (user?.orgName || user?.name || "Unknown") : (user?.name || "Unknown"),
        avatar: user?.avatar || user?.image,
        role: f.followingRole,
        headline: user?.bio?.split("\n")[0]?.substring(0, 100),
      }
    })

    return NextResponse.json({ users: enrichedUsers, total, page, totalPages })
  } catch (error) {
    console.error("Following API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
