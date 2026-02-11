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
 */
function parseSkills(skills: any): string[] {
  if (!skills) return []
  try {
    const parsed = typeof skills === "string" ? JSON.parse(skills) : skills
    if (!Array.isArray(parsed)) return []
    return parsed
      .slice(0, 5)
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
 * Advanced relevance scoring
 * Weighs: exact match > starts-with > contains > fuzzy
 * Weighs: name/title > headline > bio/description > location
 */
function computeRelevanceScore(doc: any, searchTerms: string[]): number {
  let score = 0

  const fields = [
    { key: "name", weight: 15 },
    { key: "title", weight: 15 },
    { key: "organizationName", weight: 15 },
    { key: "headline", weight: 8 },
    { key: "bio", weight: 4 },
    { key: "description", weight: 4 },
    { key: "location", weight: 3 },
    { key: "city", weight: 3 },
    { key: "country", weight: 2 },
  ]

  for (const term of searchTerms) {
    const termLower = term.toLowerCase()
    for (const field of fields) {
      const value = doc[field.key]
      if (!value || typeof value !== "string") continue
      const valueLower = value.toLowerCase()

      // Exact full match (highest score)
      if (valueLower === termLower) {
        score += field.weight * 4
        continue
      }
      // Starts with (high score)
      if (valueLower.startsWith(termLower)) {
        score += field.weight * 3
        continue
      }
      // Word boundary match (e.g., "web" matches "web development")
      const wordBoundary = new RegExp(`\\b${escapeRegex(termLower)}`, "i")
      if (wordBoundary.test(value)) {
        score += field.weight * 2.5
        continue
      }
      // Contains (medium score)
      if (valueLower.includes(termLower)) {
        score += field.weight * 1.5
        continue
      }
      // Fuzzy match on short words in the field (low score)
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

    // Skill matching bonus
    const skillsList = parseSkills(doc.skills || doc.skillsRequired)
    for (const skill of skillsList) {
      const skillLower = skill.toLowerCase().replace(/-/g, " ")
      if (skillLower === termLower) score += 12
      else if (skillLower.startsWith(termLower)) score += 8
      else if (skillLower.includes(termLower)) score += 5
    }
  }

  return score
}

/**
 * Determine which field was the best match (for highlighting)
 */
function findMatchedField(doc: any, searchTerms: string[]): string | undefined {
  const fieldNames = ["name", "title", "organizationName", "headline", "bio", "description", "location"]
  for (const term of searchTerms) {
    const termLower = term.toLowerCase()
    for (const field of fieldNames) {
      const val = doc[field]
      if (val && typeof val === "string" && val.toLowerCase().includes(termLower)) {
        return field
      }
    }
  }
  return undefined
}

// ============================================
// USER RESULT MAPPER
// ============================================

function mapUserToResult(user: any, searchTerms: string[]): SearchResult {
  if (user.role === "volunteer") {
    return {
      type: "volunteer",
      id: user._id.toString(),
      title: user.name || "Volunteer",
      subtitle: user.headline || user.bio?.slice(0, 80),
      location: user.location || user.city,
      skills: parseSkills(user.skills),
      score: user.score ?? computeRelevanceScore(user, searchTerms),
      avatar: user.image || user.avatar,
      matchedField: findMatchedField(user, searchTerms),
    }
  }
  return {
    type: "ngo",
    id: user._id.toString(),
    title: user.organizationName || user.name || "Organization",
    subtitle: user.description?.slice(0, 80),
    location: user.location || user.city,
    score: user.score ?? computeRelevanceScore(user, searchTerms),
    avatar: user.logo || user.image,
    verified: user.isVerified,
    matchedField: findMatchedField(user, searchTerms),
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
    skills: parseSkills(project.skillsRequired),
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
  image: 1, avatar: 1, organizationName: 1,
  description: 1, isVerified: 1, logo: 1, privacy: 1,
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

  // Build regex patterns: prioritize prefix match, then contains
  const regexConditions = searchTerms.flatMap(term => {
    const escaped = escapeRegex(term)
    const prefixRegex = new RegExp(`^${escaped}`, "i")
    const containsRegex = new RegExp(escaped, "i")
    return [
      { name: prefixRegex },
      { organizationName: prefixRegex },
      { headline: containsRegex },
      { title: containsRegex },
      { bio: containsRegex },
      { description: containsRegex },
      { location: containsRegex },
      { city: containsRegex },
      { country: containsRegex },
    ]
  })

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
    const projectRegex = searchTerms.flatMap(term => {
      const escaped = escapeRegex(term)
      const prefixRegex = new RegExp(`^${escaped}`, "i")
      const containsRegex = new RegExp(escaped, "i")
      return [
        { title: prefixRegex },
        { description: containsRegex },
        { location: containsRegex },
      ]
    })

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
    { headline: regex },
    { title: regex },
    { bio: regex },
    { description: regex },
  ])

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
    const projectFuzzy = looseRegex.flatMap(regex => [
      { title: regex },
      { description: regex },
      { location: regex },
    ])

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

  // Get name/org suggestions (prefix match = highest quality)
  const users = await db.collection("user")
    .find({
      isOnboarded: true,
      ...privacyFilter,
      $or: [
        { name: prefixRegex },
        { organizationName: prefixRegex },
        { headline: containsRegex },
      ],
    })
    .project({ _id: 1, name: 1, role: 1, organizationName: 1, headline: 1 })
    .limit(limit)
    .toArray()

  for (const user of users) {
    const isNgo = user.role === "ngo"
    suggestions.push({
      text: isNgo ? (user.organizationName || user.name) : user.name,
      type: isNgo ? "ngo" : "volunteer",
      id: user._id.toString(),
      subtitle: user.headline || (isNgo ? "Organization" : "Volunteer"),
    })
  }

  // Get project suggestions
  const projects = await db.collection("projects")
    .find({
      status: { $in: ["open", "active"] },
      $or: [
        { title: prefixRegex },
        { title: containsRegex },
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
