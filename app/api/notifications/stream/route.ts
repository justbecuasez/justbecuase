import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getDb } from "@/lib/database"

export const dynamic = "force-dynamic"

// ==========================================
// SSE (Server-Sent Events) for Real-Time Notifications
// ==========================================
// Clients connect via EventSource to receive live notification updates.
// Uses MongoDB change streams when available, falls back to polling.

export async function GET(req: NextRequest) {
  // Auth check
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const userId = session.user.id
  const encoder = new TextEncoder()
  let closed = false

  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send SSE event
      function send(event: string, data: unknown) {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {
          closed = true
        }
      }

      // Send initial connection event
      send("connected", { userId, timestamp: new Date().toISOString() })

      // Send unread count immediately
      try {
        const db = await getDb()
        const unreadCount = await db.collection("notifications").countDocuments({
          userId,
          read: false,
        })
        send("unread_count", { count: unreadCount })
      } catch (err) {
        console.error("[SSE] Failed to get initial unread count:", err)
      }

      // Poll for new notifications every 10 seconds
      // (MongoDB change streams require replica set which may not be available)
      const pollInterval = setInterval(async () => {
        if (closed) {
          clearInterval(pollInterval)
          return
        }

        try {
          const db = await getDb()
          
          // Get recent unread notifications (last 5 minutes)
          const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
          const recentNotifications = await db
            .collection("notifications")
            .find({
              userId,
              read: false,
              createdAt: { $gte: fiveMinAgo },
            })
            .sort({ createdAt: -1 })
            .limit(5)
            .toArray()

          if (recentNotifications.length > 0) {
            send("notifications", {
              notifications: recentNotifications.map(n => ({
                id: n._id.toString(),
                type: n.type,
                title: n.title,
                message: n.message,
                link: n.link,
                createdAt: n.createdAt,
              })),
            })
          }

          // Send updated unread count
          const unreadCount = await db.collection("notifications").countDocuments({
            userId,
            read: false,
          })
          send("unread_count", { count: unreadCount })
        } catch (err) {
          console.error("[SSE] Poll error:", err)
        }
      }, 10000)

      // Heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        if (closed) {
          clearInterval(heartbeat)
          return
        }
        send("heartbeat", { timestamp: new Date().toISOString() })
      }, 30000)

      // Cleanup on abort
      req.signal.addEventListener("abort", () => {
        closed = true
        clearInterval(pollInterval)
        clearInterval(heartbeat)
        try { controller.close() } catch { /* ignore */ }
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering
    },
  })
}
