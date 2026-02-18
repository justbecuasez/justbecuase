"use client";

import { type ReactNode, useEffect, useState, useCallback, createContext, useContext } from "react";
import { StreamChat } from "stream-chat";
import { Chat } from "stream-chat-react";
import {
  StreamVideo,
  StreamVideoClient,
  type User as StreamVideoUser,
} from "@stream-io/video-react-sdk";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "next-themes";

// Import Stream CSS
import "stream-chat-react/dist/css/v2/index.css";
import "@stream-io/video-react-sdk/dist/css/styles.css";

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY!;

interface StreamContextValue {
  chatClient: StreamChat | null;
  videoClient: StreamVideoClient | null;
  isReady: boolean;
  initError: string | null;
  retry: () => void;
}

const StreamContext = createContext<StreamContextValue>({
  chatClient: null,
  videoClient: null,
  isReady: false,
  initError: null,
  retry: () => {},
});

export function useStream() {
  return useContext(StreamContext);
}

interface StreamProviderProps {
  children: ReactNode;
}

export function StreamProvider({ children }: StreamProviderProps) {
  const { user, isLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Token provider that fetches from our API (with retry)
  const tokenProvider = useCallback(async () => {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch("/api/stream/token");
        if (!res.ok) {
          const text = await res.text().catch(() => "Unknown error");
          throw new Error(`Token fetch failed (${res.status}): ${text}`);
        }
        const data = await res.json();
        return data.token as string;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }
    throw lastError ?? new Error("Failed to fetch Stream token");
  }, []);

  // Allow manual retry from error state
  const retry = useCallback(() => {
    setInitError(null);
    setRetryCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (isLoading || !user?.id || !STREAM_API_KEY) return;

    let didCancel = false;
    let chat: StreamChat | null = null;
    let video: StreamVideoClient | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const initClients = async (attempt = 0) => {
      try {
        setInitError(null);

        // Initialize Chat client
        chat = StreamChat.getInstance(STREAM_API_KEY);

        const token = await tokenProvider();

        await chat.connectUser(
          {
            id: user.id,
            name: user.name,
            image: user.image || undefined,
          },
          token
        );

        if (didCancel) {
          chat.disconnectUser();
          return;
        }

        // Initialize Video client
        const streamUser: StreamVideoUser = {
          id: user.id,
          name: user.name,
          image: user.image || undefined,
        };

        video = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user: streamUser,
          tokenProvider,
        });

        if (didCancel) {
          video.disconnectUser();
          return;
        }

        setChatClient(chat);
        setVideoClient(video);
        setInitError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Failed to initialize Stream clients (attempt ${attempt + 1}):`, msg);

        // Auto-retry up to 3 times with exponential backoff
        if (!didCancel && attempt < 3) {
          const delay = Math.min(2000 * Math.pow(2, attempt), 15000);
          retryTimer = setTimeout(() => initClients(attempt + 1), delay);
        } else if (!didCancel) {
          setInitError(msg);
        }
      }
    };

    initClients();

    return () => {
      didCancel = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (chat) {
        chat.disconnectUser().catch(console.error);
        setChatClient(null);
      }
      if (video) {
        video.disconnectUser().catch(console.error);
        setVideoClient(null);
      }
    };
  }, [user?.id, user?.name, user?.image, isLoading, tokenProvider, retryCount]);

  // Determine Stream chat theme
  const chatTheme = resolvedTheme === "dark" ? "str-chat__theme-dark" : "str-chat__theme-light";

  const contextValue: StreamContextValue = {
    chatClient,
    videoClient,
    isReady: !!chatClient && !!videoClient,
    initError,
    retry,
  };

  if (!chatClient || !videoClient) {
    return (
      <StreamContext.Provider value={contextValue}>
        {children}
      </StreamContext.Provider>
    );
  }

  return (
    <StreamContext.Provider value={contextValue}>
      <Chat client={chatClient} theme={chatTheme}>
        <StreamVideo client={videoClient}>
          {children}
        </StreamVideo>
      </Chat>
    </StreamContext.Provider>
  );
}
