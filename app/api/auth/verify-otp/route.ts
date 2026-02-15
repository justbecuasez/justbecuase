import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, otp } = body

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP required" }, { status: 400 })
    }

    const db = await getDb()
    const otpCollection = db.collection("email_otps")

    // Atomically find OTP, check attempts, and increment attempt count to prevent race conditions
    const otpRecord = await otpCollection.findOneAndUpdate(
      { 
        email: email.toLowerCase(),
        attempts: { $lt: 5 },
        expiresAt: { $gt: new Date() }
      },
      { $inc: { attempts: 1 } },
      { returnDocument: "before" }
    )

    if (!otpRecord) {
      // Could be: no record, expired, or too many attempts
      const existing = await otpCollection.findOne({ email: email.toLowerCase() })
      if (!existing) {
        return NextResponse.json({ 
          success: false, 
          error: "No verification code found. Please request a new one." 
        }, { status: 400 })
      }
      if (new Date() > new Date(existing.expiresAt)) {
        await otpCollection.deleteOne({ email: email.toLowerCase() })
        return NextResponse.json({ 
          success: false, 
          error: "Verification code expired. Please request a new one." 
        }, { status: 400 })
      }
      if (existing.attempts >= 5) {
        await otpCollection.deleteOne({ email: email.toLowerCase() })
        return NextResponse.json({ 
          success: false, 
          error: "Too many attempts. Please request a new code." 
        }, { status: 400 })
      }
      return NextResponse.json({ 
        success: false, 
        error: "Verification failed. Please try again." 
      }, { status: 400 })
    }

    // Verify OTP
    if (otpRecord.otp !== otp.toString()) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid verification code. Please try again.",
        attemptsRemaining: 5 - otpRecord.attempts - 1
      }, { status: 400 })
    }

    // OTP verified - delete it
    await otpCollection.deleteOne({ email: email.toLowerCase() })

    // Mark email as verified in a separate collection (for tracking)
    const verifiedEmailsCollection = db.collection("verified_emails")
    await verifiedEmailsCollection.updateOne(
      { email: email.toLowerCase() },
      { 
        $set: { 
          email: email.toLowerCase(),
          verifiedAt: new Date() 
        }
      },
      { upsert: true }
    )

    return NextResponse.json({ 
      success: true, 
      message: "Email verified successfully" 
    })
  } catch (error: any) {
    console.error("Verify OTP error:", error)
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 })
  }
}
