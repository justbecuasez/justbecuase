import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getDb } from "@/lib/database"

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

    // Get user from user collection
    const user = await db.collection("user").findOne({ id: userId })
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
    const db = await getDb()
    const userId = session.user.id

    // Update privacy in user collection
    await db.collection("user").updateOne(
      { id: userId },
      { 
        $set: { 
          privacy,
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
