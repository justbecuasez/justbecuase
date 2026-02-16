import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { volunteerProfilesDb, projectsDb, applicationsDb, reviewsDb, userBadgesDb } from "@/lib/database"

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = session.user.id
    const profile = await volunteerProfilesDb.findByUserId(userId)
    
    if (!profile) {
      return NextResponse.json({ error: "Volunteer profile not found" }, { status: 404 })
    }

    // Gather all impact data
    const [
      completedApps,
      reviews,
      badges,
    ] = await Promise.all([
      applicationsDb.findByVolunteerId(userId).then((apps: any[]) => apps.filter((a: any) => a.status === "accepted")),
      reviewsDb.findByReviewee(userId),
      userBadgesDb.findByUserId(userId),
    ])

    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum: number, r: any) => sum + r.overallRating, 0) / reviews.length).toFixed(1)
      : "N/A"

    // Calculate skills used across projects
    const skillsUsed = new Set<string>()
    if (profile.skills && Array.isArray(profile.skills)) {
      profile.skills.forEach((s: any) => {
        skillsUsed.add(s.subskillId || s.categoryId || "Unknown")
      })
    }

    // Determine volunteer level
    const completedProjects = profile.completedProjects || 0
    const hoursContributed = profile.hoursContributed || 0
    let level = "Bronze"
    if (completedProjects >= 25 || hoursContributed >= 500) level = "Platinum"
    else if (completedProjects >= 10 || hoursContributed >= 100) level = "Gold"
    else if (completedProjects >= 5 || hoursContributed >= 50) level = "Silver"

    const impactData = {
      name: profile.name || session.user.name,
      location: profile.location || profile.city || "Unknown",
      level,
      completedProjects,
      hoursContributed,
      estimatedValueCreated: hoursContributed * 50, // $50/hour pro-bono rate
      averageRating: avgRating,
      totalReviews: reviews.length,
      badgesEarned: badges.length,
      skillsCount: skillsUsed.size,
      topSkills: Array.from(skillsUsed).slice(0, 5),
      causes: profile.causes || [],
      joinedDate: profile.createdAt,
      // Certificate data
      certificateId: `JBC-${userId.slice(-8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json({ success: true, data: impactData })
  } catch (error) {
    console.error("Failed to generate impact data:", error)
    return NextResponse.json({ error: "Failed to generate impact data" }, { status: 500 })
  }
}
