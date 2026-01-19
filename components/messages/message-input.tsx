"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Paperclip,
  Image as ImageIcon,
  X,
  Send,
  Loader2,
  File,
  FileText,
  Film,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { uploadToCloudinary } from "@/lib/upload"
import { toast } from "sonner"

interface Attachment {
  type: string
  url: string
  name: string
  size?: number
  uploading?: boolean
  progress?: number
}

interface MessageInputProps {
  onSend: (content: string, attachments?: Attachment[]) => Promise<void>
  disabled?: boolean
  placeholder?: string
  className?: string
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon
  if (type.startsWith("video/")) return Film
  if (type.includes("pdf") || type.includes("document")) return FileText
  return File
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MessageInput({
  onSend,
  disabled,
  placeholder = "Type a message...",
  className,
}: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [sending, setSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large`, {
          description: "Maximum file size is 10MB",
        })
        continue
      }

      // Add file with uploading state
      const tempAttachment: Attachment = {
        type: file.type,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        uploading: true,
        progress: 0,
      }

      setAttachments((prev) => [...prev, tempAttachment])

      // Upload file
      try {
        const result = await uploadToCloudinary(file, "messages", {
          onProgress: (percent) => {
            setAttachments((prev) =>
              prev.map((a) =>
                a.name === file.name && a.uploading
                  ? { ...a, progress: percent }
                  : a
              )
            )
          },
        })

        if (result.success && result.url) {
          setAttachments((prev) =>
            prev.map((a) =>
              a.name === file.name && a.uploading
                ? { ...a, url: result.url!, uploading: false, progress: 100 }
                : a
            )
          )
        } else {
          // Remove failed upload
          setAttachments((prev) =>
            prev.filter((a) => !(a.name === file.name && a.uploading))
          )
          toast.error(`Failed to upload ${file.name}`, {
            description: result.error || "Please try again",
          })
        }
      } catch (error) {
        // Remove failed upload
        setAttachments((prev) =>
          prev.filter((a) => !(a.name === file.name && a.uploading))
        )
        toast.error(`Failed to upload ${file.name}`)
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSend = async () => {
    if ((!message.trim() && attachments.length === 0) || sending) return

    // Check if any attachments are still uploading
    if (attachments.some((a) => a.uploading)) {
      toast.error("Please wait for uploads to complete")
      return
    }

    setSending(true)
    try {
      // Clean attachments for sending (remove temp data)
      const cleanAttachments = attachments.map(({ type, url, name }) => ({
        type,
        url,
        name,
      }))

      await onSend(message.trim(), cleanAttachments.length > 0 ? cleanAttachments : undefined)
      setMessage("")
      setAttachments([])
    } catch (error) {
      console.error("Failed to send message:", error)
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg">
          {attachments.map((attachment, index) => {
            const FileIcon = getFileIcon(attachment.type)
            const isImage = attachment.type.startsWith("image/")

            return (
              <div
                key={`${attachment.name}-${index}`}
                className="relative group"
              >
                {isImage ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border bg-background">
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="w-full h-full object-cover"
                    />
                    {attachment.uploading && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
                          <span className="text-xs">{attachment.progress}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border min-w-[120px]">
                    <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {attachment.name}
                      </p>
                      {attachment.size && (
                        <p className="text-[10px] text-muted-foreground">
                          {formatFileSize(attachment.size)}
                        </p>
                      )}
                      {attachment.uploading && (
                        <Progress
                          value={attachment.progress}
                          className="h-1 mt-1"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Remove button */}
                <button
                  onClick={() => removeAttachment(index)}
                  className={cn(
                    "absolute -top-2 -right-2 w-5 h-5 rounded-full",
                    "bg-destructive text-destructive-foreground",
                    "flex items-center justify-center",
                    "opacity-0 group-hover:opacity-100 transition-opacity",
                    "hover:bg-destructive/90"
                  )}
                  disabled={attachment.uploading}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-center gap-2">
        {/* File Input (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        {/* Attachment Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || sending}
        >
          <Paperclip className="h-5 w-5 text-muted-foreground" />
        </Button>

        {/* Message Input */}
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || sending}
          className="flex-1 bg-muted/50 border-0"
        />

        {/* Send Button */}
        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={
            disabled ||
            sending ||
            (message.trim() === "" && attachments.length === 0) ||
            attachments.some((a) => a.uploading)
          }
          className="flex-shrink-0"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
