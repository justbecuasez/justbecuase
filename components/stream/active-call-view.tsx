"use client";

import { useEffect, useState } from "react";
import {
  StreamCall,
  SpeakerLayout,
  CallControls,
  CallingState,
  useCallStateHooks,
  useCall,
  StreamTheme,
} from "@stream-io/video-react-sdk";
import type { Call } from "@stream-io/video-react-sdk";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActiveCallProps {
  call: Call;
  onClose: () => void;
}

/**
 * Full-screen active call UI with speaker layout and controls.
 */
export function ActiveCallView({ call, onClose }: ActiveCallProps) {
  return (
    <StreamCall call={call}>
      <StreamTheme>
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm">
          <ActiveCallContent onClose={onClose} />
        </div>
      </StreamTheme>
    </StreamCall>
  );
}

function ActiveCallContent({ onClose }: { onClose: () => void }) {
  const call = useCall();
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();

  // Auto-close when call ends
  useEffect(() => {
    if (callingState === CallingState.LEFT || callingState === CallingState.IDLE) {
      onClose();
    }
  }, [callingState, onClose]);

  if (!call) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Call header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium">
            {callingState === CallingState.RINGING && "Ringing..."}
            {callingState === CallingState.JOINING && "Joining..."}
            {callingState === CallingState.JOINED && `In call · ${participantCount} participant${participantCount !== 1 ? "s" : ""}`}
            {callingState === CallingState.RECONNECTING && "Reconnecting..."}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={async () => {
            await call.leave();
            onClose();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Video layout */}
      <div className="flex-1 relative">
        <SpeakerLayout participantsBarPosition="bottom" />
      </div>

      {/* Call controls */}
      <div className="flex justify-center py-4 bg-card border-t border-border">
        <CallControls
          onLeave={() => onClose()}
        />
      </div>
    </div>
  );
}
