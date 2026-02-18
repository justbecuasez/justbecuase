"use client";

import { useCallback } from "react";
import { useChatContext } from "stream-chat-react";
import {
  useStreamVideoClient,
  useCalls,
} from "@stream-io/video-react-sdk";
import { Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Button component to start video or audio calls from within a chat channel.
 * Placed in the channel header.
 */
export function VideoCallButton() {
  const { channel } = useChatContext();
  const videoClient = useStreamVideoClient();
  const calls = useCalls();

  const startCall = useCallback(
    async (videoEnabled: boolean) => {
      if (!videoClient || !channel) return;

      // Get the other member(s) in the channel
      const members = Object.values(channel.state.members);
      const memberIds = members.map((m) => m.user_id).filter(Boolean) as string[];

      if (memberIds.length === 0) return;

      // Create a unique call ID based on channel + timestamp
      const callId = `${channel.id}_${Date.now()}`;

      try {
        const call = videoClient.call("default", callId);
        await call.getOrCreate({
          ring: true,
          data: {
            members: memberIds.map((id) => ({ user_id: id })),
            custom: {
              channelCid: channel.cid,
            },
            settings_override: {
              audio: { mic_default_on: true, default_device: "speaker" as const },
              video: { camera_default_on: videoEnabled },
            },
          },
        });
      } catch (err) {
        console.error("Failed to start call:", err);
      }
    },
    [videoClient, channel]
  );

  if (!videoClient || !channel) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => startCall(false)}
            >
              <Phone className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Voice Call</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => startCall(true)}
            >
              <Video className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Video Call</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
