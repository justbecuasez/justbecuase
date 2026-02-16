import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { followsDb, userIdQuery, getDb } from "@/lib/database"

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

      // Get updated count
      const followersCount = await followsDb.getFollowersCount(targetId)

      // Create notification for the person being followed
      const followerName = session.user.name || "Someone"
      const followerProfilePath = followerRole === "ngo" ? `/ngos/${session.user.id}` : `/volunteers/${session.user.id}`
      const targetRole = targetUser.role || "volunteer"
      const targetProfilePath = targetRole === "ngo" ? `/ngos/${targetId}` : `/volunteers/${targetId}`
      const targetName = targetRole === "ngo" ? (targetUser.orgName || targetUser.name || "there") : (targetUser.name || "there")

      try {
        const notificationsCollection = db.collection("notifications")
        await notificationsCollection.insertOne({
          userId: targetId,
          type: "new_follower",
          title: "New Follower",
          message: `${followerName} started following you`,
          referenceId: session.user.id,
          referenceType: "user",
          link: followerProfilePath,
          isRead: false,
          createdAt: new Date(),
        })
      } catch (e) {
        console.error("[Follow API] Failed to create notification:", e)
      }

      // Send email notification
      if (targetUser.email) {
        try {
          const { sendEmail, getNewFollowerEmailHtml } = await import("@/lib/email")
          const html = getNewFollowerEmailHtml(
            targetName,
            followerName,
            followerRole,
            followerProfilePath,
            targetProfilePath,
            followersCount
          )
          await sendEmail({
            to: targetUser.email,
            subject: `${followerName} is now following you on JustBeCause!`,
            html,
            text: `Hi ${targetName}, ${followerName} just started following you on JustBeCause Network. You now have ${followersCount} follower${followersCount === 1 ? "" : "s"}.`,
          })
        } catch (emailErr) {
          console.error("[Follow API] Failed to send email:", emailErr)
        }
      }

      return NextResponse.json({
        success: true,
        followersCount,
        isFollowing: true,
      })
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
      isFollowing: false,
    })
  } catch (error) {
    console.error("Follow API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
