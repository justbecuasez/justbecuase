import { NextRequest, NextResponse } from "next/server"
import { generateText, Output, tool, stepCountIs } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import client from "@/lib/db"

// All valid skill IDs and cause IDs from the platform
const VALID_SKILLS = [
  "community-management", "email-marketing", "social-media-ads", "ppc-google-ads",
  "seo-content", "social-media-strategy", "whatsapp-marketing",
  "grant-writing", "grant-research", "corporate-sponsorship", "major-gift-strategy",
  "peer-to-peer-campaigns", "fundraising-pitch-deck",
  "wordpress-development", "ux-ui", "html-css", "website-security",
  "cms-maintenance", "website-redesign", "landing-page-optimization",
  "bookkeeping", "budgeting-forecasting", "payroll-processing",
  "financial-reporting", "accounting-software",
  "photography", "videography", "video-editing", "photo-editing",
  "motion-graphics", "graphic-design",
  "donor-communications", "email-copywriting", "press-release",
  "impact-story-writing", "annual-report-writing",
  "volunteer-recruitment", "event-planning", "event-onground-support",
  "telecalling", "customer-support", "logistics-management",
] as const

const VALID_CAUSES = [
  "education", "healthcare", "environment", "poverty-alleviation",
  "women-empowerment", "child-welfare", "animal-welfare", "disaster-relief",
  "human-rights", "arts-culture", "senior-citizens", "disability-support",
] as const

const VALID_WORK_MODES = ["remote", "onsite", "hybrid"] as const
const VALID_VOLUNTEER_TYPES = ["free", "paid", "both"] as const

// Schema for the structured search output
const searchFiltersSchema = z.object({
  skills: z.array(z.string()).describe("Matching skill IDs from the platform"),
  causes: z.array(z.string()).describe("Matching cause IDs from the platform"),
  workMode: z.string().optional().describe("Work mode: remote, onsite, or hybrid"),
  volunteerType: z.string().optional().describe("Volunteer type: free, paid, or both"),
  location: z.string().optional().describe("City or country name if mentioned"),
  minRating: z.number().optional().describe("Minimum rating 1-5 if quality mentioned"),
  maxHourlyRate: z.number().optional().describe("Max hourly rate if budget mentioned"),
  matchedVolunteerIds: z.array(z.string()).optional().describe("IDs of directly matched volunteers from database search"),
})

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()

    if (!query || typeof query !== "string" || query.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "Query must be at least 3 characters" },
        { status: 400 }
      )
    }

    // If no OpenAI key, fall back to keyword matching
    if (!process.env.OPENAI_API_KEY) {
      console.log("[AI Search] No OpenAI API key, using keyword fallback")
      const filters = keywordFallback(query)
      return NextResponse.json({ success: true, data: filters, method: "keyword" })
    }

    try {
      const filters = await searchWithAgent(query)
      return NextResponse.json({ success: true, data: filters, method: "ai-agent" })
    } catch (aiError) {
      console.error("[AI Search] AI agent failed, using keyword fallback:", aiError)
      const filters = keywordFallback(query)
      return NextResponse.json({ success: true, data: filters, method: "keyword" })
    }
  } catch (error) {
    console.error("[AI Search] Error:", error)
    return NextResponse.json(
      { success: false, error: "Search failed" },
      { status: 500 }
    )
  }
}

