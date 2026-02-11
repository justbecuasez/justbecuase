// ============================================
// MongoDB Search Engine - Amazon-Level Search
// ============================================
// Features:
// - Instant search from 1 character (prefix matching)
// - Fuzzy matching with Levenshtein distance for typo tolerance
// - Multi-strategy: $text → regex prefix → fuzzy fallback
// - Privacy enforcement (showInSearch)
// - Smart scoring with field-weighted relevance
// - Search suggestions/autocomplete support
// - Adaptive limit distribution (fills all slots)
// ============================================

import client from "./db"

const DB_NAME = "justbecause"

// ============================================
// SKILL & CAUSE LOOKUP TABLES
// ============================================
// Since skills are stored as JSON strings with IDs like "email-marketing",
// we need to map human-readable names so searching "email" finds
// volunteers with the "email-marketing" skill.

interface SkillEntry {
  categoryId: string
  categoryName: string
  subskillId: string
  subskillName: string
  /** all searchable terms: "email marketing automation digital-marketing email-marketing" */
  searchableText: string
}

interface CauseEntry {
  id: string
  name: string
}

// Hardcoded from skills-data.tsx (can't import .tsx with JSX in a server lib)
const SKILL_CATEGORIES: { id: string; name: string; subskills: { id: string; name: string }[] }[] = [
  {
    id: "digital-marketing", name: "Digital Marketing",
    subskills: [
      { id: "community-management", name: "Community Management" },
      { id: "email-marketing", name: "Email Marketing / Automation" },
      { id: "social-media-ads", name: "Social Media Ads (Meta Ads / Facebook Ads)" },
      { id: "ppc-google-ads", name: "PPC / Google Ads" },
      { id: "seo-content", name: "SEO / Content" },
      { id: "social-media-strategy", name: "Social Media Strategy" },
      { id: "whatsapp-marketing", name: "WhatsApp Marketing" },
    ],
  },
  {
    id: "fundraising", name: "Fundraising Assistance",
    subskills: [
      { id: "grant-writing", name: "Grant Writing" },
      { id: "grant-research", name: "Grant Research" },
      { id: "corporate-sponsorship", name: "Corporate Sponsorship" },
      { id: "major-gift-strategy", name: "Major Gift Strategy" },
      { id: "peer-to-peer-campaigns", name: "Peer-to-Peer Campaigns" },
      { id: "fundraising-pitch-deck", name: "Fundraising Pitch Deck Support" },
    ],
  },
  {
    id: "website", name: "Website Design & Maintenance",
    subskills: [
      { id: "wordpress-development", name: "WordPress Development" },
      { id: "ux-ui", name: "UX / UI" },
      { id: "html-css", name: "HTML / CSS" },
      { id: "website-security", name: "Website Security" },
      { id: "cms-maintenance", name: "CMS Maintenance" },
      { id: "website-redesign", name: "Website Redesign" },
      { id: "landing-page-optimization", name: "Landing Page Optimization" },
    ],
  },
  {
    id: "finance", name: "Finance & Accounting",
    subskills: [
      { id: "bookkeeping", name: "Bookkeeping" },
      { id: "budgeting-forecasting", name: "Budgeting & Forecasting" },
      { id: "payroll-processing", name: "Payroll Processing" },
      { id: "financial-reporting", name: "Financial Reporting" },
      { id: "accounting-software", name: "Accounting Software (Tally / QuickBooks / Zoho)" },
    ],
  },
  {
    id: "content-creation", name: "Content Creation",
    subskills: [
      { id: "photography", name: "Photography (Event / Documentary)" },
      { id: "videography", name: "Videography / Shooting" },
      { id: "video-editing", name: "Video Editing" },
      { id: "photo-editing", name: "Photo Editing / Retouching" },
      { id: "motion-graphics", name: "Motion Graphics" },
      { id: "graphic-design", name: "Graphic Design" },
    ],
  },
  {
    id: "communication", name: "Communication",
    subskills: [
      { id: "donor-communications", name: "Donor Communications" },
      { id: "email-copywriting", name: "Email Copywriting" },
      { id: "press-release", name: "Press Release" },
      { id: "impact-story-writing", name: "Impact Story Writing" },
      { id: "annual-report-writing", name: "Annual Report Writing" },
    ],
  },
  {
    id: "planning-support", name: "Planning & Support",
    subskills: [
      { id: "volunteer-recruitment", name: "Volunteer Recruitment" },
      { id: "event-planning", name: "Event Planning" },
      { id: "event-onground-support", name: "Event On-Ground Support" },
      { id: "telecalling", name: "Telecalling" },
      { id: "customer-support", name: "Customer Support" },
      { id: "logistics-management", name: "Logistics Management" },
    ],
  },
]

