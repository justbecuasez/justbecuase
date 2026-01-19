"use client"

import { useEffect, useCallback, useState } from "react"

interface NotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  onClick?: () => void
}

export function useMessageNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if browser supports notifications
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false
    
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result === "granted"
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      return false
    }
  }, [isSupported])

  const showNotification = useCallback(({
    title,
    body,
    icon = "/favicon.ico",
    tag,
    onClick
  }: NotificationOptions) => {
    if (!isSupported || permission !== "granted") {
      return null
    }

    try {
      const notification = new Notification(title, {
        body,
        icon,
        tag,
        badge: "/favicon.ico",
        silent: false,
      })

      if (onClick) {
        notification.onclick = () => {
          window.focus()
          onClick()
          notification.close()
        }
      }

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000)

      return notification
    } catch (error) {
      console.error("Error showing notification:", error)
      return null
    }
  }, [isSupported, permission])

  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio("/sounds/notification.mp3")
      audio.volume = 0.3
      audio.play().catch(() => {
        // Silently fail - user may not have interacted with page yet
      })
    } catch (error) {
      // Ignore audio errors
    }
  }, [])

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    playNotificationSound,
  }
}

// Hook for polling unread count
export function useUnreadMessages(userId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  useEffect(() => {
    if (!userId) return

    const checkUnread = async () => {
      try {
        // This would be an API call in production
        // For now we'll skip it and let server components handle it
        setLastCheck(new Date())
      } catch (error) {
        console.error("Error checking unread messages:", error)
      }
    }

    // Check immediately
    checkUnread()

    // Poll every 30 seconds
    const interval = setInterval(checkUnread, 30000)
    return () => clearInterval(interval)
  }, [userId])

  return { unreadCount, lastCheck }
}
