import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    // The access code is stored as an environment variable on Vercel
    const validCode = process.env.SITE_ACCESS_CODE

    if (!validCode) {
      // No access code configured — reject (don't silently grant access)
      return NextResponse.json(
        { message: "Access gate is not configured. Contact the admin." },
        { status: 503 }
      )
    }

    if (code !== validCode) {
      return NextResponse.json(
        { message: "Invalid access code" },
        { status: 401 }
      )
    }

    const response = NextResponse.json({ message: "Access granted" })
    response.cookies.set("site-access", "granted", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    })

    return response
  } catch {
    return NextResponse.json(
      { message: "Invalid request" },
      { status: 400 }
    )
  }
}
