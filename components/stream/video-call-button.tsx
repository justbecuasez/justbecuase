"use client";

import { useCallback, useState, useEffect, useRef } from "react";
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
 * Helper: Send a call event system message into the chat channel.
 */
async function sendCallEventToChat(
  channel: any,
  type: "started" | "ended" | "declined" | "missed" | "cancelled",
  isVideo: boolean,
  callerName?: string,
  duration?: number,
) {
  const callType = isVideo ? "Video" : "Voice";
  const durationStr = duration ? formatCallDuration(duration) : null;

  let text = "";
  switch (type) {
    case "started":
      text = `📞 ${callType} call started`;
      break;
    case "ended":
      text = durationStr
        ? `📞 ${callType} call ended · ${durationStr}`
        : `📞 ${callType} call ended`;
      break;
    case "declined":
      text = `📞 ${callType} call declined`;
      break;
    case "missed":
      text = `📞 Missed ${callType.toLowerCase()} call`;
      break;
    case "cancelled":
      text = `📞 ${callType} call cancelled`;
      break;
  }

  try {
    await channel.sendMessage({
      text,
      // Mark as system-like so it can be styled differently
      customType: "call-event",
    });
  } catch (err) {
    console.error("Failed to send call event message:", err);
  }
}

function formatCallDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

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
            custom: {
              channelCid: channel.cid,
              isVideo: videoEnabled,
            },
            settings_override: {
              audio: { mic_default_on: true, default_device: "speaker" as const },
              video: {
                camera_default_on: videoEnabled,
                target_resolution: { width: 1280, height: 720, bitrate: 1500000 },
              },
              ring: {
                auto_cancel_timeout_ms: 60000,   // 60s before auto-cancel
                incoming_call_timeout_ms: 60000,  // 60s for recipient to answer
              },
            },
          },
        });

        // Send call event to chat
        await sendCallEventToChat(channel, "started", videoEnabled);

        // Listen for call rejection/end to post in chat
        const unsubReject = call.on("call.rejected", () => {
          sendCallEventToChat(channel, "declined", videoEnabled);
          toast.info("Call declined", { description: "The other user declined the call." });
          unsubReject();
        });

        const callStartTime = Date.now();
        const unsubEnd = call.on("call.ended", () => {
          const duration = Math.round((Date.now() - callStartTime) / 1000);
          sendCallEventToChat(channel, "ended", videoEnabled, undefined, duration);
          unsubEnd();
        });

        // Auto-cancel timeout: if no one answers in 60s, post missed
        const missedTimer = setTimeout(() => {
          const state = call.state.callingState;
          if (state === "ringing") {
            sendCallEventToChat(channel, "missed", videoEnabled);
          }
        }, 62000); // slightly after the 60s auto_cancel

        // Clean up missed timer when call state changes
        const unsubState = call.on("all", (evt: any) => {
          if (
            evt.type === "call.accepted" ||
            evt.type === "call.rejected" ||
            evt.type === "call.ended"
          ) {
            clearTimeout(missedTimer);
            unsubState();
          }
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
