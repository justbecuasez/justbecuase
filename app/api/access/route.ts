import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// Generate a signed token so users can't fake the cookie
function generateAccessToken(accessCode: string): string {
  return crypto.createHash("sha256").update(`site-gate:${accessCode}`).digest("hex").slice(0, 32)
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    // The access code is stored as an environment variable on Vercel
    const validCode = process.env.SITE_ACCESS_CODE

    if (!validCode) {
      // If no access code is configured, allow access (dev mode)
      const response = NextResponse.json({ message: "Access granted" })
      response.cookies.set("site-access", "dev-mode", {
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

    // Set cookie with a hashed token (can't be faked without knowing the access code)
    const token = generateAccessToken(validCode)
    const response = NextResponse.json({ message: "Access granted" })
    response.cookies.set("site-access", token, {
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
