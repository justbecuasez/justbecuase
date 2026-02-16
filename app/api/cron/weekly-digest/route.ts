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

    // Get all active volunteers
    const volunteers = await volunteerProfilesDb.findMany(
      { emailNotifications: { $ne: false } } as any
    )

    let sent = 0
    let failed = 0

    for (const volunteer of volunteers) {
      try {
        // Find matching projects based on skills
        const volunteerSkills = (volunteer.skills || []).map((s: any) =>
          (typeof s === "string" ? s : s.subskillId || s.categoryId || "").toLowerCase()
        )
        const matchingProjects = newProjects
          .filter((p: any) => {
            const projectSkills = (p.skillsNeeded || p.skills || []).map(
              (s: string) => s.toLowerCase()
            )
            return projectSkills.some((ps: string) =>
              volunteerSkills.some(
                (vs: string) => vs.includes(ps) || ps.includes(vs)
              )
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

        await sendEmail({
          to: volUser.email,
          subject: `Your Weekly Impact Digest — ${newProjectCount} new opportunities`,
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
