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

    // Get sender names for notifications
    const senderIds = [...new Set(unreadByConversation.map(u => u.senderId))]
    const usersCollection = db.collection("users")
    const volunteerProfilesCollection = db.collection("volunteerProfiles")
    const ngoProfilesCollection = db.collection("ngoProfiles")

    const senderNames = new Map<string, string>()
    
    for (const senderId of senderIds) {
      let name = "Someone"
      
      // Check users collection first
      const user = await usersCollection.findOne({ id: senderId })
      if (user) {
        name = user.name || name
      } else {
        // Check volunteer profiles
        const volunteer = await volunteerProfilesCollection.findOne({ userId: senderId })
        if (volunteer) {
          name = volunteer.name || name
        } else {
          // Check NGO profiles
          const ngo = await ngoProfilesCollection.findOne({ userId: senderId })
          if (ngo) {
            name = ngo.orgName || ngo.organizationName || name
          }
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
