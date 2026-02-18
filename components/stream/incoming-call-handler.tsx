"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
import { toast } from "sonner";

/* ═══════════════════════════════════════════
   Ring tone hook — plays a looping ringtone
   via Web Audio API synthesized tones
   ═══════════════════════════════════════════ */
function useRingtone(playing: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;

    let ctx: AudioContext;
    try {
      ctx = new AudioContext();
    } catch {
      return;
    }
    audioCtxRef.current = ctx;

    // Ring pattern: two pleasant tones
    const playRingBurst = () => {
      try {
        if (ctx.state === "closed") return;
        const now = ctx.currentTime;

        // Tone 1 — 440 Hz (A4)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(440, now);
        gain1.gain.setValueAtTime(0.18, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc1.connect(gain1).connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.5);

        // Tone 2 — 554 Hz (C#5, a pleasant major third)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(554, now + 0.15);
        gain2.gain.setValueAtTime(0.18, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        osc2.connect(gain2).connect(ctx.destination);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.65);
      } catch {
        // AudioContext already closed
      }
    };

    // Play immediately, then every 2s (ring… pause… ring…)
    playRingBurst();
    intervalRef.current = setInterval(playRingBurst, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      try { ctx.close(); } catch { /* already closed */ }
    };
  }, [playing]);
}

/* ═══════════════════════════════════════════
   Call timer hook
   ═══════════════════════════════════════════ */
function useCallTimer(active: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (!active) { setElapsed(0); return; }
    startRef.current = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [active]);

  return elapsed;
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/* ═══════════════════════════════════════════
   Main incoming call handler
   ═══════════════════════════════════════════ */
export function IncomingCallHandler() {
  const { videoClient } = useStream();
  if (!videoClient) return null;
  return <IncomingCallHandlerInner />;
}

function IncomingCallHandlerInner() {
  const calls = useCalls();
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [callEndStatus, setCallEndStatus] = useState<string | null>(null);

  const ringingCalls = calls.filter((call) => {
    const state = call.state.callingState;
    return state === CallingState.RINGING && !call.isCreatedByMe;
  });

  const outgoingCalls = calls.filter((call) => {
    const state = call.state.callingState;
    return state === CallingState.RINGING && call.isCreatedByMe;
  });

  const joinedCalls = calls.filter(
    (call) => call.state.callingState === CallingState.JOINED
  );

  // Auto-set active call when joined
  useEffect(() => {
    if (joinedCalls.length > 0 && !activeCall) {
      setActiveCall(joinedCalls[0]);
    }
  }, [joinedCalls, activeCall]);

  // Play ring sound for incoming calls
  useRingtone(ringingCalls.length > 0);

  // Clear end status banner after 4s
  useEffect(() => {
    if (!callEndStatus) return;
    const t = setTimeout(() => setCallEndStatus(null), 4000);
    return () => clearTimeout(t);
  }, [callEndStatus]);

  // Active call
  if (activeCall) {
    return (
      <ActiveCallView
        call={activeCall}
        onClose={(reason?: string) => {
          setActiveCall(null);
          if (reason) setCallEndStatus(reason);
        }}
      />
    );
  }

  // Outgoing ringing
  if (outgoingCalls.length > 0) {
    return (
      <OutgoingCallNotification
        call={outgoingCalls[0]}
        onJoined={(call) => setActiveCall(call)}
        onStatus={(status) => setCallEndStatus(status)}
      />
    );
  }

  // Incoming ringing
  if (ringingCalls.length > 0) {
    return (
      <IncomingCallNotification
        call={ringingCalls[0]}
        onAccepted={(call) => setActiveCall(call)}
      />
    );
  }

  // Call end status banner
  if (callEndStatus) {
    return (
      <div className="fixed top-4 right-4 z-[200] animate-in slide-in-from-top-5 duration-300">
        <div className="bg-card border border-border rounded-xl shadow-lg px-6 py-4 flex items-center gap-3 min-w-[280px]">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <PhoneOff className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">{callEndStatus}</p>
        </div>
      </div>
    );
  }

  return null;
}

/* ═══════════════════════════════════════════
   Incoming call notification — full screen overlay
   ═══════════════════════════════════════════ */
