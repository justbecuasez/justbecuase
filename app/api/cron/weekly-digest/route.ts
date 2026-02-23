import { NextResponse } from "next/server"
import { volunteerProfilesDb, projectsDb, userBadgesDb, badgesDb, getDb, userIdQuery } from "@/lib/database"
import { sendEmail, getWeeklyDigestEmailHtml } from "@/lib/email"

// Secured by CRON_SECRET header — call from Vercel Cron or external scheduler
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Get new projects from this week
    const newProjects = await projectsDb.findMany(
      { createdAt: { $gte: oneWeekAgo } } as any,
      { sort: { createdAt: -1 }, limit: 50 }
    )

    const newProjectCount = newProjects.length

    // Get all active volunteers (filter on correct nested path for email preferences)
    const volunteers = await volunteerProfilesDb.findMany(
      { "privacy.emailNotifications": { $ne: false } } as any
    )

    let sent = 0
    let failed = 0
    let skipped = 0

    for (const volunteer of volunteers) {
      try {
        // Extract volunteer subskillIds (handles both object and plain string formats)
        const volunteerSkillIds: string[] = (volunteer.skills || []).map((s: any) =>
          typeof s === "string" ? s.toLowerCase() : (s.subskillId || "").toLowerCase()
        ).filter(Boolean)

        // Find matching projects based on EXACT subskillId match
        const matchingProjects = newProjects
          .filter((p: any) => {
            // Use the correct field: skillsRequired (array of {categoryId, subskillId, priority})
            const projectSkills: string[] = (p.skillsRequired || []).map(
              (s: any) => (typeof s === "string" ? s : s.subskillId || "").toLowerCase()
            ).filter(Boolean)
            // Require at least one exact subskillId match
            return projectSkills.some((ps: string) =>
              volunteerSkillIds.includes(ps)
            )
          })
          .slice(0, 5)
          .map((p: any) => ({
            title: p.title,
            id: p._id?.toString() || p.projectId || "",
          }))

        // Get new badges earned this week
        const volUserId = volunteer.userId || volunteer._id?.toString() || ""
        const userBadges = await userBadgesDb.findByUserId(volUserId)
        const newBadges = await Promise.all(
          userBadges
            .filter((b: any) => b.earnedAt && new Date(b.earnedAt) >= oneWeekAgo)
            .map(async (b: any) => {
              const badgeDef = await badgesDb.findByBadgeId(b.badgeId)
              return badgeDef?.name || b.badgeId
            })
        )

        // SKIP sending email if volunteer has ZERO matching projects AND zero new badges
        // Don't spam people with irrelevant digest emails
        if (matchingProjects.length === 0 && newBadges.length === 0) {
          skipped++
          continue
        }

        const html = getWeeklyDigestEmailHtml(
          volunteer.name || "Volunteer",
          {
            newProjects: newProjectCount,
            matchingProjects,
            profileViews: 0, // TODO: implement profile view tracking
            newBadges,
          }
        )

        const db = await getDb()
        const volUser = await db.collection("user").findOne(userIdQuery(volunteer.userId))
        if (!volUser?.email) continue

        // Respect email notification preferences
        const prefs = volUser.privacy
        if (prefs?.emailNotifications === false || prefs?.opportunityDigest === false) {
          skipped++
          continue
        }

        await sendEmail({
          to: volUser.email,
          subject: `Your Weekly Impact Digest — ${matchingProjects.length} matching opportunities`,
          html,
        })
        sent++
      } catch {
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      skipped,
      totalVolunteers: volunteers.length,
    })
  } catch (error: any) {
    console.error("Weekly digest cron error:", error)
    return NextResponse.json(
      { error: "Failed to send weekly digest" },
      { status: 500 }
    )
  }
}
