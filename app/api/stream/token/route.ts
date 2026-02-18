import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { generateStreamToken } from "@/lib/stream";

/**
 * GET /api/stream/token
 * Returns a GetStream token for the authenticated user.
 * Used by the client-side tokenProvider for auto-refresh.
 */
export async function GET() {
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

    const token = await generateStreamToken({
      id: session.user.id,
      name: session.user.name,
      image: session.user.image || undefined,
      role: (session.user as any).role || "volunteer",
    });

    return NextResponse.json({
      token,
      apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY,
      userId: session.user.id,
    });
  } catch (error) {
    console.error("Error generating Stream token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
