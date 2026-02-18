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
}

const StreamContext = createContext<StreamContextValue>({
  chatClient: null,
  videoClient: null,
  isReady: false,
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

  // Token provider that fetches from our API
  const tokenProvider = useCallback(async () => {
    const res = await fetch("/api/stream/token");
    if (!res.ok) throw new Error("Failed to fetch Stream token");
    const data = await res.json();
    return data.token as string;
  }, []);

  useEffect(() => {
    if (isLoading || !user?.id || !STREAM_API_KEY) return;

    let didCancel = false;
    let chat: StreamChat | null = null;
    let video: StreamVideoClient | null = null;

    const initClients = async () => {
      try {
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
      } catch (err) {
        console.error("Failed to initialize Stream clients:", err);
      }
    };

    initClients();

    return () => {
      didCancel = true;
      if (chat) {
        chat.disconnectUser().catch(console.error);
        setChatClient(null);
      }
      if (video) {
        video.disconnectUser().catch(console.error);
        setVideoClient(null);
      }
    };
  }, [user?.id, user?.name, user?.image, isLoading, tokenProvider]);

  // Determine Stream chat theme
  const chatTheme = resolvedTheme === "dark" ? "str-chat__theme-dark" : "str-chat__theme-light";

  const contextValue: StreamContextValue = {
    chatClient,
    videoClient,
    isReady: !!chatClient && !!videoClient,
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