const CAUSE_LIST: CauseEntry[] = [
  { id: "education", name: "Education" },
  { id: "healthcare", name: "Healthcare" },
  { id: "environment", name: "Environment" },
  { id: "poverty-alleviation", name: "Poverty Alleviation" },
  { id: "women-empowerment", name: "Women Empowerment" },
  { id: "child-welfare", name: "Child Welfare" },
  { id: "animal-welfare", name: "Animal Welfare" },
  { id: "disaster-relief", name: "Disaster Relief" },
  { id: "human-rights", name: "Human Rights" },
  { id: "arts-culture", name: "Arts & Culture" },
  { id: "senior-citizens", name: "Senior Citizens" },
  { id: "disability-support", name: "Disability Support" },
]

// Build flat lookup: subskillId → full searchable data
const SKILL_LOOKUP = new Map<string, SkillEntry>()
const ALL_SKILL_ENTRIES: SkillEntry[] = []
for (const cat of SKILL_CATEGORIES) {
  for (const sub of cat.subskills) {
    const entry: SkillEntry = {
      categoryId: cat.id,
      categoryName: cat.name,
      subskillId: sub.id,
      subskillName: sub.name,
      searchableText: `${sub.name} ${cat.name} ${sub.id.replace(/-/g, " ")} ${cat.id.replace(/-/g, " ")}`.toLowerCase(),
    }
    SKILL_LOOKUP.set(sub.id, entry)
    ALL_SKILL_ENTRIES.push(entry)
  }
}

/**
 * Given search terms like ["email"], find all matching skill subskillIds
 * e.g., "email" → ["email-marketing", "email-copywriting"]
 */
function findMatchingSkillIds(searchTerms: string[]): string[] {
  const matchedIds = new Set<string>()
  for (const term of searchTerms) {
    const termLower = term.toLowerCase()
    for (const entry of ALL_SKILL_ENTRIES) {
      if (entry.searchableText.includes(termLower)) {
        matchedIds.add(entry.subskillId)
      }
      // Fuzzy: allow 1 char difference for terms >= 4 chars
      if (termLower.length >= 4) {
        const words = entry.searchableText.split(/\s+/)
        for (const word of words) {
          if (word.length >= 3 && levenshteinDistance(termLower, word) <= Math.floor(termLower.length / 4)) {
            matchedIds.add(entry.subskillId)
            break
          }
        }
      }
    }
  }
  return Array.from(matchedIds)
}

/**
 * Given search terms, find all matching cause IDs
 * e.g., "health" → ["healthcare"], "child" → ["child-welfare"]
 */
function findMatchingCauseIds(searchTerms: string[]): string[] {
  const matchedIds = new Set<string>()
  for (const term of searchTerms) {
    const termLower = term.toLowerCase()
    for (const cause of CAUSE_LIST) {
      const searchable = `${cause.name} ${cause.id.replace(/-/g, " ")}`.toLowerCase()
      if (searchable.includes(termLower)) {
        matchedIds.add(cause.id)
      }
    }
  }
  return Array.from(matchedIds)
}

/**
 * Get human-readable skill name from subskillId
 */
function getSkillDisplayName(subskillId: string): string {
  return SKILL_LOOKUP.get(subskillId)?.subskillName || subskillId.replace(/-/g, " ")
}

/**
 * Get human-readable cause name from causeId
 */
function getCauseDisplayName(causeId: string): string {
  return CAUSE_LIST.find(c => c.id === causeId)?.name || causeId.replace(/-/g, " ")
}

// ============================================
// INDEX MANAGEMENT
// ============================================

let indexesEnsured = false

