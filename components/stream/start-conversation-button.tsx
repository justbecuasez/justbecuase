"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, localePath } from "@/hooks/use-locale";
import { useChatContext } from "stream-chat-react";
import { MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useStream } from "./stream-provider";

interface StartConversationButtonProps {
  /** ID of the other user to message */
  otherUserId: string;
  /** Name of the other user */
  otherUserName: string;
  /** Avatar of the other user */
  otherUserAvatar?: string;
  /** The user type of the other user */
  otherUserType: "ngo" | "volunteer";
  /** Optional project context */
  projectId?: string;
  projectTitle?: string;
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "secondary";
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";
  /** Custom label */
  label?: string;
  /** Custom class */
  className?: string;
}

/**
 * Button to start a new conversation or navigate to an existing one.
 * Creates a Stream channel between the current user and the target user.
 */
export function StartConversationButton({
  otherUserId,
  otherUserName,
  otherUserAvatar,
  otherUserType,
  projectId,
  projectTitle,
  variant = "default",
  size = "default",
  label = "Message",
  className,
}: StartConversationButtonProps) {
  const { user } = useAuth();
  const { chatClient } = useStream();
  const router = useRouter();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStartConversation = async () => {
    if (!user || !chatClient) {
      toast.error("Please sign in to send messages");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setLoading(true);
    try {
      // Create or get the Stream channel via our API
      const res = await fetch("/api/stream/channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otherUserId,
          projectId,
          projectTitle,
        }),
      });

      if (!res.ok) throw new Error("Failed to create channel");

      const { channelId, channelType } = await res.json();

      // Get the channel instance and send the first message
      const channel = chatClient.channel(channelType, channelId);
      await channel.watch();
      await channel.sendMessage({ text: message.trim() });

      toast.success("Message sent!");
      setOpen(false);
      setMessage("");

      // Navigate to messages
      const basePath = user.role === "ngo" ? "/ngo/messages" : "/volunteer/messages";
      router.push(localePath(basePath, locale));
    } catch (err) {
      console.error("Error starting conversation:", err);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <MessageSquare className="h-4 w-4 mr-2" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Message {otherUserName}</DialogTitle>
          <DialogDescription>
            {projectTitle
              ? `Send a message about "${projectTitle}"`
              : `Start a conversation with ${otherUserName}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Write your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStartConversation}
              disabled={loading || !message.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
