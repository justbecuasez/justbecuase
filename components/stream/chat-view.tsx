"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChannelList,
  Channel,
  Window,
  MessageList,
  MessageInput,
  Thread,
  ChannelHeader,
  useChatContext,
  useChannelStateContext,
} from "stream-chat-react";
import type { ChannelSort, ChannelFilters, ChannelOptions } from "stream-chat";
import { useAuth } from "@/lib/auth-context";
import { useStream } from "./stream-provider";
import { VideoCallButton } from "./video-call-button";
import { Loader2, MessageSquare } from "lucide-react";

interface ChatViewProps {
  userType: "ngo" | "volunteer";
  /** Pre-select a specific channel by ID */
  activeChannelId?: string;
}

export function ChatView({ userType, activeChannelId }: ChatViewProps) {
  const { user } = useAuth();
  const { chatClient, isReady } = useStream();
  const [isChannelListVisible, setIsChannelListVisible] = useState(true);

  if (!isReady || !chatClient || !user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading messages...</p>
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
    limit: 20,
    presence: true,
    state: true,
    watch: true,
  };

  return (
    <div className="stream-chat-container h-[calc(100vh-12rem)] rounded-xl border border-border overflow-hidden bg-card">
      <div className="flex h-full">
        {/* Channel List - left panel */}
        <div
          className={`
            ${isChannelListVisible ? "block" : "hidden"}
            lg:block w-full lg:w-80 xl:w-96 border-r border-border flex-shrink-0
          `}
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
          />
        </div>

        {/* Active Channel - right panel */}
        <div className="flex-1 min-w-0">
          <Channel>
            <Window>
              <CustomChannelHeader
                userType={userType}
                onMobileBack={() => setIsChannelListVisible(true)}
              />
              <MessageList />
              <MessageInput focus audioRecordingEnabled />
            </Window>
            <Thread />
          </Channel>
        </div>
      </div>
    </div>
  );
}

/**
 * Custom channel header with video/audio call buttons
 */
function CustomChannelHeader({
  userType,
  onMobileBack,
}: {
  userType: "ngo" | "volunteer";
  onMobileBack: () => void;
}) {
  return (
    <div className="stream-custom-header">
      <ChannelHeader />
      <div className="stream-header-actions">
        <VideoCallButton />
      </div>
    </div>
  );
}

/**
 * Empty state when no channel is selected
 */
export function ChatEmptyState() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <MessageSquare className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg text-foreground mb-2">
          Select a conversation
        </h3>
        <p className="text-sm text-muted-foreground">
          Choose a conversation from the list to view messages and start chatting
        </p>
      </div>
    </div>
  );
}
