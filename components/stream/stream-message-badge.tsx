"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, localePath } from "@/hooks/use-locale";
import { useDictionary } from "@/components/dictionary-provider";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth-context";
import { useStream } from "./stream-provider";

/**
 * Real-time unread message badge for the navbar/header.
 * Uses Stream's WebSocket-based event system — no polling.
 */
export function StreamMessageBadge() {
  const { chatClient } = useStream();
  const { user } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const dict = useDictionary();
  const t = (dict as any).common || {};
  const d = (dict as any).dashboard || {};
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!chatClient) return;

    // Get initial unread count
    const initialCount = (chatClient.user as any)?.total_unread_count;
    if (typeof initialCount === "number") {
      setUnreadCount(initialCount);
    }

    // Listen for real-time unread count changes
    const handleEvent = (event: any) => {
      if (typeof event.total_unread_count === "number") {
        setUnreadCount(event.total_unread_count);
      }
    };

    chatClient.on("notification.message_new", handleEvent);
    chatClient.on("notification.mark_read", handleEvent);

    return () => {
      chatClient.off("notification.message_new", handleEvent);
      chatClient.off("notification.mark_read", handleEvent);
    };
  }, [chatClient]);

  const handleClick = () => {
    if (!user) return;
    const basePath = user.role === "ngo" ? "/ngo/messages" : "/volunteer/messages";
    router.push(localePath(basePath, locale));
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9"
            onClick={handleClick}
          >
            <MessageSquare className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {unreadCount > 0 ? (t.unreadMessages || "{count} unread message(s)").replace("{count}", String(unreadCount)) : (d.messages || "Messages")}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
