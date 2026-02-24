// ============================================
// Elasticsearch Search Engine
// ============================================
// Provides:
// 1. Hybrid search — BM25 text match + semantic_text for NL understanding
// 2. Autocomplete — Completion suggesters + prefix matching
// 3. Cross-entity search — Volunteers, NGOs, Projects, Blog, Pages
// 4. Filters — workMode, volunteerType, causes, skills, location, etc.
// ============================================

import esClient, { ES_INDEXES, type ESIndexName } from "./elasticsearch"

// ============================================
// TYPES
// ============================================

export interface ESSearchParams {
  query: string
  types?: ("volunteer" | "ngo" | "project" | "blog" | "page")[]
  filters?: {
    workMode?: string
    volunteerType?: string
    causes?: string[]
    skills?: string[]
    location?: string
    experienceLevel?: string
    isVerified?: boolean
    minRating?: number
    maxHourlyRate?: number
    status?: string
  }
  limit?: number
  offset?: number
  sort?: "relevance" | "newest" | "rating"
}

export interface ESSearchResult {
  id: string
  mongoId: string
  type: "volunteer" | "ngo" | "project" | "blog" | "page"
  title: string
  subtitle: string
  description: string
  url: string
  score: number
  highlights: string[]
  metadata: Record<string, any>
}

export interface ESSuggestion {
  text: string
  type: "volunteer" | "ngo" | "project" | "blog" | "page" | "skill" | "cause"
  id: string
  subtitle?: string
  score?: number
}

// ============================================
// TYPE → INDEX MAPPING
// ============================================

const TYPE_TO_INDEX: Record<string, ESIndexName> = {
  volunteer: ES_INDEXES.VOLUNTEERS,
  ngo: ES_INDEXES.NGOS,
  project: ES_INDEXES.PROJECTS,
  blog: ES_INDEXES.BLOG_POSTS,
  page: ES_INDEXES.PAGES,
}

const INDEX_TO_TYPE: Record<string, string> = {
  [ES_INDEXES.VOLUNTEERS]: "volunteer",
  [ES_INDEXES.NGOS]: "ngo",
  [ES_INDEXES.PROJECTS]: "project",
  [ES_INDEXES.BLOG_POSTS]: "blog",
  [ES_INDEXES.PAGES]: "page",
}

// ============================================
// MAIN SEARCH FUNCTION
// ============================================

export async function elasticSearch(params: ESSearchParams): Promise<{
  results: ESSearchResult[]
  total: number
  took: number
}> {
  const { query, types, filters, limit = 20, offset = 0, sort = "relevance" } = params
  const trimmedQuery = query.trim()

  if (!trimmedQuery || trimmedQuery.length < 1) {
    return { results: [], total: 0, took: 0 }
  }

  // Determine which indexes to search
  const targetTypes = types && types.length > 0 ? types : ["volunteer", "ngo", "project", "blog", "page"]
  const indexes = targetTypes.map(t => TYPE_TO_INDEX[t]).filter(Boolean)

  console.log(`[ES Search] query="${trimmedQuery}" types=${JSON.stringify(targetTypes)} indexes=${JSON.stringify(indexes)} limit=${limit} sort=${sort}`)

  if (indexes.length === 0) {
    console.log(`[ES Search] No indexes to search — returning empty`)
    return { results: [], total: 0, took: 0 }
  }

  // Build the query
  const esQuery = buildSearchQuery(trimmedQuery, filters)
  console.log(`[ES Search] Built query:`, JSON.stringify(esQuery).substring(0, 500))

  // Build sort
  const sortConfig = buildSortConfig(sort)

  try {
    const response = await esClient.search({
      index: indexes,
      query: esQuery,
      highlight: {
        fields: {
          name: { number_of_fragments: 1, fragment_size: 150 },
          orgName: { number_of_fragments: 1, fragment_size: 150 },
          title: { number_of_fragments: 1, fragment_size: 150 },
          description: { number_of_fragments: 2, fragment_size: 200 },
          bio: { number_of_fragments: 2, fragment_size: 200 },
          mission: { number_of_fragments: 1, fragment_size: 200 },
          skillNames: { number_of_fragments: 3, fragment_size: 100 },
          causeNames: { number_of_fragments: 3, fragment_size: 100 },
          content: { number_of_fragments: 2, fragment_size: 200 },
          excerpt: { number_of_fragments: 1, fragment_size: 200 },
        },
        pre_tags: ["<mark>"],
        post_tags: ["</mark>"],
      },
      from: offset,
      size: limit,
      sort: sortConfig,
      _source: true,
      track_total_hits: true,
    })

    const total = typeof response.hits.total === "number"
      ? response.hits.total
      : (response.hits.total as any)?.value || 0
    console.log(`[ES Search] Response: ${response.hits.hits.length} hits, total=${total}, took=${response.took}ms`)

    const results: ESSearchResult[] = response.hits.hits.map(hit => {
      const source = hit._source as Record<string, any>
      const indexType = INDEX_TO_TYPE[hit._index] || "page"
      const highlights = Object.values(hit.highlight || {}).flat()

      return {
        ...transformHitToResult(source, indexType, hit._id || ""),
        score: hit._score || 0,
        highlights,
      }
    })

    if (results.length > 0) {
      console.log(`[ES Search] Top result: type=${results[0].type} title="${results[0].title}" score=${results[0].score}`)
    }

    return {
      results,
      total,
      took: response.took || 0,
    }
  } catch (error: any) {
    console.error("[ES Search] Error:", error?.message || error)
    console.error("[ES Search] Full error:", JSON.stringify(error?.meta?.body || {}).substring(0, 500))
    // If semantic_text query fails, fall back to text-only search
    if (error?.message?.includes("semantic_text") || error?.message?.includes("semantic")) {
      console.log("[ES Search] Falling back to text-only search (semantic query failed)")
      return elasticSearchTextOnly(trimmedQuery, indexes, filters, limit, offset, sort)
    }
    throw error
  }
}

