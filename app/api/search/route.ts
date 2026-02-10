import { NextRequest, NextResponse } from "next/server"

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

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
]

const VALID_CAUSES = [
  "education", "healthcare", "environment", "poverty-alleviation",
  "women-empowerment", "child-welfare", "animal-welfare", "disaster-relief",
  "human-rights", "arts-culture", "senior-citizens", "disability-support",
]

const VALID_WORK_MODES = ["remote", "onsite", "hybrid"]
const VALID_VOLUNTEER_TYPES = ["free", "paid", "both"]

interface ParsedSearchFilters {
  skills: string[]
  causes: string[]
  workMode?: string
  volunteerType?: string
  location?: string
  minRating?: number
  maxHourlyRate?: number
}

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
    if (!OPENAI_API_KEY) {
      console.log("[AI Search] No OpenAI API key, using keyword fallback")
      const filters = keywordFallback(query)
      return NextResponse.json({ success: true, data: filters, method: "keyword" })
    }

    try {
      const filters = await parseWithOpenAI(query)
      return NextResponse.json({ success: true, data: filters, method: "ai" })
    } catch (aiError) {
      console.error("[AI Search] OpenAI failed, using keyword fallback:", aiError)
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

async function parseWithOpenAI(query: string): Promise<ParsedSearchFilters> {
  const systemPrompt = `You are a search query parser for a volunteer marketplace platform called JustBeCause Network. 
Parse the user's natural language search query into structured filters.

Available skill IDs: ${VALID_SKILLS.join(", ")}
Available cause IDs: ${VALID_CAUSES.join(", ")}
Available work modes: ${VALID_WORK_MODES.join(", ")}
Available volunteer types: ${VALID_VOLUNTEER_TYPES.join(", ")}

Return a JSON object with these optional fields:
- skills: array of matching skill IDs (match semantically, e.g. "website design" → "ux-ui", "wordpress-development")
- causes: array of matching cause IDs
- workMode: one of the valid work modes
- volunteerType: one of the valid volunteer types  
- location: city or country name if mentioned
- minRating: minimum rating (1-5) if quality/experience is mentioned
- maxHourlyRate: max hourly rate if budget is mentioned

Only include fields that are clearly indicated by the query. Be generous with skill matching - if someone says "marketing", include ALL marketing-related skills.

IMPORTANT: Only return valid IDs from the lists above. Return ONLY the JSON object, no markdown.`

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
      temperature: 0.1,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error (${response.status}): ${error}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content?.trim()

  if (!content) {
    throw new Error("Empty response from OpenAI")
  }

  // Parse JSON - handle potential markdown wrapping
  let parsed: any
  try {
    const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error(`Failed to parse OpenAI response: ${content}`)
  }

  // Validate and filter to only valid IDs
  const filters: ParsedSearchFilters = {
    skills: (parsed.skills || []).filter((s: string) => VALID_SKILLS.includes(s)),
    causes: (parsed.causes || []).filter((c: string) => VALID_CAUSES.includes(c)),
  }

  if (parsed.workMode && VALID_WORK_MODES.includes(parsed.workMode)) {
    filters.workMode = parsed.workMode
  }
  if (parsed.volunteerType && VALID_VOLUNTEER_TYPES.includes(parsed.volunteerType)) {
    filters.volunteerType = parsed.volunteerType
  }
  if (parsed.location && typeof parsed.location === "string") {
    filters.location = parsed.location
  }
  if (parsed.minRating && typeof parsed.minRating === "number" && parsed.minRating >= 1 && parsed.minRating <= 5) {
    filters.minRating = parsed.minRating
  }
  if (parsed.maxHourlyRate && typeof parsed.maxHourlyRate === "number" && parsed.maxHourlyRate > 0) {
    filters.maxHourlyRate = parsed.maxHourlyRate
  }

  console.log(`[AI Search] Parsed "${query}" →`, filters)
  return filters
}

function keywordFallback(query: string): ParsedSearchFilters {
  const q = query.toLowerCase()
  const filters: ParsedSearchFilters = { skills: [], causes: [] }

  // Simple keyword → skill mapping
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

  // Deduplicate
  filters.skills = [...new Set(filters.skills)]
  filters.causes = [...new Set(filters.causes)]

  // Work mode detection
  if (q.includes("remote")) filters.workMode = "remote"
  else if (q.includes("onsite") || q.includes("on-site") || q.includes("in person")) filters.workMode = "onsite"
  else if (q.includes("hybrid")) filters.workMode = "hybrid"

  // Volunteer type detection
  if (q.includes("free") || q.includes("pro bono") || q.includes("probono")) filters.volunteerType = "free"
  else if (q.includes("paid")) filters.volunteerType = "paid"

  console.log(`[AI Search] Keyword fallback for "${query}" →`, filters)
  return filters
}