async function searchWithAgent(query: string) {
  const db = client.db("justbecause")

  const { output } = await generateText({
    model: openai("gpt-4o-mini"),
    system: `You are a smart search agent for JustBeCause Network — a volunteer marketplace connecting NGOs with skilled volunteers.

Your job: Parse a natural language search query into structured filters AND optionally search the database for matching volunteers.

Available skill IDs: ${VALID_SKILLS.join(", ")}
Available cause IDs: ${VALID_CAUSES.join(", ")}
Available work modes: ${VALID_WORK_MODES.join(", ")}
Available volunteer types: ${VALID_VOLUNTEER_TYPES.join(", ")}

Match semantically — e.g.:
- "website design" → ux-ui, wordpress-development, website-redesign
- "SEO expert" → seo-content
- "video creator" → videography, video-editing, motion-graphics
- "marketing" → ALL marketing skills
- "fundraising" → ALL fundraising skills
- "writer" or "copywriter" → email-copywriting, press-release, impact-story-writing, annual-report-writing
- "graphic designer" → graphic-design, ux-ui
- "photographer/cameraman" → photography, videography

Be generous — include ALL related skills. Only include fields clearly indicated by the query.

If the query mentions a specific person's name, location, or seems like it would benefit from a database search, use the searchVolunteers tool to find matching profiles.

Return the structured filters as the final output.`,
    tools: {
      searchVolunteers: tool({
        description: "Search the volunteer database for profiles matching specific criteria like name, headline, location, or skills. Use when the query mentions specific names, cities, or very specific criteria that could benefit from a direct database lookup.",
        inputSchema: z.object({
          nameQuery: z.string().optional().describe("Search for volunteers by name"),
          locationQuery: z.string().optional().describe("Search by city or country"),
          headlineQuery: z.string().optional().describe("Search in volunteer headlines"),
          skillIds: z.array(z.string()).optional().describe("Filter by specific skill IDs"),
          limit: z.number().optional().describe("Max results to return, default 20"),
        }),
        execute: async ({ nameQuery, locationQuery, headlineQuery, skillIds, limit = 20 }) => {
          try {
            const filter: Record<string, unknown> = {}

            if (nameQuery) {
              filter.name = { $regex: nameQuery, $options: "i" }
            }
            if (locationQuery) {
              filter.$or = [
                { location: { $regex: locationQuery, $options: "i" } },
                { city: { $regex: locationQuery, $options: "i" } },
                { country: { $regex: locationQuery, $options: "i" } },
              ]
            }
            if (headlineQuery) {
              filter.headline = { $regex: headlineQuery, $options: "i" }
            }
            if (skillIds && skillIds.length > 0) {
              filter["skills.subskillId"] = { $in: skillIds }
            }

            const volunteers = await db
              .collection("volunteer_profiles")
              .find(filter)
              .project({ _id: 0, userId: 1, name: 1, headline: 1, location: 1, city: 1, skills: 1, volunteerType: 1, hourlyRate: 1 })
              .limit(limit)
              .toArray()

            return {
              count: volunteers.length,
              volunteers: volunteers.map(v => ({
                id: v.userId,
                name: v.name,
                headline: v.headline,
                location: v.location || v.city,
                skills: v.skills?.map((s: { subskillId: string }) => s.subskillId).slice(0, 5),
                type: v.volunteerType,
              })),
            }
          } catch (err) {
            return { count: 0, volunteers: [], error: "Database query failed" }
          }
        },
      }),
      getAvailableSkills: tool({
        description: "Get all skill categories with their sub-skills to help map the query to the right skill IDs",
        inputSchema: z.object({}),
        execute: async () => {
          return {
            categories: [
              { name: "Digital Marketing", skills: ["community-management", "email-marketing", "social-media-ads", "ppc-google-ads", "seo-content", "social-media-strategy", "whatsapp-marketing"] },
              { name: "Fundraising", skills: ["grant-writing", "grant-research", "corporate-sponsorship", "major-gift-strategy", "peer-to-peer-campaigns", "fundraising-pitch-deck"] },
              { name: "Website & Tech", skills: ["wordpress-development", "ux-ui", "html-css", "website-security", "cms-maintenance", "website-redesign", "landing-page-optimization"] },
              { name: "Finance & Accounting", skills: ["bookkeeping", "budgeting-forecasting", "payroll-processing", "financial-reporting", "accounting-software"] },
              { name: "Photography & Video", skills: ["photography", "videography", "video-editing", "photo-editing", "motion-graphics", "graphic-design"] },
              { name: "Content & Writing", skills: ["donor-communications", "email-copywriting", "press-release", "impact-story-writing", "annual-report-writing"] },
              { name: "Operations & Events", skills: ["volunteer-recruitment", "event-planning", "event-onground-support", "telecalling", "customer-support", "logistics-management"] },
            ],
          }
        },
      }),
    },
    output: Output.object({ schema: searchFiltersSchema }),
    stopWhen: stepCountIs(4),
    prompt: query,
  })

  if (!output) {
    throw new Error("No structured output generated")
  }

  // Validate and filter to only valid IDs
  const validated = {
    skills: (output.skills || []).filter((s: string) => (VALID_SKILLS as readonly string[]).includes(s)),
    causes: (output.causes || []).filter((c: string) => (VALID_CAUSES as readonly string[]).includes(c)),
    workMode: output.workMode && (VALID_WORK_MODES as readonly string[]).includes(output.workMode) ? output.workMode : undefined,
    volunteerType: output.volunteerType && (VALID_VOLUNTEER_TYPES as readonly string[]).includes(output.volunteerType) ? output.volunteerType : undefined,
    location: output.location || undefined,
    minRating: output.minRating && output.minRating >= 1 && output.minRating <= 5 ? output.minRating : undefined,
    maxHourlyRate: output.maxHourlyRate && output.maxHourlyRate > 0 ? output.maxHourlyRate : undefined,
    matchedVolunteerIds: output.matchedVolunteerIds || undefined,
  }

  console.log(`[AI Search Agent] Parsed "${query}" →`, validated)
  return validated
}