// ============================================
// FALLBACK: Text-only search (no semantic)
// ============================================

async function elasticSearchTextOnly(
  query: string,
  indexes: string[],
  filters: ESSearchParams["filters"],
  limit: number,
  offset: number,
  sort: string
): Promise<{ results: ESSearchResult[]; total: number; took: number }> {
  const esQuery = buildTextOnlyQuery(query, filters)
  const sortConfig = buildSortConfig(sort)

  const response = await esClient.search({
    index: indexes,
    query: esQuery,
    highlight: {
      fields: {
        "*": { number_of_fragments: 2, fragment_size: 200 },
      },
      pre_tags: ["<mark>"],
      post_tags: ["</mark>"],
    },
    from: offset,
    size: limit,
    sort: sortConfig,
    _source: true,
  })

  const results: ESSearchResult[] = response.hits.hits.map(hit => {
    const source = hit._source as Record<string, any>
    const indexType = INDEX_TO_TYPE[hit._index] || "page"
    const highlights = Object.values(hit.highlight || {}).flat()

    return {
      ...transformHitToResult(source, indexType, hit._id || ""),
      score: hit._score || 0,
      highlights,
    }
  })

  const total = typeof response.hits.total === "number"
    ? response.hits.total
    : (response.hits.total as any)?.value || 0

  return { results, total, took: response.took || 0 }
}

// ============================================
// AUTOCOMPLETE / SUGGESTIONS
// ============================================

export async function elasticSuggest(params: {
  query: string
  types?: ("volunteer" | "ngo" | "project" | "blog" | "page")[]
  limit?: number
}): Promise<ESSuggestion[]> {
  const { query, types, limit = 8 } = params
  const trimmedQuery = query.trim()

  if (!trimmedQuery || trimmedQuery.length < 1) {
    return []
  }

  const targetTypes = types && types.length > 0 ? types : ["volunteer", "ngo", "project", "blog", "page"]
  const indexes = targetTypes.map(t => TYPE_TO_INDEX[t]).filter(Boolean)

  console.log(`[ES Suggest] query="${trimmedQuery}" types=${JSON.stringify(targetTypes)} indexes=${JSON.stringify(indexes)} limit=${limit}`)

  if (indexes.length === 0) {
    console.log(`[ES Suggest] No indexes — returning empty`)
    return []
  }

  try {
    // Strategy 1: Completion suggester (fastest)
    const completionResults = await getCompletionSuggestions(trimmedQuery, indexes, Math.ceil(limit / 2))
    console.log(`[ES Suggest] Completion got ${completionResults.length} results`)

    // Strategy 2: Prefix search (more comprehensive)
    const prefixResults = await getPrefixSearchSuggestions(trimmedQuery, indexes, limit)
    console.log(`[ES Suggest] Prefix search got ${prefixResults.length} results`)

    // Merge & deduplicate, completion results first (faster)
    const seen = new Set<string>()
    const merged: ESSuggestion[] = []

    for (const item of [...completionResults, ...prefixResults]) {
      const key = `${item.type}-${item.id}`
      if (!seen.has(key)) {
        seen.add(key)
        merged.push(item)
      }
    }

    console.log(`[ES Suggest] Merged ${merged.length} unique results, returning ${Math.min(merged.length, limit)}`)
    return merged.slice(0, limit)
  } catch (error: any) {
    console.error("[ES Suggest] Error:", error?.message)
    // Fallback to prefix-only search
    try {
      return await getPrefixSearchSuggestions(trimmedQuery, indexes, limit)
    } catch {
      return []
    }
  }
}

