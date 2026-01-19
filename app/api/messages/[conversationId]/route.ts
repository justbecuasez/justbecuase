import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/database"
import { ObjectId } from "mongodb"

// GET /api/messages/[conversationId] - Get messages for a conversation with real-time polling support
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
    const searchParams = request.nextUrl.searchParams
    const after = searchParams.get("after") // Get messages after this timestamp
    const limit = parseInt(searchParams.get("limit") || "50")

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

    // Build query - if "after" provided, get only newer messages for polling
    const query: any = { conversationId }
    if (after) {
      query.createdAt = { $gt: new Date(after) }
    }

    const messages = await messagesCollection
      .find(query)
      .sort({ createdAt: 1 })
      .limit(limit)
      .toArray()

    // Mark messages as read for current user
    await messagesCollection.updateMany(
      { 
        conversationId, 
        receiverId: session.user.id, 
        isRead: false 
      },
      { 
        $set: { isRead: true, readAt: new Date() } 
      }
    )

    // Format messages for client
    const formattedMessages = messages.map((msg) => ({
      _id: msg._id.toString(),
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      content: msg.content,
      isRead: msg.isRead,
      readAt: msg.readAt,
      createdAt: msg.createdAt,
      attachments: msg.attachments || [],
      status: msg.status || "sent",
    }))

    return NextResponse.json({
      messages: formattedMessages,
      conversationId,
      lastMessageAt: messages.length > 0 
        ? messages[messages.length - 1].createdAt.toISOString()
        : null,
    })
  } catch (error) {
    console.error("[GET /api/messages/[conversationId]] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}

// POST /api/messages/[conversationId] - Send a message to a conversation
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
    const { content, attachments } = body

    if (!content?.trim() && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: "Message content or attachments required" },
        { status: 400 }
      )
    }

    const db = await getDb()
    const conversationsCollection = db.collection("conversations")
    const messagesCollection = db.collection("messages")
    const notificationsCollection = db.collection("notifications")

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

    // Find receiver (other participant)
    const receiverId = conversation.participants.find(
      (p: string) => p !== session.user.id
    )

    if (!receiverId) {
      return NextResponse.json(
        { error: "Receiver not found" },
        { status: 400 }
      )
    }

    // Create message
    const messageData = {
      conversationId,
      senderId: session.user.id,
      receiverId,
      content: content?.trim() || "",
      attachments: attachments || [],
      isRead: false,
      status: "sent",
      createdAt: new Date(),
    }

    const result = await messagesCollection.insertOne(messageData)

    // Update conversation last message
    const truncatedContent = content && content.length > 50 
      ? content.substring(0, 50) + "..." 
      : content || "Sent an attachment"
    
    await conversationsCollection.updateOne(
      { _id: new ObjectId(conversationId) },
      {
        $set: {
          lastMessage: truncatedContent,
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      }
    )

    // Get sender name for notification - use "user" collection
    const userCollection = db.collection("user")
    
    let senderName = "Someone"
    const senderUser = await userCollection.findOne({ id: session.user.id })
    if (senderUser) {
      // For NGOs, prefer orgName/organizationName
      if (senderUser.role === "ngo") {
        senderName = senderUser.orgName || senderUser.organizationName || senderUser.name || senderName
      } else {
        senderName = senderUser.name || senderName
      }
    }

    // Determine link based on receiver type
    const receiverUser = await userCollection.findOne({ id: receiverId })
    const receiverType = receiverUser?.role || "volunteer"
    const messageLink = receiverType === "ngo"
      ? `/ngo/messages/${conversationId}`
      : `/volunteer/messages/${conversationId}`

    // Create notification for receiver
    await notificationsCollection.insertOne({
      userId: receiverId,
      type: "new_message",
      title: "New Message",
      message: `${senderName} sent you a message`,
      referenceId: conversationId,
      referenceType: "conversation",
      link: messageLink,
      isRead: false,
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: {
        _id: result.insertedId.toString(),
        ...messageData,
      },
    })
  } catch (error) {
    console.error("[POST /api/messages/[conversationId]] Error:", error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}
