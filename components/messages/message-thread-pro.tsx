"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

import { toast } from "sonner"
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
  X,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { uploadDocumentToCloudinary, validateDocumentFile, SUPPORTED_ALL_TYPES } from "@/lib/upload"

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageTimeRef = useRef<string | null>(null)
  const sendingRef = useRef(false) // Track send-in-progress to pause polling
  const recentlySentIdsRef = useRef<Set<string>>(new Set()) // Track real IDs of recently sent messages
  
  // Attachment state
  const [pendingAttachments, setPendingAttachments] = useState<{ file: File; previewUrl?: string; type: string }[]>([])
  const [uploadingAttachment, setUploadingAttachment] = useState(false)

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
      // Skip polling while a message is being sent to avoid race condition
      // between optimistic update (temp ID) and polled message (real ID)
      if (sendingRef.current) return

      try {
        const afterParam = lastMessageTimeRef.current 
          ? `?after=${encodeURIComponent(lastMessageTimeRef.current)}`
          : ""
        
        const response = await fetch(`/api/messages/${conversationId}${afterParam}`)
        if (response.ok) {
          const data = await response.json()
          if (data.messages && data.messages.length > 0) {
            setMessages(prev => {
              // Merge new messages, avoiding duplicates by ID
              const existingIds = new Set(prev.map(m => 
                typeof m._id === "string" ? m._id : m._id?.toString()
              ))
              // Also filter out messages we recently sent (already in state via optimistic update)
              const newMsgs = data.messages.filter((m: any) => 
                !existingIds.has(m._id) && !recentlySentIdsRef.current.has(m._id)
              )
              return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev
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

  // Handle file attachment selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    for (const file of Array.from(files)) {
      const validation = validateDocumentFile(file, 10)
      if (!validation.valid) {
        toast.error("Invalid file", { description: validation.error })
        continue
      }

      // Create preview for images
      let previewUrl: string | undefined
      if (file.type.startsWith("image/")) {
        previewUrl = URL.createObjectURL(file)
      }

      setPendingAttachments(prev => [...prev, {
        file,
        previewUrl,
        type: file.type,
      }])
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Remove pending attachment
  const removePendingAttachment = (index: number) => {
    setPendingAttachments(prev => {
      const attachment = prev[index]
      if (attachment.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl)
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  // Upload attachments and return URLs
  const uploadAttachments = async (): Promise<{ type: string; url: string; name: string }[]> => {
    const uploadedAttachments: { type: string; url: string; name: string }[] = []
    
    for (const attachment of pendingAttachments) {
      const result = await uploadDocumentToCloudinary(attachment.file, "message_attachments")
      
      if (result.success && result.url) {
        uploadedAttachments.push({
          type: attachment.type,
          url: result.url,
          name: attachment.file.name,
        })
      }
    }
    
    return uploadedAttachments
  }

  // Send message using API
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessage.trim() && pendingAttachments.length === 0) || sending) return

    const messageContent = newMessage.trim()
    setNewMessage("")
    setSending(true)
    sendingRef.current = true
    
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

    // Upload attachments first if any
    let uploadedAttachments: { type: string; url: string; name: string }[] = []
    if (pendingAttachments.length > 0) {
      setUploadingAttachment(true)
      try {
        uploadedAttachments = await uploadAttachments()
        // Clear pending attachments after upload
        pendingAttachments.forEach(a => {
          if (a.previewUrl) URL.revokeObjectURL(a.previewUrl)
        })
        setPendingAttachments([])
      } catch (err) {
        toast.error("Failed to upload attachments")
        setSending(false)
        sendingRef.current = false
        setUploadingAttachment(false)
        return
      }
      setUploadingAttachment(false)
    }

    // Optimistic update - add message immediately
    const tempId = `temp-${Date.now()}`
    const optimisticMessage: Message = {
      _id: tempId,
      senderId: currentUserId,
      receiverId: otherParticipant.id,
      content: messageContent,
      attachments: uploadedAttachments,
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
        body: JSON.stringify({ 
          content: messageContent,
          attachments: uploadedAttachments,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const realId = data.message._id?.toString?.() || data.message._id
        // Track the real ID so polling won't re-add it
        recentlySentIdsRef.current.add(realId)
        // Clean up tracked IDs after 10 seconds (polling will have moved past it by then)
        setTimeout(() => recentlySentIdsRef.current.delete(realId), 10000)
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
      sendingRef.current = false
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
            <Button variant="ghost" size="icon" className="hover:bg-muted" disabled title="Voice call (coming soon)">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-muted" disabled title="Video call (coming soon)">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-muted" title="Conversation info">
              <Info className="h-4 w-4" />
            </Button>
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
      <div className="flex-shrink-0 border-t bg-background/80 backdrop-blur-sm">
        {/* Pending attachments preview */}
        {pendingAttachments.length > 0 && (
          <div className="px-4 pt-3 pb-1 flex flex-wrap gap-2 border-b border-border/50">
            {pendingAttachments.map((attachment, index) => (
              <div key={index} className="relative group">
                {attachment.type.startsWith("image/") && attachment.previewUrl ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                    <img
                      src={attachment.previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-xs truncate max-w-[100px]">{attachment.file.name}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removePendingAttachment(index)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {uploadingAttachment && (
              <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Uploading...</span>
              </div>
            )}
          </div>
        )}
        
        <form onSubmit={handleSend} className="p-4 flex items-center gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Attachment button */}
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="hover:bg-muted flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || uploadingAttachment}
            title="Attach file"
          >
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </Button>
          
          {/* Message input */}
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              placeholder="Type a message..."
              value={newMessage}
              onChange={handleInputChange}
              disabled={sending || uploadingAttachment}
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
            disabled={(!newMessage.trim() && pendingAttachments.length === 0) || sending || uploadingAttachment}
            className="flex-shrink-0 bg-primary hover:bg-primary/90 transition-all duration-200"
          >
            {sending || uploadingAttachment ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        {/* Encryption notice */}
        <p className="text-[10px] text-center text-muted-foreground pb-2">
          Messages are private and secure between you and {otherParticipant.name}
        </p>
      </div>
    </Card>
  )
}