// ============================================
// COMPLETION SUGGESTER
// ============================================

async function getCompletionSuggestions(
  query: string,
  indexes: string[],
  limit: number
): Promise<ESSuggestion[]> {
  const response = await esClient.search({
    index: indexes,
    suggest: {
      name_suggest: {
        prefix: query,
        completion: {
          field: "suggest",
          size: limit,
          skip_duplicates: true,
          fuzzy: {
            fuzziness: "AUTO" as any,
          },
        },
      },
    },
    _source: ["mongoId", "name", "orgName", "title", "slug", "skillNames", "causeNames", "city", "country", "headline", "subtitle", "description", "excerpt"],
  })

  const suggestions: ESSuggestion[] = []
  const suggestResults = (response.suggest as any)?.name_suggest?.[0]?.options || []

  for (const option of suggestResults) {
    const source = option._source as Record<string, any>
    const indexType = INDEX_TO_TYPE[option._index] || "page"
    suggestions.push(hitToSuggestion(source, indexType, option._id, option._score || 0))
  }

  return suggestions
}

// ============================================
// PREFIX SEARCH SUGGESTIONS
// ============================================

async function getPrefixSearchSuggestions(
  query: string,
  indexes: string[],
  limit: number
): Promise<ESSuggestion[]> {
  // Clean the query — strip intent/noise words so suggestions focus on skills/names
  const textQuery = cleanQueryForTextSearch(query)
  console.log(`[ES Suggest] Cleaned query for prefix: "${query}" → "${textQuery}"`)

  // Detect intent from original query for boosting
  const intent = detectQueryIntent(query)
  const intentBoosts = intent.boosts.length > 0 ? intent.boosts : []

  // Use bool_prefix multi_match with CLEANED query for partial word matching
  const response = await esClient.search({
    index: indexes,
    query: {
      bool: {
        should: [
          // Prefix matching across key fields only (no bio/description/content)
          {
            multi_match: {
              query: textQuery,
              type: "bool_prefix",
              fields: [
                "name^10",
                "name.exact^15",
                "orgName^10",
                "orgName.exact^15",
                "title^10",
                "title.exact^15",
                "skillNames^12",
                "skillCategories^8",
                "causeNames^6",
                "headline^5",
                "tags^5",
                "city^3",
              ],
              fuzziness: "AUTO",
            },
          },
          // Boost exact phrase prefix matches on skill names / titles
          {
            multi_match: {
              query: textQuery,
              type: "phrase_prefix",
              fields: [
                "skillNames^14",
                "name^12",
                "orgName^12",
                "title^12",
                "causeNames^8",
              ],
              boost: 2.0,
            },
          },
          // Add intent-based boosts (e.g. experience level, pricing)
          ...intentBoosts,
        ],
        minimum_should_match: 1,
      },
    },
    size: limit,
    _source: ["mongoId", "name", "orgName", "title", "slug", "skillNames", "causeNames", "city", "country", "headline", "subtitle", "description", "excerpt", "bio", "mission"],
  })

  const suggestions: ESSuggestion[] = []

  for (const hit of response.hits.hits) {
    const source = hit._source as Record<string, any>
    const indexType = INDEX_TO_TYPE[hit._index] || "page"
    suggestions.push(hitToSuggestion(source, indexType, hit._id || "", hit._score || 0))
  }

  return suggestions
}

// ============================================
// QUERY CLEANING — strip intent/noise words
// ============================================
// Removes words that indicate intent (experience, years, pricing,
// work-mode, etc.) from the raw query so the core text-matching
// only uses the "what" (skills, role, name) and not the "how".
// The stripped tokens are handled separately via detectQueryIntent.
// ============================================

