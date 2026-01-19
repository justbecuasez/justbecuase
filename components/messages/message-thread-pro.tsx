"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Send,
  ArrowLeft,
  Building2,
  User,
  Check,
  CheckCheck,
  Loader2,
  Briefcase,
  Paperclip,
  Image as ImageIcon,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Info,
  Circle,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Message {
  _id?: string | { toString: () => string }
  senderId: string
  receiverId?: string
  content: string
  isRead: boolean
  readAt?: Date
  createdAt: Date
  attachments?: { type: string; url: string; name?: string }[]
  status?: "sending" | "sent" | "delivered" | "read" | "failed"
}

interface MessageThreadProps {
  conversationId: string
  currentUserId: string
  otherParticipant: {
    id: string
    name: string
    avatar?: string
    type: "volunteer" | "ngo"
  }
  messages: Message[]
  projectTitle?: string
  projectId?: string
  backUrl: string
}

// Typing indicator dots animation
function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex items-center gap-1 bg-muted rounded-full px-3 py-2">
        <span className="text-xs text-muted-foreground mr-1">{name}</span>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

// Message bubble with enhanced styling
function MessageBubble({ 
  message, 
  isOwn, 
  showAvatar,
  otherParticipant 
}: { 
  message: Message
  isOwn: boolean
  showAvatar: boolean
  otherParticipant: { name: string; avatar?: string; type: "volunteer" | "ngo" }
}) {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusIcon = () => {
    if (!isOwn) return null
    
    const status = message.status || (message.isRead ? "read" : "sent")
    
    switch (status) {
      case "sending":
        return <Loader2 className="h-3 w-3 animate-spin" />
      case "sent":
        return <Check className="h-3 w-3" />
      case "delivered":
        return <CheckCheck className="h-3 w-3" />
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-400" />
      case "failed":
        return <span className="text-red-400 text-xs">!</span>
      default:
        return message.isRead ? <CheckCheck className="h-3 w-3 text-blue-400" /> : <Check className="h-3 w-3" />
    }
  }

  return (
    <div className={cn("flex gap-2 group", isOwn ? "justify-end" : "justify-start")}>
      {/* Avatar for received messages */}
      {!isOwn && showAvatar && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {otherParticipant.avatar ? (
            <img
              src={otherParticipant.avatar}
              alt={otherParticipant.name}
              className="w-full h-full object-cover"
            />
          ) : otherParticipant.type === "ngo" ? (
            <Building2 className="h-4 w-4 text-primary" />
          ) : (
            <User className="h-4 w-4 text-primary" />
          )}
        </div>
      )}
      {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}
      
      <div className={cn("max-w-[70%] flex flex-col", isOwn && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 transition-shadow",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted rounded-bl-md",
            "hover:shadow-md"
          )}
        >
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-2 space-y-2">
              {message.attachments.map((attachment, idx) => (
                <div key={idx}>
                  {attachment.type.startsWith("image/") ? (
                    <img
                      src={attachment.url}
                      alt={attachment.name || "Image"}
                      className="max-w-full rounded-lg max-h-48 object-cover"
                    />
                  ) : (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg",
                        isOwn ? "bg-primary-foreground/10" : "bg-background"
                      )}
                    >
                      <Paperclip className="h-4 w-4" />
                      <span className="text-sm truncate">{attachment.name || "File"}</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Message content */}
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </p>
          )}
        </div>
        
        {/* Timestamp and status */}
        <div className={cn(
          "flex items-center gap-1.5 mt-1 px-1",
          isOwn ? "text-muted-foreground" : "text-muted-foreground"
        )}>
          <span className="text-[10px] opacity-70">
            {formatTime(message.createdAt)}
          </span>
          {isOwn && (
            <span className="opacity-70">{getStatusIcon()}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export function MessageThreadPro({
  conversationId,
  currentUserId,
  otherParticipant,
  messages: initialMessages,
  projectTitle,
  projectId,
  backUrl,
}: MessageThreadProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [otherIsTyping, setOtherIsTyping] = useState(false)
  const [isOnline] = useState(true) // Placeholder for online status
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageTimeRef = useRef<string | null>(null)

  // Scroll to bottom with smooth animation
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior })
    }, 100)
  }, [])

  // Initial scroll to bottom
  useEffect(() => {
    scrollToBottom("instant")
    // Set the last message time for polling
    if (initialMessages.length > 0) {
      const lastMsg = initialMessages[initialMessages.length - 1]
      lastMessageTimeRef.current = new Date(lastMsg.createdAt).toISOString()
    }
  }, [])

  // Scroll when new messages arrive
  useEffect(() => {
    if (messages.length > initialMessages.length) {
      scrollToBottom()
    }
  }, [messages.length])

  // Poll for new messages every 3 seconds
  useEffect(() => {
    const pollMessages = async () => {
      try {
        const afterParam = lastMessageTimeRef.current 
          ? `?after=${encodeURIComponent(lastMessageTimeRef.current)}`
          : ""
        
        const response = await fetch(`/api/messages/${conversationId}${afterParam}`)
        if (response.ok) {
          const data = await response.json()
          if (data.messages && data.messages.length > 0) {
            setMessages(prev => {
              // Merge new messages, avoiding duplicates
              const existingIds = new Set(prev.map(m => 
                typeof m._id === "string" ? m._id : m._id?.toString()
              ))
              const newMsgs = data.messages.filter((m: any) => !existingIds.has(m._id))
              return [...prev, ...newMsgs]
            })
            lastMessageTimeRef.current = data.lastMessageAt
          }
        }
      } catch (error) {
        console.error("Failed to poll messages:", error)
      }
    }

    const interval = setInterval(pollMessages, 3000)
    return () => clearInterval(interval)
  }, [conversationId])

  // Poll for typing status every 2 seconds
  useEffect(() => {
    const pollTyping = async () => {
      try {
        const response = await fetch(`/api/messages/${conversationId}/typing`)
        if (response.ok) {
          const data = await response.json()
          setOtherIsTyping(data.hasTyping)
        }
      } catch (error) {
        // Silently fail for typing status
      }
    }

    const interval = setInterval(pollTyping, 2000)
    return () => clearInterval(interval)
  }, [conversationId])

  // Send typing status when user types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    
    // Send typing indicator
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true)
      fetch(`/api/messages/${conversationId}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTyping: true }),
      }).catch(() => {})
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      fetch(`/api/messages/${conversationId}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTyping: false }),
      }).catch(() => {})
    }, 2000)
  }

  // Send message using API
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    const messageContent = newMessage.trim()
    setNewMessage("")
    setSending(true)
    
    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    setIsTyping(false)
    fetch(`/api/messages/${conversationId}/typing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTyping: false }),
    }).catch(() => {})

    // Optimistic update - add message immediately
    const tempId = `temp-${Date.now()}`
    const optimisticMessage: Message = {
      _id: tempId,
      senderId: currentUserId,
      receiverId: otherParticipant.id,
      content: messageContent,
      isRead: false,
      createdAt: new Date(),
      status: "sending",
    }
    
    setMessages(prev => [...prev, optimisticMessage])
    scrollToBottom()

    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent }),
      })

      if (response.ok) {
        const data = await response.json()
        // Replace temp message with real one
        setMessages(prev => prev.map(m => 
          (typeof m._id === "string" ? m._id : m._id?.toString()) === tempId
            ? { ...data.message, status: "sent" }
            : m
        ))
        lastMessageTimeRef.current = data.message.createdAt
      } else {
        // Mark as failed
        setMessages(prev => prev.map(m =>
          (typeof m._id === "string" ? m._id : m._id?.toString()) === tempId
            ? { ...m, status: "failed" }
            : m
        ))
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      // Mark as failed
      setMessages(prev => prev.map(m =>
        (typeof m._id === "string" ? m._id : m._id?.toString()) === tempId
          ? { ...m, status: "failed" }
          : m
      ))
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const formatDate = (date: Date) => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) {
      return "Today"
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return d.toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    }
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = []
  let currentDate = ""

  messages.forEach((message) => {
    const messageDate = formatDate(message.createdAt)
    if (messageDate !== currentDate) {
      currentDate = messageDate
      groupedMessages.push({ date: messageDate, messages: [message] })
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(message)
    }
  })

  return (
    <Card className="h-[700px] flex flex-col shadow-xl border-0 bg-gradient-to-b from-background to-muted/20">
      {/* Enhanced Header */}
      <CardHeader className="flex-shrink-0 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="hover:bg-muted" asChild>
            <Link href={backUrl}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          
          {/* Avatar with online indicator */}
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ring-2 ring-background">
              {otherParticipant.avatar ? (
                <img
                  src={otherParticipant.avatar}
                  alt={otherParticipant.name}
                  className="w-full h-full object-cover"
                />
              ) : otherParticipant.type === "ngo" ? (
                <Building2 className="h-5 w-5 text-primary" />
              ) : (
                <User className="h-5 w-5 text-primary" />
              )}
            </div>
            {/* Online indicator */}
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background",
              isOnline ? "bg-green-500" : "bg-gray-400"
            )} />
          </div>
          
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate">
              {otherParticipant.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {otherIsTyping ? (
                <span className="text-primary animate-pulse">typing...</span>
              ) : isOnline ? (
                <span className="text-green-600">Online</span>
              ) : (
                <span>Offline</span>
              )}
              {projectTitle && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <div className="flex items-center gap-1 truncate">
                    <Briefcase className="h-3 w-3" />
                    <span className="truncate">{projectTitle}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-muted" disabled>
                    <Phone className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Voice call (coming soon)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-muted" disabled>
                    <Video className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Video call (coming soon)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-muted">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Conversation info</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {groupedMessages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center max-w-xs">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-medium text-foreground mb-2">Start the conversation</h3>
              <p className="text-sm text-muted-foreground">
                Send a message to {otherParticipant.name} to get started
              </p>
            </div>
          </div>
        ) : (
          <>
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-3">
                {/* Date separator */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-border" />
                  <Badge variant="secondary" className="text-xs font-normal">
                    {group.date}
                  </Badge>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Messages for this date */}
                {group.messages.map((message, msgIndex) => {
                  const isOwn = message.senderId === currentUserId
                  const prevMessage = msgIndex > 0 ? group.messages[msgIndex - 1] : null
                  const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId

                  return (
                    <MessageBubble
                      key={typeof message._id === "string" ? message._id : message._id?.toString() || msgIndex}
                      message={message}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                      otherParticipant={otherParticipant}
                    />
                  )
                })}
              </div>
            ))}
            
            {/* Typing indicator */}
            {otherIsTyping && (
              <TypingIndicator name={otherParticipant.name} />
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      {/* Enhanced Input Area */}
      <div className="flex-shrink-0 border-t p-4 bg-background/80 backdrop-blur-sm">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* Attachment button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="hover:bg-muted flex-shrink-0"
                  disabled
                >
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach file (coming soon)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Message input */}
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              placeholder="Type a message..."
              value={newMessage}
              onChange={handleInputChange}
              disabled={sending}
              className="pr-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
            />
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent"
              disabled
            >
              <Smile className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
          
          {/* Send button */}
          <Button 
            type="submit" 
            size="icon"
            disabled={!newMessage.trim() || sending}
            className="flex-shrink-0 bg-primary hover:bg-primary/90 transition-all duration-200"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        {/* Encryption notice */}
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          Messages are private and secure between you and {otherParticipant.name}
        </p>
      </div>
    </Card>
  )
}
