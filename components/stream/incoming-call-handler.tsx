"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CallingState,
  StreamCall,
  useCallStateHooks,
  useCall,
  useCalls,
  useStreamVideoClient,
  StreamTheme,
} from "@stream-io/video-react-sdk";
import type { Call } from "@stream-io/video-react-sdk";
import { Phone, PhoneOff, Video, VideoOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ActiveCallView } from "./active-call-view";
import { useStream } from "./stream-provider";

/**
 * Global incoming call handler.
 * Renders a ringing notification UI for incoming calls,
 * and the active call view when a call is joined.
 * Should be mounted once in the layout.
 */
export function IncomingCallHandler() {
  const { videoClient } = useStream();

  // Only render the inner component when video client is ready
  if (!videoClient) return null;

  return <IncomingCallHandlerInner />;
}

function IncomingCallHandlerInner() {
  const calls = useCalls();
  const [activeCall, setActiveCall] = useState<Call | null>(null);

  // Find ringing calls (incoming)
  const ringingCalls = calls.filter(
    (call) => {
      const state = call.state.callingState;
      return state === CallingState.RINGING && !call.isCreatedByMe;
    }
  );

  // Find outgoing ringing calls
  const outgoingCalls = calls.filter(
    (call) => {
      const state = call.state.callingState;
      return state === CallingState.RINGING && call.isCreatedByMe;
    }
  );

  // Find joined calls
  const joinedCalls = calls.filter(
    (call) => call.state.callingState === CallingState.JOINED
  );

  // Auto-set active call when joined
  useEffect(() => {
    if (joinedCalls.length > 0 && !activeCall) {
      setActiveCall(joinedCalls[0]);
    }
  }, [joinedCalls, activeCall]);

  // Show active call UI
  if (activeCall) {
    return (
      <ActiveCallView
        call={activeCall}
        onClose={() => setActiveCall(null)}
      />
    );
  }

  // Show outgoing call UI
  if (outgoingCalls.length > 0) {
    return (
      <OutgoingCallNotification
        call={outgoingCalls[0]}
        onJoined={(call) => setActiveCall(call)}
      />
    );
  }

  // Show incoming call notification
  if (ringingCalls.length > 0) {
    return (
      <IncomingCallNotification
        call={ringingCalls[0]}
        onAccepted={(call) => setActiveCall(call)}
      />
    );
  }

  return null;
}

/**
 * Incoming call notification UI
 */
function IncomingCallNotification({
  call,
  onAccepted,
}: {
  call: Call;
  onAccepted: (call: Call) => void;
}) {
  const callerName = call.state.createdBy?.name || "Unknown";
  const callerImage = call.state.createdBy?.image;

  const handleAccept = useCallback(async () => {
    try {
      await call.join();
      onAccepted(call);
    } catch (err) {
      console.error("Failed to accept call:", err);
    }
  }, [call, onAccepted]);

  const handleReject = useCallback(async () => {
    try {
      await call.leave({ reject: true, reason: "decline" });
    } catch (err) {
      console.error("Failed to reject call:", err);
    }
  }, [call]);

  return (
    <div className="fixed top-4 right-4 z-[200] animate-in slide-in-from-top-5 duration-300">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 min-w-[320px]">
        {/* Pulse ring effect */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
            <Avatar className="h-16 w-16 ring-2 ring-green-500 ring-offset-2 ring-offset-background">
              <AvatarImage src={callerImage} alt={callerName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {callerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="text-center">
            <p className="font-semibold text-foreground">{callerName}</p>
            <p className="text-sm text-muted-foreground animate-pulse">
              Incoming {call.state.settings?.video?.camera_default_on ? "video" : "voice"} call...
            </p>
          </div>

          <div className="flex items-center gap-4 mt-2">
            <Button
              onClick={handleReject}
              className="rounded-full h-14 w-14 bg-red-500 hover:bg-red-600 text-white shadow-lg"
              size="icon"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>

            <Button
              onClick={handleAccept}
              className="rounded-full h-14 w-14 bg-green-500 hover:bg-green-600 text-white shadow-lg"
              size="icon"
            >
              <Phone className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Outgoing call notification (ringing)
 */
function OutgoingCallNotification({
  call,
  onJoined,
}: {
  call: Call;
  onJoined: (call: Call) => void;
}) {
  const members = call.state.members;
  const otherMembers = members.filter((m) => m.user_id !== call.currentUserId);
  const recipientName = otherMembers[0]?.user?.name || "Calling...";
  const recipientImage = otherMembers[0]?.user?.image;

  // Watch for call state change to JOINED
  useEffect(() => {
    const unsubscribe = call.on("call.accepted", () => {
      onJoined(call);
    });
    return () => {
      unsubscribe();
    };
  }, [call, onJoined]);

  const handleCancel = useCallback(async () => {
    try {
      await call.leave({ reject: true, reason: "cancel" });
    } catch (err) {
      console.error("Failed to cancel call:", err);
    }
  }, [call]);

  return (
    <div className="fixed top-4 right-4 z-[200] animate-in slide-in-from-top-5 duration-300">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 min-w-[320px]">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-primary ring-offset-2 ring-offset-background">
            <AvatarImage src={recipientImage} alt={recipientName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {recipientName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="text-center">
            <p className="font-semibold text-foreground">{recipientName}</p>
            <p className="text-sm text-muted-foreground animate-pulse">
              Calling...
            </p>
          </div>

          <Button
            onClick={handleCancel}
            className="rounded-full h-14 w-14 bg-red-500 hover:bg-red-600 text-white shadow-lg"
            size="icon"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