function cleanQueryForTextSearch(query: string): string {
  let cleaned = query

  // Remove numeric experience patterns: "2 year experience", "5+ years of exp", "10 yrs"
  cleaned = cleaned.replace(/\b\d+\+?\s*(?:years?|yrs?|yr)\s*(?:of\s+)?(?:experience|exp)?\b/gi, " ")

  // Remove standalone intent words
  const intentWords = [
    // Experience / level
    "experience", "experienced", "expert", "beginner", "intermediate",
    "senior", "junior", "fresher", "entry-level", "entry level", "specialist",
    "veteran", "seasoned", "newbie", "newcomer", "intern", "level",
    // Pricing
    "free", "paid", "premium", "pro bono", "probono", "affordable",
    "cheap", "budget", "low cost", "no cost",
    // Work mode
    "remote", "onsite", "on-site", "hybrid", "work from home", "wfh",
    "online", "virtual", "in person", "in-person",
    // Urgency / quality
    "urgent", "asap", "immediately",
    "verified", "trusted", "reliable", "top", "best", "rated",
    "top rated", "highly rated",
    // Availability
    "weekend", "weekday", "evening", "part-time", "full-time",
    "flexible", "anytime",
    // Common filler prepositions / articles (only if not the entire query)
    "with", "for", "who", "that", "has", "have", "having",
    "looking", "need", "find", "search", "looking for",
  ]

  // Sort longest first so multi-word patterns are removed before their sub-words
  const sortedIntentWords = [...intentWords].sort((a, b) => b.length - a.length)
  for (const w of sortedIntentWords) {
    const regex = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "gi")
    cleaned = cleaned.replace(regex, " ")
  }

  // Remove lone numbers that aren't part of a word (e.g. leftover "2" from "2 year")
  cleaned = cleaned.replace(/\b\d+\b/g, " ")

  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim()

  // If cleaning stripped everything, fall back to original
  return cleaned.length >= 2 ? cleaned : query.trim()
}

// ============================================
// NATURAL LANGUAGE QUERY UNDERSTANDING
// ============================================
// Pre-processes the raw search query to detect intent signals
// like pricing, experience, availability, work mode, etc.
// Returns extra should/filter clauses to inject into the query.
// ============================================

interface QueryIntent {
  /** Extra should clauses to boost matching results */
  boosts: any[]
  /** Extra filter clauses to hard-filter results */
  filters: any[]
  /** Detected intent labels for logging */
  signals: string[]
}