function IncomingCallNotification({
  call,
  onAccepted,
}: {
  call: Call;
  onAccepted: (call: Call) => void;
}) {
  const callerName = call.state.createdBy?.name || "Unknown";
  const callerImage = call.state.createdBy?.image;
  const isVideo = call.state.settings?.video?.camera_default_on ?? false;
  const elapsedRing = useCallTimer(true);

  const handleAccept = useCallback(async () => {
    try {
      await call.join();
      onAccepted(call);
    } catch (err) {
      console.error("Failed to accept call:", err);
      toast.error("Failed to join call");
    }
  }, [call, onAccepted]);

  const handleReject = useCallback(async () => {
    try {
      await call.leave({ reject: true, reason: "decline" });
      toast.info("Call declined");
    } catch (err) {
      console.error("Failed to reject call:", err);
    }
  }, [call]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card border border-border rounded-3xl shadow-2xl p-8 min-w-[340px] max-w-[400px]">
        <div className="flex flex-col items-center gap-5">
          {/* Animated ring pulse */}
          <div className="relative">
            <div className="absolute -inset-3 rounded-full bg-green-500/15 animate-ping" />
            <div className="absolute -inset-2 rounded-full bg-green-500/20 animate-pulse" />
            <Avatar className="h-20 w-20 ring-3 ring-green-500 ring-offset-4 ring-offset-background relative z-10">
              <AvatarImage src={callerImage} alt={callerName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {callerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">{callerName}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Incoming {isVideo ? "video" : "voice"} call
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1 tabular-nums">
              {formatTimer(elapsedRing)}
            </p>
          </div>

          <div className="flex items-center gap-8 mt-3">
            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={handleReject}
                className="rounded-full h-16 w-16 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 transition-all hover:scale-105"
                size="icon"
              >
                <PhoneOff className="h-7 w-7" />
              </Button>
              <span className="text-xs text-muted-foreground">Decline</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={handleAccept}
                className="rounded-full h-16 w-16 bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30 transition-all hover:scale-105 animate-bounce"
                size="icon"
              >
                {isVideo ? <Video className="h-7 w-7" /> : <Phone className="h-7 w-7" />}
              </Button>
              <span className="text-xs text-muted-foreground">Accept</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Outgoing call notification
   Listens for rejected / ended / auto-cancel
   ═══════════════════════════════════════════ */
function OutgoingCallNotification({
  call,
  onJoined,
  onStatus,
}: {
  call: Call;
  onJoined: (call: Call) => void;
  onStatus: (status: string) => void;
}) {
  const members = call.state.members;
  const otherMembers = members.filter((m) => m.user_id !== call.currentUserId);
  const recipientName = otherMembers[0]?.user?.name || "Calling...";
  const recipientImage = otherMembers[0]?.user?.image;
  const isVideo = call.state.settings?.video?.camera_default_on ?? false;
  const elapsedRing = useCallTimer(true);

  // Play outgoing ring tone
  useRingtone(true);

  // Watch for accepted
  useEffect(() => {
    const unsub = call.on("call.accepted", () => {
      onJoined(call);
    });
    return () => { unsub(); };
  }, [call, onJoined]);

  // Watch for rejected
  useEffect(() => {
    const unsub = call.on("call.rejected", () => {
      onStatus(`${recipientName} declined the call`);
    });
    return () => { unsub(); };
  }, [call, onStatus, recipientName]);

  // Watch for ended (server-side timeout)
  useEffect(() => {
    const unsub = call.on("call.ended", () => {
      onStatus("Call ended");
    });
    return () => { unsub(); };
  }, [call, onStatus]);

  // Watch for callingState going to IDLE (auto-cancel timeout)
  useEffect(() => {
    const interval = setInterval(() => {
      const state = call.state.callingState;
      if (state === CallingState.IDLE || state === CallingState.LEFT) {
        onStatus(`${recipientName} didn't answer`);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [call, onStatus, recipientName]);

  const handleCancel = useCallback(async () => {
    try {
      await call.leave({ reject: true, reason: "cancel" });
      onStatus("Call cancelled");
    } catch (err) {
      console.error("Failed to cancel call:", err);
    }
  }, [call, onStatus]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card border border-border rounded-3xl shadow-2xl p-8 min-w-[340px] max-w-[400px]">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="absolute -inset-3 rounded-full bg-primary/10 animate-pulse" />
            <Avatar className="h-20 w-20 ring-3 ring-primary ring-offset-4 ring-offset-background relative z-10">
              <AvatarImage src={recipientImage} alt={recipientName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {recipientName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">{recipientName}</p>
            <p className="text-sm text-muted-foreground animate-pulse mt-1">
              {isVideo ? "Video" : "Voice"} calling…
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1 tabular-nums">
              {formatTimer(elapsedRing)}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 mt-2">
            <Button
              onClick={handleCancel}
              className="rounded-full h-16 w-16 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 transition-all hover:scale-105"
              size="icon"
            >
              <PhoneOff className="h-7 w-7" />
            </Button>
            <span className="text-xs text-muted-foreground">Cancel</span>
          </div>
        </div>
      </div>
    </div>
  );
}
