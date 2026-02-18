import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getVolunteerProfile, browseProjects } from "@/lib/actions"

/**
 * GET /api/projects/matched
 * 
 * Returns only projects that match the logged-in volunteer's skills.
 * If the volunteer has no skills set, returns empty array.
 * Falls back to all projects if user is not a volunteer (e.g., public browsing).
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    // If not logged in or not a volunteer, return empty — they should use /api/projects
    if (!session?.user || session.user.role !== "volunteer") {
      return NextResponse.json({ 
        projects: [], 
        matched: false,
        message: "Login as a volunteer to see skill-matched opportunities" 
      })
    }

    const volunteerProfile = await getVolunteerProfile(session.user.id)
    
    if (!volunteerProfile) {
      return NextResponse.json({ 
        projects: [], 
        matched: false,
        message: "Complete your profile to see matched opportunities" 
      })
    }

    const volunteerSkills = Array.isArray(volunteerProfile.skills) ? volunteerProfile.skills : []
    
    if (volunteerSkills.length === 0) {
      return NextResponse.json({ 
        projects: [], 
        matched: false,
        message: "Add skills to your profile to see matched opportunities" 
      })
    }

    // Get all active projects
    const allProjects = await browseProjects()

    // Extract volunteer's skill IDs (both categoryId and subskillId for matching)
    const volunteerCategoryIds = new Set(volunteerSkills.map((s: any) => s.categoryId).filter(Boolean))
    const volunteerSubskillIds = new Set(volunteerSkills.map((s: any) => s.subskillId).filter(Boolean))

    // Filter projects where at least one required skill matches the volunteer's skills
    // Match by exact subskillId OR same categoryId (transferable skills)
    const matchedProjects = allProjects.filter((project: any) => {
      const requiredSkills = project.skillsRequired || []
      
      // If project has no skill requirements, exclude it (can't verify match)
      if (requiredSkills.length === 0) return true // Show projects with no requirements to everyone
      
      // Check if volunteer has at least one matching skill
      return requiredSkills.some((reqSkill: any) => {
        const reqSubskillId = reqSkill.subskillId || reqSkill.skillId
        const reqCategoryId = reqSkill.categoryId

        // Exact subskill match (best match)
        if (reqSubskillId && volunteerSubskillIds.has(reqSubskillId)) {
          return true
        }
        
        // Same category match (transferable skills — volunteer has a skill in the same category)
        if (reqCategoryId && volunteerCategoryIds.has(reqCategoryId)) {
          return true
        }

        return false
      })
    })

    return NextResponse.json({ 
      projects: matchedProjects, 
      matched: true,
      totalAvailable: allProjects.length,
      volunteerSkillCount: volunteerSkills.length,
    })
  } catch (error) {
    console.error("Error fetching matched projects:", error)
    return NextResponse.json({ projects: [], matched: false }, { status: 500 })
  }
}