function detectQueryIntent(query: string): QueryIntent {
  const q = query.toLowerCase()
  const boosts: any[] = []
  const filters: any[] = []
  const signals: string[] = []

  // --- PRICING INTENT ---
  // "free", "pro bono", "no cost", "budget", "voluntary"
  if (/\b(free|pro[- ]?bono|no[- ]?cost|voluntary|gratis|without[- ]?pay)\b/.test(q)) {
    boosts.push({ term: { volunteerType: { value: "free", boost: 5.0 } } })
    boosts.push({ term: { volunteerType: { value: "both", boost: 2.0 } } })
    signals.push("price:free")
  }
  // "cheap", "affordable", "budget", "low cost", "inexpensive"
  if (/\b(cheap|affordable|budget|low[- ]?cost|inexpensive|economical)\b/.test(q)) {
    boosts.push({ range: { hourlyRate: { lte: 300, boost: 3.0 } } })
    boosts.push({ term: { volunteerType: { value: "free", boost: 4.0 } } })
    boosts.push({ term: { volunteerType: { value: "both", boost: 2.0 } } })
    signals.push("price:cheap")
  }
  // "paid", "premium", "professional"
  if (/\b(paid|premium|professional|hire)\b/.test(q) && !/\b(un[- ]?paid)\b/.test(q)) {
    boosts.push({ term: { volunteerType: { value: "paid", boost: 3.0 } } })
    boosts.push({ term: { volunteerType: { value: "both", boost: 1.5 } } })
    signals.push("price:paid")
  }
  // "under X per hour", "below X/hr", "less than X"
  const rateMatch = q.match(/(?:under|below|less than|max|upto|up to|within)\s*(?:rs\.?|inr|₹|\$|usd)?\s*(\d+)/)
  if (rateMatch) {
    const maxRate = parseInt(rateMatch[1])
    boosts.push({ range: { hourlyRate: { lte: maxRate, boost: 4.0 } } })
    boosts.push({ term: { volunteerType: { value: "free", boost: 3.0 } } })
    signals.push(`price:under_${maxRate}`)
  }

  // --- EXPERIENCE LEVEL INTENT ---
  // "expert", "senior", "experienced", "specialist", "10 years", "5+ years"
  if (/\b(expert|senior|specialist|veteran|seasoned|highly[- ]?experienced)\b/.test(q)) {
    boosts.push({ term: { experienceLevel: { value: "expert", boost: 4.0 } } })
    signals.push("exp:expert")
  }
  // Numeric years: "10 years", "5 years experience", "3+ years"
  const yearsMatch = q.match(/(\d+)\+?\s*(?:years?|yrs?|yr)\b/)
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1])
    if (years >= 6) {
      boosts.push({ term: { experienceLevel: { value: "expert", boost: 5.0 } } })
      // Also boost high completedProjects as proxy for experience
      boosts.push({ range: { completedProjects: { gte: 3, boost: 2.0 } } })
      boosts.push({ range: { rating: { gte: 4, boost: 1.5 } } })
      signals.push(`exp:years_${years}_expert`)
    } else if (years >= 3) {
      boosts.push({ term: { experienceLevel: { value: "intermediate", boost: 3.0 } } })
      boosts.push({ term: { experienceLevel: { value: "expert", boost: 2.0 } } })
      signals.push(`exp:years_${years}_advanced`)
    } else {
      boosts.push({ term: { experienceLevel: { value: "intermediate", boost: 2.0 } } })
      boosts.push({ term: { experienceLevel: { value: "beginner", boost: 1.5 } } })
      signals.push(`exp:years_${years}_intermediate`)
    }
  }
  // "beginner", "entry level", "fresher", "newbie", "no experience"
  if (/\b(beginner|entry[- ]?level|fresher|newbie|no[- ]?experience|starter|newcomer|intern)\b/.test(q)) {
    boosts.push({ term: { experienceLevel: { value: "beginner", boost: 4.0 } } })
    signals.push("exp:beginner")
  }
  // "beginner friendly" — for projects
  if (/\b(beginner[- ]?friendly|easy|simple|basic|first[- ]?time)\b/.test(q)) {
    boosts.push({ term: { experienceLevel: { value: "beginner", boost: 4.0 } } })
    signals.push("exp:beginner_friendly")
  }

  // --- WORK MODE INTENT ---
  if (/\b(remote|work from home|wfh|from anywhere|online|virtual)\b/.test(q)) {
    boosts.push({ term: { workMode: { value: "remote", boost: 3.0 } } })
    boosts.push({ term: { acceptRemoteVolunteers: { value: true, boost: 2.0 } } })
    signals.push("mode:remote")
  }
  if (/\b(onsite|on[- ]?site|in[- ]?person|office|local|nearby|near me)\b/.test(q)) {
    boosts.push({ term: { workMode: { value: "onsite", boost: 3.0 } } })
    signals.push("mode:onsite")
  }
  if (/\b(hybrid|flexible location)\b/.test(q)) {
    boosts.push({ term: { workMode: { value: "hybrid", boost: 3.0 } } })
    signals.push("mode:hybrid")
  }

  // --- AVAILABILITY INTENT ---
  if (/\b(weekend|saturday|sunday)\b/.test(q)) {
    boosts.push({ term: { availability: { value: "weekends", boost: 3.0 } } })
    boosts.push({ term: { availability: { value: "flexible", boost: 1.5 } } })
    signals.push("avail:weekends")
  }
  if (/\b(weekday|monday|friday|morning)\b/.test(q)) {
    boosts.push({ term: { availability: { value: "weekdays", boost: 3.0 } } })
    boosts.push({ term: { availability: { value: "flexible", boost: 1.5 } } })
    signals.push("avail:weekdays")
  }
  if (/\b(evening|after[- ]?hours|part[- ]?time|night)\b/.test(q)) {
    boosts.push({ term: { availability: { value: "evenings", boost: 3.0 } } })
    boosts.push({ term: { availability: { value: "flexible", boost: 1.5 } } })
    signals.push("avail:evenings")
  }
  if (/\b(flexible|anytime|any time|full[- ]?time)\b/.test(q)) {
    boosts.push({ term: { availability: { value: "flexible", boost: 3.0 } } })
    signals.push("avail:flexible")
  }

  // --- PROJECT TYPE INTENT ---
  if (/\b(short[- ]?term|quick|temporary|one[- ]?time|sprint)\b/.test(q)) {
    boosts.push({ term: { projectType: { value: "short-term", boost: 3.0 } } })
    signals.push("type:short")
  }
  if (/\b(long[- ]?term|ongoing|permanent|continuous|regular)\b/.test(q)) {
    boosts.push({ term: { projectType: { value: "long-term", boost: 2.0 } } })
    boosts.push({ term: { projectType: { value: "ongoing", boost: 2.0 } } })
    signals.push("type:long")
  }
  if (/\b(consult|advisory|advice|mentor|guidance)\b/.test(q)) {
    boosts.push({ term: { projectType: { value: "consultation", boost: 3.0 } } })
    signals.push("type:consult")
  }

  // --- URGENCY INTENT ---
  if (/\b(urgent|asap|immediately|right away|starting soon|deadline)\b/.test(q)) {
    // Boost recently created projects (likely more urgent)
    boosts.push({ range: { createdAt: { gte: "now-7d", boost: 2.0 } } })
    signals.push("urgency:high")
  }

  // --- VERIFIED/TRUST INTENT ---
  if (/\b(verified|trusted|reliable|reputable|authentic|legitimate)\b/.test(q)) {
    boosts.push({ term: { isVerified: { value: true, boost: 5.0 } } })
    signals.push("trust:verified")
  }

  // --- HIGHLY RATED INTENT ---
  if (/\b(top rated|highly rated|best|top|star|rated|popular)\b/.test(q)) {
    boosts.push({ range: { rating: { gte: 4, boost: 4.0 } } })
    boosts.push({ range: { completedProjects: { gte: 3, boost: 2.0 } } })
    signals.push("quality:top_rated")
  }

  return { boosts, filters, signals }
}

