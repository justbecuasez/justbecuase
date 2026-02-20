import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const password = process.env.SITE_PASSWORD || process.env.SITE_ACCESS_CODE

  if (!password) {
    return NextResponse.json(
      { error: "Gate is not configured" },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const inputPassword = body.password

    if (!inputPassword || inputPassword !== password) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      )
    }

    // Correct password — set an httpOnly cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set("site-access", "granted", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return response
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    )
  }
}
