import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/database"
import { ObjectId } from "mongodb"

// POST /api/messages/[conversationId]/read - Mark all messages as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId } = await params

    const db = await getDb()
    const conversationsCollection = db.collection("conversations")
    const messagesCollection = db.collection("messages")

    // Verify user is part of conversation
    const conversation = await conversationsCollection.findOne({
      _id: new ObjectId(conversationId),
      participants: session.user.id,
    })

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    // Mark all messages in this conversation as read for the current user
    const result = await messagesCollection.updateMany(
      {
        conversationId,
        receiverId: session.user.id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    )

    return NextResponse.json({
      success: true,
      markedAsRead: result.modifiedCount,
    })
  } catch (error) {
    console.error("[POST /api/messages/[conversationId]/read] Error:", error)
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    )
  }
}
