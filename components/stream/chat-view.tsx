"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  ChannelList,
  Channel,
  Window,
  MessageList,
  MessageInput,
  Thread,
  ChannelHeader,
  TypingIndicator,
  useChatContext,
  useChannelStateContext,
  useChannelActionContext,
  useTypingContext,
} from "stream-chat-react";
import type { ChannelSort, ChannelFilters, ChannelOptions, Channel as ChannelType } from "stream-chat";
import { useAuth } from "@/lib/auth-context";
import { useStream } from "./stream-provider";
import { VideoCallButton } from "./video-call-button";
import {
  Loader2,
  MessageSquare,
  ArrowLeft,
  ChevronLeft,
  WifiOff,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ChatViewProps {
  userType: "ngo" | "volunteer";
  activeChannelId?: string;
}

export function ChatView({ userType, activeChannelId }: ChatViewProps) {
  const { user } = useAuth();
  const { chatClient, isReady, initError, retry } = useStream();
  const [showChannelList, setShowChannelList] = useState(true);

  if (initError) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm p-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <WifiOff className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Connection Failed</h3>
          <p className="text-sm text-muted-foreground">
            Unable to connect to messaging. Please check your connection.
          </p>
          <button
            onClick={retry}
            className="px-6 py-2.5 text-sm font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  if (!isReady || !chatClient || !user) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Connecting...</p>
        </div>
      </div>
    );
  }

  const filters: ChannelFilters = {
    type: "messaging",
    members: { $in: [user.id] },
  };

  const sort: ChannelSort = { last_message_at: -1 };

  const options: ChannelOptions = {
    limit: 30,
    presence: true,
    state: true,
    watch: true,
  };

  return (
    <div className="jb-chat-wrapper">
      <div className="jb-chat-layout">
        {/* LEFT: Conversations list */}
        <div
          className={cn(
            "jb-chat-sidebar",
            !showChannelList && "jb-chat-sidebar--hidden"
          )}
        >
          <ChannelList
            filters={filters}
            sort={sort}
            options={options}
            showChannelSearch
            additionalChannelSearchProps={{
              searchForChannels: true,
              searchQueryParams: {
                channelFilters: {
                  filters: { members: { $in: [user.id] } },
                },
              },
            }}
            setActiveChannelOnMount={!!activeChannelId}
            customActiveChannel={activeChannelId}
            Preview={(previewProps) => (
              <CustomChannelPreview
                {...previewProps}
                onSelect={() => setShowChannelList(false)}
              />
            )}
          />
        </div>

        {/* RIGHT: Active conversation */}
        <div
          className={cn(
            "jb-chat-main",
            showChannelList && "jb-chat-main--hidden"
          )}
        >
          <Channel TypingIndicator={CustomTypingIndicator}>
            <Window>
              <CustomChannelHeader
                userType={userType}
                onBack={() => setShowChannelList(true)}
              />
              <MessageList />
              <MessageInput focus />
            </Window>
            <Thread />
          </Channel>
        </div>

        {/* Empty state (desktop only, when no active channel) */}
        {!activeChannelId && showChannelList && (
          <div className="jb-chat-empty">
            <div className="flex flex-col items-center gap-4 text-center max-w-xs">
              <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center">
                <MessageSquare className="h-12 w-12 text-primary/40" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                JustBeCause Messenger
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Select a conversation to start messaging.
                Your messages are private and secure.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Custom Channel Preview (conversation list item)
   Shows online indicator, last message, time
   ═══════════════════════════════════════════ */
function CustomChannelPreview(props: any) {
  const { channel, setActiveChannel, activeChannel, onSelect } = props;
  const { client } = useChatContext();

  const otherMembers = Object.values(channel.state.members).filter(
    (m: any) => m.user_id !== client.userID
  );
  const otherUser = (otherMembers[0] as any)?.user;
  const displayName = otherUser?.name || channel.data?.name || "Unknown";
  const avatar = otherUser?.image;
  const isOnline = otherUser?.online === true;
  const isActive = activeChannel?.cid === channel.cid;

  const lastMsg = channel.state.messages?.[channel.state.messages.length - 1];
  const lastMsgText = lastMsg?.text || "";
  const lastMsgTime = lastMsg?.created_at
    ? formatTime(new Date(lastMsg.created_at))
    : "";
  const unreadCount = channel.countUnread();

  return (
    <button
      className={cn("jb-channel-preview", isActive && "jb-channel-preview--active")}
      onClick={() => {
        setActiveChannel(channel);
        onSelect?.();
      }}
    >
      <div className="jb-channel-preview__avatar">
        <Avatar className="h-[50px] w-[50px]">
          <AvatarImage src={avatar} alt={displayName} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-base">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {isOnline && <span className="jb-online-dot" />}
      </div>

      <div className="jb-channel-preview__content">
        <div className="jb-channel-preview__top">
          <span className="jb-channel-preview__name">{displayName}</span>
          <span
            className={cn(
              "jb-channel-preview__time",
              unreadCount > 0 && "jb-channel-preview__time--unread"
            )}
          >
            {lastMsgTime}
          </span>
        </div>
        <div className="jb-channel-preview__bottom">
          <span className="jb-channel-preview__message">
            {lastMsgText.length > 50
              ? lastMsgText.substring(0, 50) + "…"
              : lastMsgText || "No messages yet"}
          </span>
          {unreadCount > 0 && (
            <span className="jb-unread-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════
   Custom Channel Header
   Online status, typing, call buttons
   ═══════════════════════════════════════════ */
function CustomChannelHeader({
  userType,
  onBack,
}: {
  userType: "ngo" | "volunteer";
  onBack: () => void;
}) {
  const { channel, client } = useChatContext();

  if (!channel) return null;

  const otherMembers = Object.values(channel.state.members).filter(
    (m: any) => m.user_id !== client.userID
  );
  const otherUser = (otherMembers[0] as any)?.user;
  const displayName = otherUser?.name || "Unknown";
  const avatar = otherUser?.image;
  const isOnline = otherUser?.online === true;
  const lastActive = otherUser?.last_active
    ? formatLastActive(new Date(otherUser.last_active))
    : null;

  return (
    <div className="jb-header">
      <button className="jb-header__back" onClick={onBack}>
        <ChevronLeft className="h-6 w-6" />
      </button>

      <div className="jb-header__user">
        <div className="jb-header__avatar-wrap">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatar} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isOnline && <span className="jb-online-dot jb-online-dot--sm" />}
        </div>
        <div className="jb-header__info">
          <h3 className="jb-header__name">{displayName}</h3>
          <HeaderStatus isOnline={isOnline} lastActive={lastActive} channel={channel} />
        </div>
      </div>

      <div className="jb-header__actions">
        <VideoCallButton />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Header Status — typing / online / last seen
   ═══════════════════════════════════════════ */
function HeaderStatus({
  isOnline,
  lastActive,
  channel,
}: {
  isOnline: boolean;
  lastActive: string | null;
  channel: any;
}) {
  const { client } = useChatContext();
  const [typingNames, setTypingNames] = useState<string[]>([]);

  useEffect(() => {
    if (!channel) return;

    const handleStart = (e: any) => {
      if (e.user?.id !== client.userID) {
        const name = e.user.name || e.user.id;
        setTypingNames((prev) => (prev.includes(name) ? prev : [...prev, name]));
      }
    };
    const handleStop = (e: any) => {
      if (e.user?.id !== client.userID) {
        const name = e.user.name || e.user.id;
        setTypingNames((prev) => prev.filter((n) => n !== name));
      }
    };

    channel.on("typing.start", handleStart);
    channel.on("typing.stop", handleStop);
    return () => {
      channel.off("typing.start", handleStart);
      channel.off("typing.stop", handleStop);
    };
  }, [channel, client.userID]);

  if (typingNames.length > 0) {
    return (
      <p className="jb-header__status jb-header__status--typing">
        <span className="jb-typing-dots"><span /><span /><span /></span>
        typing…
      </p>
    );
  }

  if (isOnline) {
    return <p className="jb-header__status jb-header__status--online">online</p>;
  }

  if (lastActive) {
    return <p className="jb-header__status">last seen {lastActive}</p>;
  }

  return <p className="jb-header__status">offline</p>;
}

/* ═══════════════════════════════════════════
   Custom Typing Indicator (above input)
   ═══════════════════════════════════════════ */
function CustomTypingIndicator() {
  const { client } = useChatContext();
  const { typing } = useTypingContext();

  const typingUsers = Object.values(typing || {}).filter(
    (t: any) => t.user?.id !== client.userID
  );

  if (typingUsers.length === 0) return null;

  const names = typingUsers.map((t: any) => t.user?.name || "Someone");

  return (
    <div className="jb-typing-bar">
      <span className="jb-typing-dots"><span /><span /><span /></span>
      <span>{names.join(", ")} {names.length === 1 ? "is" : "are"} typing…</span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════ */
function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatLastActive(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}