// ============================================
// QUERY BUILDERS
// ============================================

function buildSearchQuery(query: string, filters?: ESSearchParams["filters"]): Record<string, any> {
  const must: any[] = []
  const should: any[] = []
  const filterClauses: any[] = []

  // Detect NL intent signals from raw query
  const intent = detectQueryIntent(query)
  if (intent.signals.length > 0) {
    console.log(`[ES Search] Detected intent signals: ${intent.signals.join(", ")}`)
  }

  // Clean query — remove intent/noise words so text matching focuses on the "what"
  const textQuery = cleanQueryForTextSearch(query)
  console.log(`[ES Search] Cleaned query: "${query}" → "${textQuery}"`)

  // Adaptive minimum_should_match based on cleaned word count
  const wordCount = textQuery.split(/\s+/).length
  const minMatch = wordCount <= 2 ? "75%" : wordCount <= 4 ? "60%" : "40%"

  // Primary search — hybrid: text + semantic
  // Uses the CLEANED query (intent words removed) for text matching
  should.push(
    // Text search with field boosting (BM25) — high weight on skill/role fields
    {
      multi_match: {
        query: textQuery,
        type: "most_fields",
        fields: [
          "name^10",
          "name.exact^15",
          "orgName^10",
          "orgName.exact^15",
          "title^10",
          "title.exact^15",
          "headline^6",
          "skillNames^12",
          "skillCategories^8",
          "causeNames^6",
          "bio^3",
          "description^4",
          "mission^4",
          "location^4",
          "city^4",
          "country^3",
          "content^2",
          "excerpt^4",
          "tags^5",
          "languages^3",
          "interests^2",
        ],
        fuzziness: "AUTO",
        prefix_length: 2,
        operator: "or",
        minimum_should_match: minMatch,
      },
    },
    // Cross-fields match — treats all fields as one big field (great for multi-concept queries)
    {
      multi_match: {
        query: textQuery,
        type: "cross_fields",
        fields: [
          "name^5",
          "orgName^5",
          "title^5",
          "headline^4",
          "skillNames^8",
          "bio^3",
          "description^3",
        ],
        operator: "or",
        minimum_should_match: minMatch,
        boost: 1.5,
      },
    },
    // Phrase match (boost exact phrases) — uses cleaned query
    {
      multi_match: {
        query: textQuery,
        type: "phrase",
        fields: [
          "name^15",
          "orgName^15",
          "title^15",
          "headline^8",
          "description^5",
          "bio^5",
          "skillNames^14",
        ],
        slop: 2,
        boost: 2.5,
      },
    },
    // Prefix matching for instant search-as-you-type
    {
      multi_match: {
        query: textQuery,
        type: "bool_prefix",
        fields: [
          "name^8",
          "orgName^8",
          "title^8",
          "skillNames^8",
          "causeNames^5",
          "city^4",
        ],
      },
    }
  )

  // Semantic search via semantic_text (if available) — uses ORIGINAL query for NL understanding
  // This will be ignored gracefully on indexes without semantic_text
  should.push({
    semantic: {
      field: "semantic_content",
      query,
      boost: 1.5,
    },
  })

  // Apply filters
  if (filters) {
    if (filters.workMode) {
      filterClauses.push({ term: { workMode: filters.workMode } })
    }
    if (filters.volunteerType) {
      filterClauses.push({
        bool: {
          should: [
            { term: { volunteerType: filters.volunteerType } },
            { term: { volunteerType: "both" } },
          ],
        },
      })
    }
    if (filters.causes && filters.causes.length > 0) {
      filterClauses.push({ terms: { causeIds: filters.causes } })
    }
    if (filters.skills && filters.skills.length > 0) {
      filterClauses.push({ terms: { skillIds: filters.skills } })
    }
    if (filters.location) {
      filterClauses.push({
        multi_match: {
          query: filters.location,
          fields: ["city", "country", "location", "address"],
          type: "best_fields",
          fuzziness: "AUTO",
        },
      })
    }
    if (filters.experienceLevel) {
      filterClauses.push({ term: { experienceLevel: filters.experienceLevel } })
    }
    if (filters.isVerified !== undefined) {
      filterClauses.push({ term: { isVerified: filters.isVerified } })
    }
    if (filters.minRating && filters.minRating > 0) {
      filterClauses.push({ range: { rating: { gte: filters.minRating } } })
    }
    if (filters.maxHourlyRate && filters.maxHourlyRate > 0) {
      filterClauses.push({
        bool: {
          should: [
            { range: { hourlyRate: { lte: filters.maxHourlyRate } } },
            { term: { volunteerType: "free" } },
            { bool: { must_not: { exists: { field: "hourlyRate" } } } },
          ],
        },
      })
    }
    if (filters.status) {
      filterClauses.push({ term: { status: filters.status } })
    }
  }

  // Always filter out banned/inactive
  filterClauses.push({
    bool: {
      should: [
        { term: { isActive: true } },
        { bool: { must_not: { exists: { field: "isActive" } } } }, // Pages/blog don't have isActive
      ],
    },
  })

  // Inject NL intent boosts — these are extra should clauses that boost
  // results matching detected signals (free, expert, remote, etc.)
  if (intent.boosts.length > 0) {
    should.push(...intent.boosts)
  }
  // Inject NL intent hard filters
  if (intent.filters.length > 0) {
    filterClauses.push(...intent.filters)
  }

  return {
    function_score: {
      query: {
        bool: {
          should,
          filter: filterClauses.length > 0 ? filterClauses : undefined,
          minimum_should_match: 1,
        },
      },
      functions: [
        // Boost verified users
        { filter: { term: { isVerified: true } }, weight: 1.5 },
        // Boost profiles with ratings
        { filter: { range: { rating: { gte: 3 } } }, weight: 1.3 },
        // Boost profiles with completed projects (experienced)
        { filter: { range: { completedProjects: { gte: 1 } } }, weight: 1.2 },
        // Slight boost for profiles that have an avatar/logo (more complete)
        { filter: { exists: { field: "avatar" } }, weight: 1.1 },
        { filter: { exists: { field: "logo" } }, weight: 1.1 },
      ],
      score_mode: "multiply",
      boost_mode: "multiply",
      max_boost: 3.0,
    },
  }
}

