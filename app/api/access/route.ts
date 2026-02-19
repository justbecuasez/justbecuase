import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// Cookie name for access token
const ACCESS_COOKIE = "site_access_token"

// Cookie expiry (7 days)
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      )
    }

    // Get the site password from environment
    const sitePassword = process.env.SITE_PASSWORD

    if (!sitePassword) {
      console.error("SITE_PASSWORD environment variable is not set")
      return NextResponse.json(
        { error: "Access system not configured" },
        { status: 500 }
      )
    }

    // Verify password
    if (password !== sitePassword) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      )
    }

    // Generate access token (hash of password + timestamp for uniqueness)
    const accessToken = process.env.SITE_ACCESS_TOKEN || 
      crypto.createHash("sha256").update(sitePassword + Date.now()).digest("hex")

    // Create response with success
    const response = NextResponse.json({ success: true })

    // Set the access cookie
    response.cookies.set(ACCESS_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Access verification error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

// Logout endpoint - clear the access cookie
export async function DELETE() {
  const response = NextResponse.json({ success: true })
  
  response.cookies.set(ACCESS_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  })

  return response
}
