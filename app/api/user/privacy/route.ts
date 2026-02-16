import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getDb, userIdQuery } from "@/lib/database"

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDb()
    const userId = session.user.id

    // Get user from user collection (Better Auth stores _id as ObjectId, no 'id' field)
    const user = await db.collection("user").findOne(userIdQuery(userId))
    const role = session.user.role as string

    if (role === "volunteer") {
      return NextResponse.json({
        privacy: user?.privacy || {
          showProfile: true,
          showInSearch: true,
          emailNotifications: true,
          applicationNotifications: true,
          messageNotifications: true,
          opportunityDigest: true,
        }
      })
    } else if (role === "ngo") {
      return NextResponse.json({
        privacy: user?.privacy || {
          showProfile: true,
          showInSearch: true,
          emailNotifications: true,
          applicationNotifications: true,
          messageNotifications: true,
        }
      })
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  } catch (error) {
    console.error("Failed to fetch privacy settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { privacy } = await request.json()

    // Validate privacy fields - only allow known boolean fields
    const allowedFields = [
      'showProfile', 'showInSearch', 'emailNotifications',
      'applicationNotifications', 'messageNotifications', 'opportunityDigest'
    ]
    const sanitizedPrivacy: Record<string, boolean> = {}
    for (const key of allowedFields) {
      if (key in privacy && typeof privacy[key] === 'boolean') {
        sanitizedPrivacy[key] = privacy[key]
      }
    }

    const db = await getDb()
    const userId = session.user.id

    // Update privacy in user collection (Better Auth stores _id as ObjectId, no 'id' field)
    await db.collection("user").updateOne(
      userIdQuery(userId),
      { 
        $set: { 
          privacy: sanitizedPrivacy,
          updatedAt: new Date() 
        } 
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update privacy settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