function buildTextOnlyQuery(query: string, filters?: ESSearchParams["filters"]): Record<string, any> {
  // Same as buildSearchQuery but without the semantic clause
  const fullQuery = buildSearchQuery(query, filters)
  // Remove the semantic clause from should (nested inside function_score)
  const boolQuery = fullQuery.function_score?.query?.bool || fullQuery.bool
  if (boolQuery?.should) {
    boolQuery.should = boolQuery.should.filter(
      (clause: any) => !clause.semantic
    )
  }
  return fullQuery
}

function buildSortConfig(sort: string): any[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: { order: "desc", unmapped_type: "date" } }, "_score"]
    case "rating":
      return [{ rating: { order: "desc", unmapped_type: "float" } }, "_score"]
    case "relevance":
    default:
      return ["_score", { createdAt: { order: "desc", unmapped_type: "date" } }]
  }
}

// ============================================
// HIT → RESULT TRANSFORMERS
// ============================================

function transformHitToResult(
  source: Record<string, any>,
  type: string,
  esId: string
): Omit<ESSearchResult, "score" | "highlights"> {
  switch (type) {
    case "volunteer":
      return {
        id: esId,
        mongoId: source.mongoId || esId,
        type: "volunteer",
        title: source.name || "Unknown Volunteer",
        subtitle: source.headline || (source.skillNames && source.skillNames.length > 0 ? `Skills: ${Array.isArray(source.skillNames) ? source.skillNames.slice(0, 3).join(", ") : String(source.skillNames).substring(0, 80)}` : ""),
        description: source.bio || "",
        url: `/volunteers/${source.mongoId || esId}`,
        metadata: {
          avatar: source.avatar,
          city: source.city,
          country: source.country,
          rating: source.rating,
          skillNames: source.skillNames,
          causeNames: source.causeNames,
          volunteerType: source.volunteerType,
          workMode: source.workMode,
          isVerified: source.isVerified,
        },
      }

    case "ngo":
      return {
        id: esId,
        mongoId: source.mongoId || esId,
        type: "ngo",
        title: source.orgName || source.organizationName || "Unknown Organization",
        subtitle: source.mission ? source.mission.substring(0, 120) : "",
        description: source.description || "",
        url: `/ngos/${source.mongoId || esId}`,
        metadata: {
          logo: source.logo,
          city: source.city,
          country: source.country,
          causeNames: source.causeNames,
          skillNames: source.skillNames,
          isVerified: source.isVerified,
          volunteersEngaged: source.volunteersEngaged,
          projectsPosted: source.projectsPosted,
        },
      }

    case "project":
      return {
        id: esId,
        mongoId: source.mongoId || esId,
        type: "project",
        title: source.title || "Untitled Project",
        subtitle: source.ngoName ? `by ${source.ngoName}` : "",
        description: source.description || "",
        url: `/projects/${source.mongoId || esId}`,
        metadata: {
          ngoName: source.ngoName,
          skillNames: source.skillNames,
          causeNames: source.causeNames,
          workMode: source.workMode,
          experienceLevel: source.experienceLevel,
          location: source.location,
          status: source.status,
          applicantsCount: source.applicantsCount,
        },
      }

    case "blog":
      return {
        id: esId,
        mongoId: source.mongoId || esId,
        type: "blog",
        title: source.title || "Untitled Post",
        subtitle: source.authorName ? `by ${source.authorName}` : "",
        description: source.excerpt || "",
        url: `/blog/${source.slug || esId}`,
        metadata: {
          slug: source.slug,
          tags: source.tags,
          category: source.category,
          publishedAt: source.publishedAt,
          viewCount: source.viewCount,
        },
      }

    case "page":
      return {
        id: esId,
        mongoId: esId,
        type: "page",
        title: source.title || "Page",
        subtitle: source.section || "",
        description: source.description || "",
        url: source.slug || "/",
        metadata: {
          section: source.section,
        },
      }

    default:
      return {
        id: esId,
        mongoId: source.mongoId || esId,
        type: type as any,
        title: source.name || source.title || source.orgName || "Unknown",
        subtitle: "",
        description: source.description || source.bio || "",
        url: "#",
        metadata: {},
      }
  }
}

