"use client";

import { useCallback, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { Phone, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

/**
 * Button component to start video or audio calls from within a chat channel.
 * Requests mic/camera permissions before starting the call.
 */
export function VideoCallButton() {
  const { channel } = useChatContext();
  const videoClient = useStreamVideoClient();
  const [loading, setLoading] = useState<"audio" | "video" | null>(null);

  const requestPermissions = useCallback(async (video: boolean): Promise<boolean> => {
    try {
      const constraints: MediaStreamConstraints = { audio: true };
      if (video) constraints.video = true;

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // Stop all tracks immediately — we just needed the permission
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("Permission denied", {
          description: `Please allow ${video ? "camera and microphone" : "microphone"} access in your browser settings to make calls.`,
          duration: 6000,
        });
      } else if (err.name === "NotFoundError") {
        toast.error("Device not found", {
          description: `No ${video ? "camera or microphone" : "microphone"} detected. Please connect a device and try again.`,
          duration: 5000,
        });
      } else {
        toast.error("Cannot access media devices", {
          description: err.message || "An unknown error occurred.",
        });
      }
      return false;
    }
  }, []);

  const startCall = useCallback(
    async (videoEnabled: boolean) => {
      if (!videoClient || !channel) return;

      setLoading(videoEnabled ? "video" : "audio");

      // Request permissions first
      const hasPermission = await requestPermissions(videoEnabled);
      if (!hasPermission) {
        setLoading(null);
        return;
      }

      const members = Object.values(channel.state.members);
      const memberIds = members.map((m) => m.user_id).filter(Boolean) as string[];

      if (memberIds.length === 0) {
        setLoading(null);
        return;
      }

      // Stream requires call ID <= 64 chars. Use short random suffix.
      const suffix = Date.now().toString(36);
      const prefix = (channel.id || "call").slice(0, 64 - suffix.length - 1);
      const callId = `${prefix}_${suffix}`;

      try {
        const call = videoClient.call("default", callId);
        await call.getOrCreate({
          ring: true,
          data: {
            members: memberIds.map((id) => ({ user_id: id })),
            custom: { channelCid: channel.cid },
            settings_override: {
              audio: { mic_default_on: true, default_device: "speaker" as const },
              video: {
                camera_default_on: videoEnabled,
                target_resolution: { width: 1280, height: 720, bitrate: 1500000 },
              },
            },
          },
        });

        toast.success(videoEnabled ? "Video call started" : "Voice call started", {
          description: "Ringing other participant…",
        });
      } catch (err) {
        console.error("Failed to start call:", err);
        toast.error("Failed to start call", {
          description: "Please try again.",
        });
      } finally {
        setLoading(null);
      }
    },
    [videoClient, channel, requestPermissions]
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
              className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              onClick={() => startCall(false)}
              disabled={loading !== null}
            >
              {loading === "audio" ? (
                <Loader2 className="h-[18px] w-[18px] animate-spin" />
              ) : (
                <Phone className="h-[18px] w-[18px]" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Voice Call</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              onClick={() => startCall(true)}
              disabled={loading !== null}
            >
              {loading === "video" ? (
                <Loader2 className="h-[18px] w-[18px] animate-spin" />
              ) : (
                <Video className="h-[18px] w-[18px]" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Video Call</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