function keywordFallback(query: string) {
  const q = query.toLowerCase()
  const filters: { skills: string[]; causes: string[]; workMode?: string; volunteerType?: string } = { skills: [], causes: [] }

  const skillKeywords: Record<string, string[]> = {
    "marketing": ["community-management", "email-marketing", "social-media-ads", "ppc-google-ads", "seo-content", "social-media-strategy", "whatsapp-marketing"],
    "social media": ["social-media-ads", "social-media-strategy", "community-management"],
    "seo": ["seo-content"],
    "ads": ["social-media-ads", "ppc-google-ads"],
    "google": ["ppc-google-ads"],
    "fundrais": ["grant-writing", "grant-research", "corporate-sponsorship", "major-gift-strategy", "peer-to-peer-campaigns", "fundraising-pitch-deck"],
    "grant": ["grant-writing", "grant-research"],
    "sponsor": ["corporate-sponsorship"],
    "website": ["wordpress-development", "ux-ui", "html-css", "website-security", "cms-maintenance", "website-redesign", "landing-page-optimization"],
    "web design": ["ux-ui", "wordpress-development", "website-redesign"],
    "wordpress": ["wordpress-development"],
    "ui": ["ux-ui"],
    "ux": ["ux-ui"],
    "design": ["ux-ui", "graphic-design", "website-redesign"],
    "finance": ["bookkeeping", "budgeting-forecasting", "payroll-processing", "financial-reporting", "accounting-software"],
    "accounting": ["bookkeeping", "accounting-software", "financial-reporting"],
    "budget": ["budgeting-forecasting"],
    "payroll": ["payroll-processing"],
    "photo": ["photography", "photo-editing"],
    "video": ["videography", "video-editing", "motion-graphics"],
    "editing": ["video-editing", "photo-editing"],
    "graphic": ["graphic-design", "motion-graphics"],
    "content": ["email-copywriting", "impact-story-writing", "annual-report-writing", "seo-content"],
    "writing": ["grant-writing", "email-copywriting", "impact-story-writing", "annual-report-writing", "press-release"],
    "copy": ["email-copywriting"],
    "event": ["event-planning", "event-onground-support"],
    "planning": ["event-planning"],
    "support": ["customer-support", "event-onground-support"],
    "volunteer": ["volunteer-recruitment"],
    "logistics": ["logistics-management"],
    "calling": ["telecalling"],
  }

  const causeKeywords: Record<string, string[]> = {
    "education": ["education"],
    "school": ["education"],
    "teach": ["education"],
    "health": ["healthcare"],
    "medical": ["healthcare"],
    "hospital": ["healthcare"],
    "environment": ["environment"],
    "climate": ["environment"],
    "green": ["environment"],
    "poverty": ["poverty-alleviation"],
    "hunger": ["poverty-alleviation"],
    "women": ["women-empowerment"],
    "gender": ["women-empowerment"],
    "child": ["child-welfare"],
    "kids": ["child-welfare"],
    "animal": ["animal-welfare"],
    "pet": ["animal-welfare"],
    "disaster": ["disaster-relief"],
    "relief": ["disaster-relief"],
    "rights": ["human-rights"],
    "art": ["arts-culture"],
    "culture": ["arts-culture"],
    "music": ["arts-culture"],
    "elder": ["senior-citizens"],
    "senior": ["senior-citizens"],
    "disabil": ["disability-support"],
    "accessib": ["disability-support"],
  }

  for (const [keyword, skills] of Object.entries(skillKeywords)) {
    if (q.includes(keyword)) {
      filters.skills.push(...skills)
    }
  }

  for (const [keyword, causes] of Object.entries(causeKeywords)) {
    if (q.includes(keyword)) {
      filters.causes.push(...causes)
    }
  }

  filters.skills = [...new Set(filters.skills)]
  filters.causes = [...new Set(filters.causes)]

  if (q.includes("remote")) filters.workMode = "remote"
  else if (q.includes("onsite") || q.includes("on-site") || q.includes("in person")) filters.workMode = "onsite"
  else if (q.includes("hybrid")) filters.workMode = "hybrid"

  if (q.includes("free") || q.includes("pro bono") || q.includes("probono")) filters.volunteerType = "free"
  else if (q.includes("paid")) filters.volunteerType = "paid"

  console.log(`[AI Search] Keyword fallback for "${query}" →`, filters)
  return filters
}