function hitToSuggestion(
  source: Record<string, any>,
  type: string,
  esId: string,
  score: number
): ESSuggestion {
  let text = ""
  let subtitle = ""

  switch (type) {
    case "volunteer": {
      text = source.name || "Volunteer"
      // Show location first, then top skills — gives a quick profile snapshot
      const location = source.city || source.country || ""
      const skillPreview = Array.isArray(source.skillNames) && source.skillNames.length > 0
        ? source.skillNames.slice(0, 2).join(", ")
        : ""
      if (location && skillPreview) {
        subtitle = `${location} · ${skillPreview}`
      } else {
        subtitle = source.headline || location || skillPreview || ""
      }
      break
    }
    case "ngo":
      text = source.orgName || "Organization"
      subtitle = source.city || source.mission?.substring(0, 60) || ""
      break
    case "project":
      text = source.title || "Project"
      subtitle = source.description?.replace(/<[^>]*>/g, "").substring(0, 60) || ""
      break
    case "blog":
      text = source.title || "Blog Post"
      subtitle = source.excerpt?.substring(0, 60) || ""
      break
    case "page":
      text = source.title || "Page"
      subtitle = source.description?.substring(0, 60) || ""
      break
  }

  // Map types for backward compatibility with existing component
  const mappedType = type === "project" ? "opportunity" : type

  return {
    text,
    type: mappedType as any,
    id: source.mongoId || source.slug || esId,
    subtitle,
    score,
  }
}
