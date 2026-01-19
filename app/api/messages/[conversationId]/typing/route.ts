import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/database"

// In-memory store for typing status (in production, use Redis)
const typingUsers = new Map<string, { userId: string; expiresAt: number }>()

// Clean up expired typing statuses
function cleanupExpiredTyping() {
  const now = Date.now()
  typingUsers.forEach((value, key) => {
    if (value.expiresAt < now) {
      typingUsers.delete(key)
    }
  })
}

// POST /api/messages/[conversationId]/typing - Set typing status
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
    const body = await request.json()
    const { isTyping } = body

    const db = await getDb()
    const conversationsCollection = db.collection("conversations")

    // Verify user is part of conversation
    const conversation = await conversationsCollection.findOne({
      _id: new (await import("mongodb")).ObjectId(conversationId),
      participants: session.user.id,
    })

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    // Clean up expired entries
    cleanupExpiredTyping()

    const key = `${conversationId}:${session.user.id}`
    
    if (isTyping) {
      // Set typing status with 5 second expiry
      typingUsers.set(key, {
        userId: session.user.id,
        expiresAt: Date.now() + 5000,
      })
    } else {
      typingUsers.delete(key)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[POST /api/messages/[conversationId]/typing] Error:", error)
    return NextResponse.json(
      { error: "Failed to update typing status" },
      { status: 500 }
    )
  }
}

// GET /api/messages/[conversationId]/typing - Get who is typing
export async function GET(
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

    // Clean up expired entries
    cleanupExpiredTyping()

    // Find who is typing in this conversation (excluding current user)
    const typingUsersList: string[] = []
    const now = Date.now()
    
    typingUsers.forEach((value, key) => {
      if (
        key.startsWith(`${conversationId}:`) && 
        value.userId !== session.user.id &&
        value.expiresAt > now
      ) {
        typingUsersList.push(value.userId)
      }
    })

    return NextResponse.json({
      typing: typingUsersList,
      hasTyping: typingUsersList.length > 0,
    })
  } catch (error) {
    console.error("[GET /api/messages/[conversationId]/typing] Error:", error)
    return NextResponse.json(
      { error: "Failed to get typing status" },
      { status: 500 }
    )
  }
}