export async function ensureSearchIndexes(): Promise<void> {
  if (indexesEnsured) return
  try {
    await client.connect()
    const db = client.db(DB_NAME)

    const userCollection = db.collection("user")
    const userIndexes = await userCollection.listIndexes().toArray()
    const hasUserTextIndex = userIndexes.some(idx => idx.name === "user_text_search")

    if (!hasUserTextIndex) {
      await userCollection.createIndex(
        {
          name: "text",
          bio: "text",
          location: "text",
          city: "text",
          country: "text",
          organizationName: "text",
          description: "text",
          headline: "text",
        },
        {
          name: "user_text_search",
          weights: {
            name: 10,
            organizationName: 10,
            headline: 5,
            bio: 3,
            description: 3,
            location: 2,
            city: 2,
            country: 1,
          },
          default_language: "english",
        }
      )
      console.log("[Search] Created text index on user collection")
    }

    // Create regex-friendly indexes for prefix search
    const hasNameIndex = userIndexes.some(idx => idx.key?.name === 1)
    if (!hasNameIndex) {
      await userCollection.createIndex({ name: 1 })
      await userCollection.createIndex({ organizationName: 1 })
    }

    const projectsCollection = db.collection("projects")
    const projectIndexes = await projectsCollection.listIndexes().toArray()
    const hasProjectTextIndex = projectIndexes.some(idx => idx.name === "project_text_search")

    if (!hasProjectTextIndex) {
      await projectsCollection.createIndex(
        {
          title: "text",
          description: "text",
          location: "text",
        },
        {
          name: "project_text_search",
          weights: {
            title: 10,
            description: 5,
            location: 2,
          },
          default_language: "english",
        }
      )
      console.log("[Search] Created text index on projects collection")
    }

    const hasTitleIndex = projectIndexes.some(idx => idx.key?.title === 1)
    if (!hasTitleIndex) {
      await projectsCollection.createIndex({ title: 1 })
    }

    indexesEnsured = true
    console.log("[Search] All search indexes verified")
  } catch (error) {
    console.error("[Search] Failed to create indexes:", error)
  }
}

// ============================================
// TYPES
// ============================================

export interface SearchResult {
  type: "volunteer" | "ngo" | "opportunity"
  id: string
  title: string
  subtitle?: string
  description?: string
  location?: string
  skills?: string[]
  score: number
  avatar?: string
  verified?: boolean
  matchedField?: string // Which field matched (for highlighting)
}

export interface UnifiedSearchParams {
  query: string
  types?: ("volunteer" | "ngo" | "opportunity")[]
  limit?: number
}

export interface SearchSuggestionsParams {
  query: string
  limit?: number
}

export interface SearchSuggestion {
  text: string
  type: "volunteer" | "ngo" | "opportunity"
  id: string
  subtitle?: string
}

// ============================================
// FUZZY / UTILITY HELPERS
// ============================================

/**
 * Escape special regex characters in user input
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Levenshtein distance for typo tolerance
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  const aLen = a.length
  const bLen = b.length

  if (aLen === 0) return bLen
  if (bLen === 0) return aLen

  for (let i = 0; i <= bLen; i++) matrix[i] = [i]
  for (let j = 0; j <= aLen; j++) matrix[0][j] = j

  for (let i = 1; i <= bLen; i++) {
    for (let j = 1; j <= aLen; j++) {
      const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }

  return matrix[bLen][aLen]
}

/**
 * Generate fuzzy regex variants for a search term
 * Allows 1-2 character edits depending on term length
 */
function generateFuzzyPattern(term: string): RegExp {
  if (term.length <= 2) {
    // For very short terms, do prefix match only
    return new RegExp(`^${escapeRegex(term)}`, "i")
  }

  // Build a pattern that allows character transpositions and single-char wildcards
  // e.g., "web" → matches "web", "wbe", "w.b", etc.
  const escaped = escapeRegex(term)
  // Prefix match + contains match
  return new RegExp(`${escaped}`, "i")
}

/**
 * Build privacy-aware base filter
 * Respects showInSearch privacy setting
 */
function buildPrivacyFilter(): Record<string, any> {
  return {
    $or: [
      { "privacy.showInSearch": { $ne: false } }, // Default true if not set
      { privacy: { $exists: false } },            // No privacy settings = visible
    ],
  }
}

/**
 * Parse skills from potentially mixed storage formats
 * Returns subskillIds
 */
