import { NextResponse } from "next/server"
import { volunteerProfilesDb, projectsDb, getDb, userIdQuery } from "@/lib/database"
import { sendEmail, getReEngagementEmailHtml } from "@/lib/email"

// Secured by CRON_SECRET header — call from Vercel Cron or external scheduler
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Find volunteers inactive for 14-30 days (don't spam people inactive longer)
    const inactiveVolunteers = await volunteerProfilesDb.findMany(
      {
        updatedAt: { $lte: fourteenDaysAgo, $gte: thirtyDaysAgo },
        emailNotifications: { $ne: false },
      } as any
    )

    // Count new projects since each volunteer's last activity
    const allNewProjects = await projectsDb.findMany(
      { createdAt: { $gte: thirtyDaysAgo } } as any,
      { limit: 200 }
    )

    let sent = 0
    let failed = 0

    for (const volunteer of inactiveVolunteers) {
      try {
        const lastActive = new Date(volunteer.updatedAt || volunteer.createdAt)
        const daysSince = Math.floor(
          (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Count projects posted since they were last active
        const newProjectsSince = allNewProjects.filter(
          (p: any) => new Date(p.createdAt) > lastActive
        ).length

        // Count how many match their skills
        const volunteerSkills = (volunteer.skills || []).map((s: any) =>
          (typeof s === "string" ? s : s.subskillId || s.categoryId || "").toLowerCase()
        )
        const missedMatches = allNewProjects.filter((p: any) => {
          const pSkills = (p.skillsNeeded || p.skills || []).map((s: string) =>
            s.toLowerCase()
          )
          return (
            new Date(p.createdAt) > lastActive &&
            pSkills.some((ps: string) =>
              volunteerSkills.some(
                (vs: string) => vs.includes(ps) || ps.includes(vs)
              )
            )
          )
        }).length

        if (newProjectsSince === 0 && missedMatches === 0) continue

        const html = getReEngagementEmailHtml(
          volunteer.name || "Volunteer",
          {
            daysSinceLastLogin: daysSince,
            newProjectsSince,
            missedMatches,
          }
        )

        const db = await getDb()
        const volUser = await db.collection("user").findOne(userIdQuery(volunteer.userId))
        if (!volUser?.email) continue

        await sendEmail({
          to: volUser.email,
          subject: `${missedMatches} opportunities matched your skills while you were away`,
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
      totalInactive: inactiveVolunteers.length,
    })
  } catch (error: any) {
    console.error("Re-engagement cron error:", error)
    return NextResponse.json(
      { error: "Failed to send re-engagement emails" },
      { status: 500 }
    )
  }
}
