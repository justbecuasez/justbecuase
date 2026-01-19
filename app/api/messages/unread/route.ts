import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/database"

// GET /api/messages/unread - Get unread message count and summary
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDb()
    const messagesCollection = db.collection("messages")
    const conversationsCollection = db.collection("conversations")

    // Get total unread count
    const totalUnread = await messagesCollection.countDocuments({
      receiverId: session.user.id,
      isRead: false,
    })

    // Get unread count per conversation
    const unreadByConversation = await messagesCollection.aggregate([
      {
        $match: {
          receiverId: session.user.id,
          isRead: false,
        },
      },
      {
        $group: {
          _id: "$conversationId",
          count: { $sum: 1 },
          lastMessage: { $last: "$content" },
          lastMessageAt: { $max: "$createdAt" },
          senderId: { $last: "$senderId" },
        },
      },
      {
        $sort: { lastMessageAt: -1 },
      },
      {
        $limit: 10,
      },
    ]).toArray()

    // Get sender names for notifications - use "user" collection (not "users")
    const senderIds = [...new Set(unreadByConversation.map(u => u.senderId))]
    const userCollection = db.collection("user")

    const senderNames = new Map<string, string>()
    
    for (const senderId of senderIds) {
      let name = "Someone"
      
      // Check user collection - all user data is now consolidated here
      const user = await userCollection.findOne({ id: senderId })
      if (user) {
        // For NGOs, prefer orgName/organizationName, otherwise use name
        if (user.role === "ngo") {
          name = user.orgName || user.organizationName || user.name || name
        } else {
          name = user.name || name
        }
      }
      
      senderNames.set(senderId, name)
    }

    // Format response
    const conversations = unreadByConversation.map(conv => ({
      conversationId: conv._id,
      unreadCount: conv.count,
      lastMessage: conv.lastMessage?.substring(0, 50) + (conv.lastMessage?.length > 50 ? "..." : ""),
      lastMessageAt: conv.lastMessageAt,
      senderName: senderNames.get(conv.senderId) || "Someone",
    }))

    return NextResponse.json({
      totalUnread,
      conversations,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[GET /api/messages/unread] Error:", error)
    return NextResponse.json(
      { error: "Failed to get unread messages" },
      { status: 500 }
    )
  }
}
