"use client"

import { useEffect, useState, useRef, useCallback } from "react"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link?: string
  createdAt: string
}

interface UseNotificationStreamReturn {
  unreadCount: number
  notifications: Notification[]
  connected: boolean
  clearNotifications: () => void
}

/**
 * Hook to subscribe to real-time notification updates via SSE.
 * Automatically reconnects on disconnect.
 */
export function useNotificationStream(): UseNotificationStreamReturn {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const connect = useCallback(() => {
    // Cleanup existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const es = new EventSource("/api/notifications/stream")
    eventSourceRef.current = es

    es.addEventListener("connected", () => {
      setConnected(true)
    })

    es.addEventListener("unread_count", (e) => {
      try {
        const data = JSON.parse(e.data)
        setUnreadCount(data.count)
      } catch { /* ignore */ }
    })

    es.addEventListener("notifications", (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.notifications?.length > 0) {
          setNotifications(prev => {
            const ids = new Set(prev.map(n => n.id))
            const newOnes = data.notifications.filter((n: Notification) => !ids.has(n.id))
            return [...newOnes, ...prev].slice(0, 20)
          })
        }
      } catch { /* ignore */ }
    })

    es.addEventListener("heartbeat", () => {
      // Keep-alive acknowledged
    })

    es.onerror = () => {
      setConnected(false)
      es.close()
      // Reconnect with exponential backoff
      reconnectTimeoutRef.current = setTimeout(connect, 5000)
    }
  }, [])

  useEffect(() => {
    connect()
    
    return () => {
      eventSourceRef.current?.close()
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return { unreadCount, notifications, connected, clearNotifications }
}
