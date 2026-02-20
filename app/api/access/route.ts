import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    // The access code is stored as an environment variable on Vercel
    const validCode = process.env.SITE_ACCESS_CODE

    if (!validCode) {
      // If no access code is configured, allow access (dev mode)
      const response = NextResponse.json({ message: "Access granted" })
      response.cookies.set("site-access", "granted", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      })
      return response
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
