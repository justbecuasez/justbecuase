import { NextRequest, NextResponse } from "next/server"
import { generateText, Output } from "ai"
import { google } from "@ai-sdk/google"
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

// Schema for the AI to parse the query
const queryParseSchema = z.object({
  skills: z.array(z.string()).describe("Matching skill IDs from the platform's available skills list. Be generous — include ALL semantically related skills."),
  causes: z.array(z.string()).describe("Matching cause IDs if the user mentions a cause area"),
  workMode: z.string().nullable().describe("Work mode filter: 'remote', 'onsite', or 'hybrid'. null if not mentioned."),
  volunteerType: z.string().nullable().describe("Volunteer type: 'free' for pro-bono/free, 'paid' for paid volunteers, 'both' for either. null if not mentioned."),
  location: z.string().nullable().describe("City or country name if the user mentions a geographic location (e.g., 'dubai', 'india', 'new york'). null if not mentioned."),
  minRating: z.number().nullable().describe("Minimum rating 1-5 if the user mentions quality/top/best. null if not mentioned."),
  maxHourlyRate: z.number().nullable().describe("Maximum hourly rate budget if mentioned. null if not mentioned."),
  maxHoursPerWeek: z.number().nullable().describe("Maximum hours per week if the user specifies availability/hours. null if not mentioned."),
  searchIntent: z.string().describe("A brief description of what the user is looking for, in plain English."),
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

    // If no Gemini key, fall back to keyword matching
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.log("[AI Search] No Google Gemini API key, using keyword fallback")
      const result = await keywordFallbackWithDB(query)
      return NextResponse.json({ success: true, data: result, method: "keyword" })
    }

    try {
      const result = await searchWithAgent(query)
      return NextResponse.json({ success: true, data: result, method: "ai-agent" })
    } catch (aiError) {
      console.error("[AI Search] AI agent failed, using keyword fallback:", aiError)
      const result = await keywordFallbackWithDB(query)
      return NextResponse.json({ success: true, data: result, method: "keyword" })
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

  // Step 1: Use AI to parse the natural language query into structured filters
  const { output: parsedFilters } = await generateText({
    model: google("gemini-2.5-flash"),
    temperature: 0,
    system: `You are a search query parser. Your ONLY job is to extract structured filters from the user's EXACT query text.

RULES:
1. ONLY extract information that is EXPLICITLY written in the query. NEVER add, infer, or hallucinate any information not present.
2. For location: extract the EXACT city/country name written in the query, in lowercase. If the query says "in mysore", location must be "mysore". If the query says "in delhi", location must be "delhi". If no location is mentioned, set null.
3. For skills: map to the closest matching skill IDs from the list below.
4. Set null for any field NOT mentioned in the query.

AVAILABLE SKILL IDs (use ONLY these exact IDs):
${VALID_SKILLS.join(", ")}

AVAILABLE CAUSE IDs (use ONLY these exact IDs):
${VALID_CAUSES.join(", ")}

SKILL MAPPING — include ALL semantically related skills:
- "SEO" or "seo expert" → ["seo-content"]
- "email marketing" → ["email-marketing"]
- "marketing" → ["community-management", "email-marketing", "social-media-ads", "ppc-google-ads", "seo-content", "social-media-strategy", "whatsapp-marketing"]
- "website" or "web developer" → ["ux-ui", "wordpress-development", "website-redesign", "html-css"]
- "video" → ["videography", "video-editing", "motion-graphics"]
- "writer" → ["email-copywriting", "press-release", "impact-story-writing", "annual-report-writing", "donor-communications"]
- "graphic designer" → ["graphic-design", "ux-ui"]
- "fundraising" → ["grant-writing", "grant-research", "corporate-sponsorship", "major-gift-strategy", "peer-to-peer-campaigns", "fundraising-pitch-deck"]
- "photographer" → ["photography", "photo-editing"]

OTHER FILTERS:
- "remote" → workMode: "remote"
- "free" or "pro bono" → volunteerType: "free"
- "paid" → volunteerType: "paid"
- "four hours" or "4 hours" → maxHoursPerWeek: 4

CRITICAL: Do NOT invent locations, skills, or any other data that is not in the user's query.`,
    output: Output.object({
      schema: queryParseSchema,
      name: "SearchFilters",
      description: "Structured search filters parsed from the user's natural language query",
    }),
    prompt: `Parse this search query. Extract ONLY what is explicitly written: "${query}"`,
  })

  if (!parsedFilters) {
    throw new Error("No structured output generated from AI")
  }

  // Step 2: Validate parsed filters to only include valid IDs
  const validatedSkills = (parsedFilters.skills || []).filter((s: string) => (VALID_SKILLS as readonly string[]).includes(s))
  const validatedCauses = (parsedFilters.causes || []).filter((c: string) => (VALID_CAUSES as readonly string[]).includes(c))
  const validatedWorkMode = parsedFilters.workMode && (VALID_WORK_MODES as readonly string[]).includes(parsedFilters.workMode) ? parsedFilters.workMode : null
  const validatedVolunteerType = parsedFilters.volunteerType && (VALID_VOLUNTEER_TYPES as readonly string[]).includes(parsedFilters.volunteerType) ? parsedFilters.volunteerType : null
  const validatedLocation = parsedFilters.location || null

  console.log(`[AI Search] Parsed "${query}" → skills: [${validatedSkills}], location: ${validatedLocation}, type: ${validatedVolunteerType}, workMode: ${validatedWorkMode}`)

  // Step 3: Tiered DB search — try strict first, then relax filters if 0 results
  const dbFilters = {
    skills: validatedSkills,
    location: validatedLocation,
    volunteerType: validatedVolunteerType,
    workMode: validatedWorkMode,
    maxHourlyRate: parsedFilters.maxHourlyRate,
    minRating: parsedFilters.minRating,
    maxHoursPerWeek: parsedFilters.maxHoursPerWeek,
  }

  // Tier 1: Try with ALL filters
  let matchedVolunteerIds = await searchVolunteersInDB(db, dbFilters)
  console.log(`[AI Search] Tier 1 (all filters): ${matchedVolunteerIds.length} matches`)

  // Tier 2: If 0 results and we have both skills + location, try skills only
  if (matchedVolunteerIds.length === 0 && validatedSkills.length > 0 && validatedLocation) {
    matchedVolunteerIds = await searchVolunteersInDB(db, {
      ...dbFilters,
      location: null, // drop location filter
    })
    console.log(`[AI Search] Tier 2 (skills only, no location): ${matchedVolunteerIds.length} matches`)
  }

  // Tier 3: If still 0 and we have location but no skills matched, try location only
  if (matchedVolunteerIds.length === 0 && validatedLocation && validatedSkills.length === 0) {
    matchedVolunteerIds = await searchVolunteersInDB(db, {
      ...dbFilters,
      skills: [],
    })
    console.log(`[AI Search] Tier 3 (location only): ${matchedVolunteerIds.length} matches`)
  }

  console.log(`[AI Search] Final: ${matchedVolunteerIds.length} matching volunteers`)

  return {
    skills: validatedSkills,
    causes: validatedCauses,
    workMode: validatedWorkMode,
    volunteerType: validatedVolunteerType,
    location: validatedLocation,
    minRating: parsedFilters.minRating && parsedFilters.minRating >= 1 && parsedFilters.minRating <= 5 ? parsedFilters.minRating : null,
    maxHourlyRate: parsedFilters.maxHourlyRate && parsedFilters.maxHourlyRate > 0 ? parsedFilters.maxHourlyRate : null,
    maxHoursPerWeek: parsedFilters.maxHoursPerWeek && parsedFilters.maxHoursPerWeek > 0 ? parsedFilters.maxHoursPerWeek : null,
    matchedVolunteerIds,
    searchIntent: parsedFilters.searchIntent || "",
  }
}

// Server-side DB search using parsed AI filters
async function searchVolunteersInDB(
  db: ReturnType<typeof client.db>,
  filters: {
    skills: string[]
    location: string | null
    volunteerType: string | null
    workMode: string | null
    maxHourlyRate: number | null | undefined
    minRating: number | null | undefined
    maxHoursPerWeek: number | null | undefined
  }
): Promise<string[]> {
  try {
    const mongoFilter: Record<string, unknown> = {}
    const conditions: Record<string, unknown>[] = []

    // Filter by skills (OR match — volunteer has ANY of the requested skills)
    if (filters.skills.length > 0) {
      conditions.push({ "skills.subskillId": { $in: filters.skills } })
    }

    // Filter by location (case-insensitive regex on location, city, and country)
    if (filters.location) {
      conditions.push({
        $or: [
          { location: { $regex: filters.location, $options: "i" } },
          { city: { $regex: filters.location, $options: "i" } },
          { country: { $regex: filters.location, $options: "i" } },
        ],
      })
    }

    // Filter by volunteer type
    if (filters.volunteerType && filters.volunteerType !== "both") {
      conditions.push({
        $or: [
          { volunteerType: filters.volunteerType },
          { volunteerType: "both" },
        ],
      })
    }

    // Filter by max hourly rate
    if (filters.maxHourlyRate && filters.maxHourlyRate > 0) {
      conditions.push({
        $or: [
          { hourlyRate: { $lte: filters.maxHourlyRate } },
          { hourlyRate: { $exists: false } },
          { volunteerType: "free" },
        ],
      })
    }

    // Filter by min rating
    if (filters.minRating && filters.minRating > 0) {
      conditions.push({ rating: { $gte: filters.minRating } })
    }

    // Build final filter: ALL conditions must match (AND)
    if (conditions.length > 0) {
      mongoFilter.$and = conditions
    }

    // All volunteer data is in the "user" collection now
    const volunteers = await db
      .collection("user")
      .find({ ...mongoFilter, role: "volunteer" })
      .project({ _id: 1 })
      .limit(50)
      .toArray()

    return volunteers.map(v => v._id.toString()).filter(Boolean)
  } catch (err) {
    console.error("[AI Search] DB search failed:", err)
    return []
  }
}

async function keywordFallbackWithDB(query: string) {
  const q = query.toLowerCase()
  const skills: string[] = []
  const causes: string[] = []
  let workMode: string | null = null
  let volunteerType: string | null = null
  let location: string | null = null

  const skillKeywords: Record<string, string[]> = {
    "marketing": ["community-management", "email-marketing", "social-media-ads", "ppc-google-ads", "seo-content", "social-media-strategy", "whatsapp-marketing"],
    "social media": ["social-media-ads", "social-media-strategy", "community-management"],
    "seo": ["seo-content"],
    "email-marketing": ["email-marketing"],
    "email marketing": ["email-marketing"],
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

  for (const [keyword, matchedSkills] of Object.entries(skillKeywords)) {
    if (q.includes(keyword)) {
      skills.push(...matchedSkills)
    }
  }

  for (const [keyword, matchedCauses] of Object.entries(causeKeywords)) {
    if (q.includes(keyword)) {
      causes.push(...matchedCauses)
    }
  }

  const uniqueSkills = [...new Set(skills)]
  const uniqueCauses = [...new Set(causes)]

  if (q.includes("remote")) workMode = "remote"
  else if (q.includes("onsite") || q.includes("on-site") || q.includes("in person")) workMode = "onsite"
  else if (q.includes("hybrid")) workMode = "hybrid"

  if (q.includes("free") || q.includes("pro bono") || q.includes("probono")) volunteerType = "free"
  else if (q.includes("paid")) volunteerType = "paid"

  // Extract location keywords from common city names in query
  const locationPatterns = ["dubai", "mumbai", "delhi", "bangalore", "hyderabad", "chennai", "kolkata", "pune", "jaipur", "ahmedabad", "new york", "london", "singapore"]
  for (const loc of locationPatterns) {
    if (q.includes(loc)) {
      location = loc
      break
    }
  }

  // Search DB with keyword-extracted filters
  const db = client.db("justbecause")
  const matchedVolunteerIds = await searchVolunteersInDB(db, {
    skills: uniqueSkills,
    location,
    volunteerType,
    workMode,
    maxHourlyRate: null,
    minRating: null,
    maxHoursPerWeek: null,
  })

  console.log(`[AI Search] Keyword fallback for "${query}" → skills: [${uniqueSkills}], location: ${location}, matched: ${matchedVolunteerIds.length}`)

  return {
    skills: uniqueSkills,
    causes: uniqueCauses,
    workMode,
    volunteerType,
    location,
    minRating: null,
    maxHourlyRate: null,
    maxHoursPerWeek: null,
    matchedVolunteerIds,
    searchIntent: query,
  }
}
