"use client"

import { useEffect, useCallback } from "react"
import { useSubscriptionStore, useUserStore, useNotificationStore, useMessageStore, usePlatformSettingsStore } from "@/lib/store"

interface StoreProviderProps {
  children: React.ReactNode
  initialData?: {
    user?: {
      id: string
      name: string
      email: string
      role: "volunteer" | "ngo" | "admin" | null
      image?: string
      isOnboarded: boolean
    }
    ngoSubscription?: {
      plan: "free" | "pro"
      unlocksUsed: number
      expiryDate?: string
    }
    volunteerSubscription?: {
      plan: "free" | "pro"
      applicationsUsed: number
      expiryDate?: string
    }
    unlockedProfiles?: string[]
  }
}

export function StoreProvider({ children, initialData }: StoreProviderProps) {
  const setUser = useUserStore((state) => state.setUser)
  const setUnlockedProfiles = useUserStore((state) => state.setUnlockedProfiles)
  const setNGOSubscription = useSubscriptionStore((state) => state.setNGOSubscription)
  const setVolunteerSubscription = useSubscriptionStore((state) => state.setVolunteerSubscription)
  const setPermission = useNotificationStore((state) => state.setPermission)
  const { setSettings, setLoaded, isLoaded } = usePlatformSettingsStore()

  // Initialize store with server data
  useEffect(() => {
    if (initialData?.user) {
      setUser(initialData.user)
    }
    if (initialData?.ngoSubscription) {
      setNGOSubscription(initialData.ngoSubscription)
    }
    if (initialData?.volunteerSubscription) {
      setVolunteerSubscription(initialData.volunteerSubscription)
    }
    if (initialData?.unlockedProfiles) {
      setUnlockedProfiles(initialData.unlockedProfiles)
    }
  }, [initialData, setUser, setNGOSubscription, setVolunteerSubscription, setUnlockedProfiles])

  // Load platform settings from API (with TTL-based refresh)
  useEffect(() => {
    const fetchSettings = () => {
      const shouldFetch = !usePlatformSettingsStore.getState().isLoaded || usePlatformSettingsStore.getState().needsRefresh()
      if (shouldFetch) {
        fetch("/api/settings")
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data) {
              setSettings(data.data)
            } else {
              setLoaded(true)
            }
          })
          .catch(() => {
            setLoaded(true)
          })
      }
    }

    // Fetch on mount / when invalidated
    fetchSettings()

    // Also set up a periodic TTL check (every 60s) so stale data gets refreshed
    const interval = setInterval(fetchSettings, 60_000)
    return () => clearInterval(interval)
  }, [isLoaded, setSettings, setLoaded])

  // Check notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission === 'granted')
    }
  }, [setPermission])

  return <>{children}</>
}

// Hook to request notification permission
export function useNotificationPermission() {
  const setPermission = useNotificationStore((state) => state.setPermission)

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      setPermission(true)
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      const granted = permission === 'granted'
      setPermission(granted)
      return granted
    }

    return false
  }, [setPermission])

  return { requestPermission }
}

// Hook to send browser notification
export function useBrowserNotification() {
  const hasPermission = useNotificationStore((state) => state.hasPermission)

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!hasPermission || typeof window === 'undefined' || !('Notification' in window)) {
      return null
    }

    try {
      const notification = new Notification(title, {
        icon: '/icon.png',
        badge: '/icon.png',
        ...options,
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      return notification
    } catch (e) {
      console.error('Failed to send notification:', e)
      return null
    }
  }, [hasPermission])

  return { sendNotification, hasPermission }
}
