import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/database"

const CRON_SECRET = process.env.CRON_SECRET

/**
 * POST /api/cron/profile-nudge
 * 
 * Sends profile completion nudge emails to users who signed up
 * but haven't completed onboarding within the last 24-48 hours.
 * 
 * Protected by CRON_SECRET header for secure invocation from
 * external cron services (e.g., Vercel Cron, GitHub Actions).
 * 
 * Query params:
 *   - dryRun=true  → logs what would be sent without actually sending
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization")
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dryRun = request.nextUrl.searchParams.get("dryRun") === "true"
    const db = await getDb()
    const usersCollection = db.collection("user")

    // Find users created 24-48 hours ago who don't have a profile yet
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

    // Get users who registered between 24-48h ago
    const recentUsers = await usersCollection.find({
      createdAt: {
        $gte: fortyEightHoursAgo,
        $lte: twentyFourHoursAgo,
      },
      role: { $in: ["volunteer", "ngo"] },
      // Skip users who already received a nudge
      profileNudgeSent: { $ne: true },
    }).limit(50).toArray()

    const results: { userId: string; email: string; role: string; status: string }[] = []

    for (const user of recentUsers) {
      const role = user.role as "volunteer" | "ngo"
      
      // Check if they have a profile
      const profileCollection = role === "volunteer" ? "volunteer_profiles" : "ngo_profiles"
      const profile = await db.collection(profileCollection).findOne({ userId: user.id || user._id?.toString() })

      // If profile exists and has key fields filled, skip
      if (profile) {
        const isComplete = role === "volunteer"
          ? !!(profile.name && profile.skills?.length > 0)
          : !!(profile.organizationName && profile.causes?.length > 0)
        
        if (isComplete) {
          results.push({ userId: user.id, email: user.email, role, status: "skipped_complete" })
          continue
        }
      }

      // Check email notification preference
      const prefs = user.privacy
      if (prefs?.emailNotifications === false) {
        results.push({ userId: user.id, email: user.email, role, status: "skipped_opted_out" })
        continue
      }

      if (!user.email) {
        results.push({ userId: user.id, email: "none", role, status: "skipped_no_email" })
        continue
      }

      const onboardingUrl = role === "volunteer" ? "/volunteer/onboarding" : "/ngo/onboarding"
      const recipientName = user.name || "there"

      if (dryRun) {
        results.push({ userId: user.id, email: user.email, role, status: "would_send" })
      } else {
        try {
          const { sendEmail, getProfileNudgeEmailHtml } = await import("@/lib/email")
          const html = getProfileNudgeEmailHtml(recipientName, role, onboardingUrl)
          
          await sendEmail({
            to: user.email,
            subject: "Complete your JustBeCause profile and start making an impact!",
            html,
            text: `Hi ${recipientName}, we noticed you haven't completed your profile yet. Visit https://justbecausenetwork.com${onboardingUrl} to get started!`,
          })

          // Mark user so we don't send again
          await usersCollection.updateOne(
            { _id: user._id },
            { $set: { profileNudgeSent: true, profileNudgeSentAt: new Date() } }
          )

          results.push({ userId: user.id, email: user.email, role, status: "sent" })
        } catch (emailErr) {
          console.error(`[profile-nudge] Failed to send to ${user.email}:`, emailErr)
          results.push({ userId: user.id, email: user.email, role, status: "failed" })
        }
      }
    }

    const sent = results.filter(r => r.status === "sent").length
    const skipped = results.filter(r => r.status.startsWith("skipped")).length

    return NextResponse.json({
      success: true,
      summary: { total: recentUsers.length, sent, skipped, dryRun },
      results,
    })
  } catch (error: any) {
    console.error("[profile-nudge] Cron error:", error)
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 })
  }
}
