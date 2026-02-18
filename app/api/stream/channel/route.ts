import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getOrCreateChannel } from "@/lib/stream";

/**
 * POST /api/stream/channel
 * Creates or gets a 1:1 messaging channel between the current user and another user.
 * Body: { otherUserId: string, projectId?: string, projectTitle?: string }
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { otherUserId, projectId, projectTitle } = body;

    if (!otherUserId) {
      return NextResponse.json(
        { error: "otherUserId is required" },
        { status: 400 }
      );
    }

    // Create or get channel
    const channel = await getOrCreateChannel(
      session.user.id,
      otherUserId,
      { projectId, projectTitle }
    );

    return NextResponse.json({
      channelId: channel.id,
      channelType: channel.type,
      cid: channel.cid,
    });
  } catch (error) {
    console.error("Error creating Stream channel:", error);
    return NextResponse.json(
      { error: "Failed to create channel" },
      { status: 500 }
    );
  }
}
