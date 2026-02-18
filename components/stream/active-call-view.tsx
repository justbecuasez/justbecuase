"use client";

import { useEffect, useState, useRef } from "react";
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
  onClose: (reason?: string) => void;
}

/**
 * Full-screen active call UI with speaker layout, controls, and live timer.
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

function useCallDuration() {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return elapsed;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

function ActiveCallContent({ onClose }: { onClose: (reason?: string) => void }) {
  const call = useCall();
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();
  const duration = useCallDuration();

  // Auto-close when call ends
  useEffect(() => {
    if (callingState === CallingState.LEFT || callingState === CallingState.IDLE) {
      const durationStr = formatDuration(duration);
      onClose(`Call ended · ${durationStr}`);
    }
  }, [callingState, onClose, duration]);

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
          {callingState === CallingState.JOINED && (
            <span className="text-xs text-muted-foreground tabular-nums ml-2">
              {formatDuration(duration)}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={async () => {
            const durationStr = formatDuration(duration);
            await call.leave();
            onClose(`Call ended · ${durationStr}`);
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
          onLeave={() => {
            const durationStr = formatDuration(duration);
            onClose(`Call ended · ${durationStr}`);
          }}
        />
      </div>
    </div>
  );
}