function parseSkillIds(skills: any): string[] {
  if (!skills) return []
  try {
    const parsed = typeof skills === "string" ? JSON.parse(skills) : skills
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((s: any) => {
        if (typeof s === "string") return s
        return s.subskillId || s.name || s.label || String(s)
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

/**
 * Parse skills and return human-readable display names (for search result display)
 */
function parseSkillDisplayNames(skills: any): string[] {
  const ids = parseSkillIds(skills)
  return ids.slice(0, 5).map(id => getSkillDisplayName(id))
}

/**
 * Parse causes from JSON-stringified or array format
 */
function parseCauses(causes: any): string[] {
  if (!causes) return []
  try {
    const parsed = typeof causes === "string" ? JSON.parse(causes) : causes
    if (!Array.isArray(parsed)) return []
    return parsed.filter((c: any) => typeof c === "string")
  } catch {
    return []
  }
}

/**
 * Build a searchable text blob from a user's skills (JSON string)
 * Expands IDs into human-readable names so "email" matches "email-marketing"
 */
function buildSkillsSearchText(skills: any): string {
  const ids = parseSkillIds(skills)
  return ids.map(id => {
    const entry = SKILL_LOOKUP.get(id)
    if (entry) return `${entry.subskillName} ${entry.categoryName}`
    return id.replace(/-/g, " ")
  }).join(" ").toLowerCase()
}

/**
 * Build a searchable text blob from causes
 */
function buildCausesSearchText(causes: any): string {
  const ids = parseCauses(causes)
  return ids.map(id => getCauseDisplayName(id)).join(" ").toLowerCase()
}

/**
 * Advanced relevance scoring
 * Weighs: exact match > starts-with > contains > fuzzy
 * Searches ALL profile fields including skills (expanded names), causes,
 * mission, address, orgName, workMode, volunteerType
 */
function computeRelevanceScore(doc: any, searchTerms: string[]): number {
  let score = 0

  // Direct string fields with weights
  const fields = [
    { key: "name", weight: 15 },
    { key: "title", weight: 15 },
    { key: "organizationName", weight: 15 },
    { key: "orgName", weight: 14 },
    { key: "headline", weight: 8 },
    { key: "bio", weight: 4 },
    { key: "description", weight: 4 },
    { key: "mission", weight: 4 },
    { key: "location", weight: 3 },
    { key: "city", weight: 3 },
    { key: "address", weight: 3 },
    { key: "country", weight: 2 },
    { key: "workMode", weight: 2 },
    { key: "volunteerType", weight: 2 },
    { key: "availability", weight: 1 },
    { key: "contactPersonName", weight: 2 },
  ]

  for (const term of searchTerms) {
    const termLower = term.toLowerCase()

    // --- Score direct text fields ---
    for (const field of fields) {
      const value = doc[field.key]
      if (!value || typeof value !== "string") continue
      const valueLower = value.toLowerCase()

      if (valueLower === termLower) {
        score += field.weight * 4
        continue
      }
      if (valueLower.startsWith(termLower)) {
        score += field.weight * 3
        continue
      }
      const wordBoundary = new RegExp(`\\b${escapeRegex(termLower)}`, "i")
      if (wordBoundary.test(value)) {
        score += field.weight * 2.5
        continue
      }
      if (valueLower.includes(termLower)) {
        score += field.weight * 1.5
        continue
      }
      if (termLower.length >= 3) {
        const words = valueLower.split(/\s+/)
        for (const word of words) {
          const dist = levenshteinDistance(termLower, word.slice(0, termLower.length + 2))
          if (dist <= Math.floor(termLower.length / 3)) {
            score += field.weight * 0.8
            break
          }
        }
      }
    }

    // --- Score SKILLS (expanded to human-readable names) ---
    const skillsText = buildSkillsSearchText(doc.skills || doc.skillsRequired)
    if (skillsText) {
      if (skillsText.includes(termLower)) {
        // Check if it's a word-boundary match (stronger)
        const wordBoundary = new RegExp(`\\b${escapeRegex(termLower)}`, "i")
        if (wordBoundary.test(skillsText)) {
          score += 14 // Skill word match = very strong signal
        } else {
          score += 8  // Partial skill match
        }
      } else if (termLower.length >= 3) {
        // Fuzzy on skill text
        const skillWords = skillsText.split(/\s+/)
        for (const word of skillWords) {
          if (word.length >= 3 && levenshteinDistance(termLower, word) <= Math.floor(termLower.length / 3)) {
            score += 6
            break
          }
        }
      }
    }

    // --- Score CAUSES (expanded to names) ---
    const causesText = buildCausesSearchText(doc.causes)
    if (causesText) {
      if (causesText.includes(termLower)) {
        score += 10
      } else if (termLower.length >= 3) {
        const causeWords = causesText.split(/\s+/)
        for (const word of causeWords) {
          if (word.length >= 3 && levenshteinDistance(termLower, word) <= Math.floor(termLower.length / 3)) {
            score += 5
            break
          }
        }
      }
    }
  }

  return score
}

/**
 * Determine which field was the best match (for highlighting)
 */
function findMatchedField(doc: any, searchTerms: string[]): string | undefined {
  const fieldNames = ["name", "title", "organizationName", "orgName", "headline", "bio", "description", "mission", "location", "city", "address", "contactPersonName"]
  for (const term of searchTerms) {
    const termLower = term.toLowerCase()
    for (const field of fieldNames) {
      const val = doc[field]
      if (val && typeof val === "string" && val.toLowerCase().includes(termLower)) {
        return field
      }
    }
    // Check skills
    const skillsText = buildSkillsSearchText(doc.skills || doc.skillsRequired)
    if (skillsText && skillsText.includes(termLower)) return "skills"
    // Check causes
    const causesText = buildCausesSearchText(doc.causes)
    if (causesText && causesText.includes(termLower)) return "causes"
  }
  return undefined
}

// ============================================
// USER RESULT MAPPER
// ============================================

function mapUserToResult(user: any, searchTerms: string[]): SearchResult {
  const matchedField = findMatchedField(user, searchTerms)
  if (user.role === "volunteer") {
    // If skill/cause matched, show that in subtitle for context
    let subtitle = user.headline || user.bio?.slice(0, 80)
    if (matchedField === "skills") {
      const skillNames = parseSkillDisplayNames(user.skills)
      subtitle = skillNames.join(", ") || subtitle
    } else if (matchedField === "causes") {
      const causeIds = parseCauses(user.causes)
      subtitle = causeIds.map(getCauseDisplayName).join(", ") || subtitle
    }
    return {
      type: "volunteer",
      id: user._id.toString(),
      title: user.name || "Volunteer",
      subtitle,
      location: user.location || user.city,
      skills: parseSkillDisplayNames(user.skills),
      score: user.score ?? computeRelevanceScore(user, searchTerms),
      avatar: user.image || user.avatar,
      matchedField,
    }
  }
  let subtitle = user.description?.slice(0, 80)
  if (matchedField === "causes") {
    const causeIds = parseCauses(user.causes)
    subtitle = causeIds.map(getCauseDisplayName).join(", ") || subtitle
  } else if (matchedField === "mission") {
    subtitle = user.mission?.slice(0, 80) || subtitle
  }
  return {
    type: "ngo",
    id: user._id.toString(),
    title: user.organizationName || user.orgName || user.name || "Organization",
    subtitle,
    location: user.location || user.city,
    score: user.score ?? computeRelevanceScore(user, searchTerms),
    avatar: user.logo || user.image,
    verified: user.isVerified,
    matchedField,
  }
}

function mapProjectToResult(project: any, searchTerms: string[]): SearchResult {
  return {
    type: "opportunity",
    id: project._id.toString(),
    title: project.title,
    subtitle: project.workMode === "remote" ? "Remote" : project.location,
    description: project.description?.slice(0, 100),
    location: project.workMode === "remote" ? "Remote" : project.location,
    skills: parseSkillDisplayNames(project.skillsRequired),
    score: project.score ?? computeRelevanceScore(project, searchTerms),
    matchedField: findMatchedField(project, searchTerms),
  }
}

// ============================================
// SEARCH STRATEGIES
// ============================================

const USER_PROJECTION = {
  _id: 1, name: 1, role: 1, bio: 1, headline: 1,
  location: 1, city: 1, country: 1, skills: 1,
  image: 1, avatar: 1, organizationName: 1, orgName: 1,
  description: 1, mission: 1, address: 1,
  causes: 1, workMode: 1, volunteerType: 1,
  availability: 1, contactPersonName: 1,
  isVerified: 1, logo: 1, privacy: 1,
}

/**
 * Strategy 1: MongoDB $text search (best for 3+ word queries)
 */
async function textSearch(
  db: any,
  searchQuery: string,
  types: string[],
  limit: number,
  searchTerms: string[]
): Promise<SearchResult[]> {
  const results: SearchResult[] = []
  const privacyFilter = buildPrivacyFilter()

  if (types.includes("volunteer") || types.includes("ngo")) {
    const roleIn: string[] = []
    if (types.includes("volunteer")) roleIn.push("volunteer")
    if (types.includes("ngo")) roleIn.push("ngo")

    const users = await db.collection("user")
      .find(
        {
          $text: { $search: searchQuery },
          role: { $in: roleIn },
          isOnboarded: true,
          ...privacyFilter,
        },
        { projection: { score: { $meta: "textScore" }, ...USER_PROJECTION } }
      )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .toArray()

    for (const user of users) {
      results.push(mapUserToResult(user, searchTerms))
    }
  }

  if (types.includes("opportunity")) {
    const projects = await db.collection("projects")
      .find(
        {
          $text: { $search: searchQuery },
          status: { $in: ["open", "active"] },
        },
        {
          projection: {
            score: { $meta: "textScore" },
            _id: 1, title: 1, description: 1, location: 1,
            skillsRequired: 1, workMode: 1, timeCommitment: 1,
          },
        }
      )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .toArray()

    for (const project of projects) {
      results.push(mapProjectToResult(project, searchTerms))
    }
  }

  return results
}

/**
 * Strategy 2: Prefix + contains regex search (best for 1-2 char queries)
 * This is what makes Amazon-like instant search possible
 */
async function prefixRegexSearch(
  db: any,
  searchQuery: string,
  types: string[],
  limit: number,
  searchTerms: string[]
): Promise<SearchResult[]> {
  const results: SearchResult[] = []
  const privacyFilter = buildPrivacyFilter()

  // Build regex patterns for all searchable text fields
  const regexConditions = searchTerms.flatMap(term => {
    const escaped = escapeRegex(term)
    const prefixRegex = new RegExp(`^${escaped}`, "i")
    const containsRegex = new RegExp(escaped, "i")
    return [
      { name: prefixRegex },
      { organizationName: prefixRegex },
      { orgName: prefixRegex },
      { headline: containsRegex },
      { title: containsRegex },
      { bio: containsRegex },
      { description: containsRegex },
      { mission: containsRegex },
      { location: containsRegex },
      { city: containsRegex },
      { country: containsRegex },
      { address: containsRegex },
      { contactPersonName: containsRegex },
      // Skills are JSON strings — search inside the raw string
      // e.g. "email" will match '{"subskillId":"email-marketing"...}'
      { skills: containsRegex },
      // Causes are also JSON strings
      { causes: containsRegex },
    ]
  })

  // Also find matching skill/cause IDs from human-readable names
  const matchedSkillIds = findMatchingSkillIds(searchTerms)
  const matchedCauseIds = findMatchingCauseIds(searchTerms)

  // Add skill ID conditions (e.g., "email" → search for "email-marketing" in skills JSON)
  for (const skillId of matchedSkillIds) {
    regexConditions.push({ skills: new RegExp(escapeRegex(skillId), "i") })
  }
  for (const causeId of matchedCauseIds) {
    regexConditions.push({ causes: new RegExp(escapeRegex(causeId), "i") })
  }

  if (types.includes("volunteer") || types.includes("ngo")) {
    const roleIn: string[] = []
    if (types.includes("volunteer")) roleIn.push("volunteer")
    if (types.includes("ngo")) roleIn.push("ngo")

    const users = await db.collection("user")
      .find({
        role: { $in: roleIn },
        isOnboarded: true,
        ...privacyFilter,
        $or: regexConditions,
      })
      .project(USER_PROJECTION)
      .limit(limit)
      .toArray()

    for (const user of users) {
      user.score = computeRelevanceScore(user, searchTerms)
      results.push(mapUserToResult(user, searchTerms))
    }
  }

  if (types.includes("opportunity")) {
    const projectRegex: any[] = searchTerms.flatMap(term => {
      const escaped = escapeRegex(term)
      const prefixRegex = new RegExp(`^${escaped}`, "i")
      const containsRegex = new RegExp(escaped, "i")
      return [
        { title: prefixRegex },
        { description: containsRegex },
        { location: containsRegex },
        { skillsRequired: containsRegex },
      ]
    })

    // Also match skill IDs in project skillsRequired
    for (const skillId of matchedSkillIds) {
      projectRegex.push({ skillsRequired: new RegExp(escapeRegex(skillId), "i") })
    }

    const projects = await db.collection("projects")
      .find({
        status: { $in: ["open", "active"] },
        $or: projectRegex,
      })
      .project({
        _id: 1, title: 1, description: 1, location: 1,
        skillsRequired: 1, workMode: 1, timeCommitment: 1,
      })
      .limit(limit)
      .toArray()

    for (const project of projects) {
      project.score = computeRelevanceScore(project, searchTerms)
      results.push(mapProjectToResult(project, searchTerms))
    }
  }

  return results
}

/**
 * Strategy 3: Fuzzy search with Levenshtein tolerance (catches typos)
 * Used as final fallback to avoid "no results"
 */
async function fuzzyFallbackSearch(
  db: any,
  searchQuery: string,
  types: string[],
  limit: number,
  searchTerms: string[]
): Promise<SearchResult[]> {
  const results: SearchResult[] = []
  const privacyFilter = buildPrivacyFilter()

  // Build loose regex: allow any single char substitution
  const looseRegex = searchTerms.map(term => {
    if (term.length < 2) return new RegExp(escapeRegex(term), "i")
    // For each position, allow a wildcard character
    const chars = term.split("")
    const variants: string[] = []
    for (let i = 0; i < chars.length; i++) {
      const variant = [...chars]
      variant[i] = "."
      variants.push(variant.join(""))
    }
    // Also add the original and remove each char
    variants.push(escapeRegex(term))
    for (let i = 0; i < chars.length; i++) {
      const variant = [...chars]
      variant.splice(i, 1)
      variants.push(variant.join(""))
    }
    return new RegExp(variants.join("|"), "i")
  })

  const fuzzyConditions = looseRegex.flatMap(regex => [
    { name: regex },
    { organizationName: regex },
    { orgName: regex },
    { headline: regex },
    { title: regex },
    { bio: regex },
    { description: regex },
    { mission: regex },
    { location: regex },
    { city: regex },
    { address: regex },
    { skills: regex },      // JSON string — fuzzy inside raw text
    { causes: regex },
    { contactPersonName: regex },
  ])

  // Also add fuzzy-matched skill/cause IDs
  const matchedSkillIds = findMatchingSkillIds(searchTerms)
  const matchedCauseIds = findMatchingCauseIds(searchTerms)
  for (const skillId of matchedSkillIds) {
    fuzzyConditions.push({ skills: new RegExp(escapeRegex(skillId), "i") })
  }
  for (const causeId of matchedCauseIds) {
    fuzzyConditions.push({ causes: new RegExp(escapeRegex(causeId), "i") })
  }

  if (types.includes("volunteer") || types.includes("ngo")) {
    const roleIn: string[] = []
    if (types.includes("volunteer")) roleIn.push("volunteer")
    if (types.includes("ngo")) roleIn.push("ngo")

    const users = await db.collection("user")
      .find({
        role: { $in: roleIn },
        isOnboarded: true,
        ...privacyFilter,
        $or: fuzzyConditions,
      })
      .project(USER_PROJECTION)
      .limit(limit)
      .toArray()

    // Re-score with Levenshtein to rank properly
    for (const user of users) {
      user.score = computeRelevanceScore(user, searchTerms) * 0.7 // Fuzzy results scored lower
      results.push(mapUserToResult(user, searchTerms))
    }
  }

  if (types.includes("opportunity")) {
    const projectFuzzy: any[] = looseRegex.flatMap(regex => [
      { title: regex },
      { description: regex },
      { location: regex },
      { skillsRequired: regex },
    ])

    // Also add skill ID matches for projects
    for (const skillId of matchedSkillIds) {
      projectFuzzy.push({ skillsRequired: new RegExp(escapeRegex(skillId), "i") })
    }

    const projects = await db.collection("projects")
      .find({
        status: { $in: ["open", "active"] },
        $or: projectFuzzy,
      })
      .project({
        _id: 1, title: 1, description: 1, location: 1,
        skillsRequired: 1, workMode: 1, timeCommitment: 1,
      })
      .limit(limit)
      .toArray()

    for (const project of projects) {
      project.score = computeRelevanceScore(project, searchTerms) * 0.7
      results.push(mapProjectToResult(project, searchTerms))
    }
  }

  return results
}

// ============================================
// MAIN SEARCH FUNCTION (Multi-Strategy)
// ============================================

export async function unifiedSearch(params: UnifiedSearchParams): Promise<SearchResult[]> {
  const { query, types = ["volunteer", "ngo", "opportunity"], limit = 20 } = params

  const trimmed = query?.trim()
  if (!trimmed || trimmed.length < 1) return []

  // Ensure indexes exist (no-op after first call)
  await ensureSearchIndexes()

  await client.connect()
  const db = client.db(DB_NAME)

  const searchTerms = trimmed.toLowerCase().split(/\s+/).filter(Boolean)
  const resultMap = new Map<string, SearchResult>() // Deduplicate by id

  const addResults = (results: SearchResult[]) => {
    for (const result of results) {
      const key = `${result.type}-${result.id}`
      const existing = resultMap.get(key)
      if (!existing || result.score > existing.score) {
        resultMap.set(key, result)
      }
    }
  }

  try {
    // Strategy 1: For queries with 3+ chars, try $text search first (fastest, uses index)
    if (trimmed.length >= 3) {
      try {
        const textResults = await textSearch(db, trimmed, types, limit, searchTerms)
        addResults(textResults)
      } catch (error: any) {
        // Text index missing — that's fine, we'll use regex
        if (error.code !== 27 && !error.message?.includes("text index")) {
          console.error("[Search] Text search error:", error)
        }
      }
    }

    // Strategy 2: Prefix/regex search (works from 1 character)
    // Always run this for short queries, or to supplement text search
    if (resultMap.size < limit) {
      const prefixResults = await prefixRegexSearch(db, trimmed, types, limit, searchTerms)
      addResults(prefixResults)
    }

    // Strategy 3: Fuzzy fallback (only if we still have very few results)
    if (resultMap.size < Math.min(3, limit) && trimmed.length >= 3) {
      const fuzzyResults = await fuzzyFallbackSearch(db, trimmed, types, limit, searchTerms)
      addResults(fuzzyResults)
    }

    // Sort by score descending, then slice to limit
    const allResults = Array.from(resultMap.values())
    allResults.sort((a, b) => b.score - a.score)

    return allResults.slice(0, limit)
  } catch (error: any) {
    console.error("[Search] Unrecoverable error:", error)
    // Last resort: try pure regex
    try {
      return await prefixRegexSearch(db, trimmed, types, limit, searchTerms)
    } catch {
      return []
    }
  }
}

// ============================================
// SEARCH SUGGESTIONS (Autocomplete)
// ============================================

export async function getSearchSuggestions(params: SearchSuggestionsParams): Promise<SearchSuggestion[]> {
  const { query, limit = 8 } = params
  const trimmed = query?.trim()
  if (!trimmed || trimmed.length < 1) return []

  await client.connect()
  const db = client.db(DB_NAME)

  const escaped = escapeRegex(trimmed)
  const prefixRegex = new RegExp(`^${escaped}`, "i")
  const containsRegex = new RegExp(escaped, "i")
  const privacyFilter = buildPrivacyFilter()
  const suggestions: SearchSuggestion[] = []

  // Find matching skills/causes for query (e.g., "email" → ["email-marketing", "email-copywriting"])
  const matchedSkillIds = findMatchingSkillIds([trimmed.toLowerCase()])
  const matchedCauseIds = findMatchingCauseIds([trimmed.toLowerCase()])

  // Build user query: search in name, org, headline, skills, causes, location, city
  const userOrConditions: any[] = [
    { name: prefixRegex },
    { organizationName: prefixRegex },
    { orgName: prefixRegex },
    { headline: containsRegex },
    { bio: containsRegex },
    { location: containsRegex },
    { city: containsRegex },
    { skills: containsRegex },
    { causes: containsRegex },
    { mission: containsRegex },
  ]
  for (const skillId of matchedSkillIds) {
    userOrConditions.push({ skills: new RegExp(escapeRegex(skillId), "i") })
  }
  for (const causeId of matchedCauseIds) {
    userOrConditions.push({ causes: new RegExp(escapeRegex(causeId), "i") })
  }

  const users = await db.collection("user")
    .find({
      isOnboarded: true,
      ...privacyFilter,
      $or: userOrConditions,
    })
    .project({ _id: 1, name: 1, role: 1, organizationName: 1, orgName: 1, headline: 1, skills: 1, causes: 1, location: 1, city: 1 })
    .limit(limit)
    .toArray()

  for (const user of users) {
    const isNgo = user.role === "ngo"
    // Build a smart subtitle based on what matched
    let subtitle = user.headline || (isNgo ? "Organization" : "Volunteer")
    // If a skill matched, show it
    const skillsText = buildSkillsSearchText(user.skills)
    if (skillsText && skillsText.includes(trimmed.toLowerCase())) {
      const matchedDisplayNames = parseSkillDisplayNames(user.skills)
        .filter(name => name.toLowerCase().includes(trimmed.toLowerCase()))
      if (matchedDisplayNames.length > 0) subtitle = matchedDisplayNames.join(", ")
    }
    // If a cause matched, show it
    const causesText = buildCausesSearchText(user.causes)
    if (causesText && causesText.includes(trimmed.toLowerCase())) {
      const causeIds = parseCauses(user.causes)
      const matchedCauses = causeIds
        .map(getCauseDisplayName)
        .filter(name => name.toLowerCase().includes(trimmed.toLowerCase()))
      if (matchedCauses.length > 0) subtitle = matchedCauses.join(", ")
    }

    suggestions.push({
      text: isNgo ? (user.organizationName || user.orgName || user.name) : user.name,
      type: isNgo ? "ngo" : "volunteer",
      id: user._id.toString(),
      subtitle,
    })
  }

  // Add skill-name suggestions (e.g., typing "email" suggests "Email Marketing" as a search term)
  if (suggestions.length < limit) {
    for (const entry of ALL_SKILL_ENTRIES) {
      if (suggestions.length >= limit) break
      if (entry.subskillName.toLowerCase().includes(trimmed.toLowerCase()) ||
          entry.categoryName.toLowerCase().includes(trimmed.toLowerCase())) {
        // Avoid duplicate text
        if (!suggestions.some(s => s.text === entry.subskillName)) {
          suggestions.push({
            text: entry.subskillName,
            type: "volunteer",
            id: `skill:${entry.subskillId}`,
            subtitle: entry.categoryName,
          })
        }
      }
    }
  }

  // Get project suggestions (search title, description, location)
  const projects = await db.collection("projects")
    .find({
      status: { $in: ["open", "active"] },
      $or: [
        { title: prefixRegex },
        { title: containsRegex },
        { description: containsRegex },
        { location: containsRegex },
      ],
    })
    .project({ _id: 1, title: 1, location: 1, workMode: 1 })
    .limit(Math.max(2, limit - suggestions.length))
    .toArray()

  for (const project of projects) {
    suggestions.push({
      text: project.title,
      type: "opportunity",
      id: project._id.toString(),
      subtitle: project.workMode === "remote" ? "Remote" : project.location,
    })
  }

  return suggestions.slice(0, limit)
}
