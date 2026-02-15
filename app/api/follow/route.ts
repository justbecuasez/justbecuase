import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { followsDb, userIdQuery } from "@/lib/database"

/**
 * POST /api/follow
 * Body: { targetId: string, action: "follow" | "unfollow" }
 * Returns updated follower count
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { targetId, action } = body

    if (!targetId || !action || !["follow", "unfollow"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    if (session.user.id === targetId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    const followerRole = (session.user as any).role || "volunteer"

    if (action === "follow") {
      // Look up target user role (handles both ObjectId and string IDs)
      const { getDb } = await import("@/lib/database")
      const db = await getDb()
      const targetUser = await db.collection("user").findOne(userIdQuery(targetId))
      if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const created = await followsDb.follow(
        session.user.id,
        followerRole,
        targetId,
        targetUser.role || "volunteer"
      )

      if (!created) {
        return NextResponse.json({ error: "Already following" }, { status: 409 })
      }
    } else {
      const removed = await followsDb.unfollow(session.user.id, targetId)
      if (!removed) {
        return NextResponse.json({ error: "Not following" }, { status: 409 })
      }
    }

    const followersCount = await followsDb.getFollowersCount(targetId)

    return NextResponse.json({
      success: true,
      followersCount,
      isFollowing: action === "follow",
    })
  } catch (error) {
    console.error("Follow API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
