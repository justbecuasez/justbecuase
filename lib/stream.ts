import { StreamChat } from "stream-chat";

// Server-side Stream Chat client singleton
let serverClient: StreamChat | null = null;

export function getStreamServerClient(): StreamChat {
  if (!serverClient) {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error(
        "Missing GetStream credentials. Set NEXT_PUBLIC_STREAM_API_KEY and STREAM_API_SECRET in .env.local"
      );
    }

    serverClient = StreamChat.getInstance(apiKey, apiSecret);
  }

  return serverClient;
}

/**
 * Generate a Stream user token for the given user.
 * Also upserts the user in Stream with their current profile data.
 */
export async function generateStreamToken(user: {
  id: string;
  name: string;
  image?: string;
  role?: string;
}): Promise<string> {
  const client = getStreamServerClient();

  // Upsert user in Stream with current profile data
  // Use type assertion since custom fields aren't in the default CustomUserData interface
  await client.upsertUser({
    id: user.id,
    name: user.name,
    image: user.image || undefined,
    role: "user",
  } as Parameters<typeof client.upsertUser>[0]);

  // Generate token with 24-hour expiry
  const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  const issuedAt = Math.floor(Date.now() / 1000);
  const token = client.createToken(user.id, expiresAt, issuedAt);

  return token;
}

/**
 * Create or get a 1:1 messaging channel between two users.
 * Uses a deterministic channel ID based on sorted user IDs.
 */
export async function getOrCreateChannel(
  userId1: string,
  userId2: string,
  extraData?: {
    projectId?: string;
    projectTitle?: string;
  }
) {
  const client = getStreamServerClient();

  // Create deterministic channel ID from sorted user IDs
  const sortedIds = [userId1, userId2].sort();
  const channelId = `dm_${sortedIds[0]}_${sortedIds[1]}`;

  const channel = client.channel("messaging", channelId, {
    members: [userId1, userId2],
    created_by_id: userId1,
    ...(extraData?.projectId && {
      projectId: extraData.projectId,
      projectTitle: extraData.projectTitle,
    }),
  });

  await channel.create();

  return channel;
}

/**
 * Get unread counts for a user across all channels.
 */
export async function getUnreadCounts(userId: string) {
  const client = getStreamServerClient();
  const response = await client.getUnreadCount(userId);
  return {
    totalUnread: response.total_unread_count,
    channels: response.channels,
  };
}
