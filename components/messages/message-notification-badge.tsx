"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MessageSquare, Bell, BellRing, Check, User, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface UnreadConversation {
  conversationId: string
  unreadCount: number
  lastMessage: string
  lastMessageAt: string
  senderName: string
}

interface MessageNotificationBadgeProps {
  userType: "volunteer" | "ngo"
  initialUnread?: number
}

export function MessageNotificationBadge({ 
  userType, 
  initialUnread = 0 
}: MessageNotificationBadgeProps) {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(initialUnread)
  const [conversations, setConversations] = useState<UnreadConversation[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)

  // Poll for unread messages
  const fetchUnread = useCallback(async () => {
    try {
      const response = await fetch("/api/messages/unread")
      if (response.ok) {
        const data = await response.json()
        
        // Check if there are new messages
        if (data.totalUnread > unreadCount && unreadCount > 0) {
          setHasNewMessage(true)
          // Reset animation after 2 seconds
          setTimeout(() => setHasNewMessage(false), 2000)
        }
        
        setUnreadCount(data.totalUnread)
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error("Failed to fetch unread messages:", error)
    }
  }, [unreadCount])

  useEffect(() => {
    // Initial fetch
    fetchUnread()

    // Poll every 30 seconds
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [fetchUnread])

  const handleConversationClick = (conversationId: string) => {
    const baseUrl = userType === "ngo" ? "/ngo/messages" : "/volunteer/messages"
    router.push(`${baseUrl}/${conversationId}`)
    setIsOpen(false)
  }

  const handleViewAll = () => {
    const baseUrl = userType === "ngo" ? "/ngo/messages" : "/volunteer/messages"
    router.push(baseUrl)
    setIsOpen(false)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "relative",
            hasNewMessage && "animate-pulse"
          )}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <MessageSquare className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              className={cn(
                "absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center text-xs p-0",
                "bg-red-500 text-white border-2 border-background",
                hasNewMessage && "animate-bounce"
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Messages</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} unread
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {conversations.length === 0 ? (
          <div className="py-8 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No new messages</p>
          </div>
        ) : (
          <>
            {conversations.slice(0, 5).map((conv) => (
              <DropdownMenuItem
                key={conv.conversationId}
                onClick={() => handleConversationClick(conv.conversationId)}
                className="p-3 cursor-pointer focus:bg-primary/5"
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {userType === "ngo" ? (
                      <User className="h-5 w-5 text-primary" />
                    ) : (
                      <Building2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm truncate">
                        {conv.senderName}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.lastMessage}
                    </p>
                  </div>
                  {conv.unreadCount > 1 && (
                    <Badge className="bg-primary/20 text-primary text-xs h-5 min-w-[20px]">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            
            {conversations.length > 5 && (
              <div className="text-center py-2 text-xs text-muted-foreground">
                +{conversations.length - 5} more conversations
              </div>
            )}
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleViewAll}
          className="justify-center text-primary cursor-pointer"
        >
          View all messages
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
