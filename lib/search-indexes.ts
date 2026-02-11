// ============================================
// MongoDB Text Search Indexes Setup
// ============================================

import client from "./db"

const DB_NAME = "justbecause"

/**
 * Creates text indexes for full-text search on all relevant collections.
 * Call this once on app startup or deployment.
 * MongoDB text indexes support:
 * - Full-text search with relevance scoring
 * - Case-insensitive matching
 * - Stemming (e.g., "running" matches "run")
 * - Stop words filtering
 */
export async function ensureSearchIndexes(): Promise<void> {
  try {
    await client.connect()
    const db = client.db(DB_NAME)

    // Index for users collection (volunteers + NGOs)
    // Fields: name, bio, location, city, organizationName, description
    const userCollection = db.collection("user")
    
    // Check if text index already exists
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
            name: 10,           // Name matches are most important
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

    // Index for projects collection
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

    console.log("[Search] All search indexes verified")
  } catch (error) {
    console.error("[Search] Failed to create indexes:", error)
    // Don't throw - indexes might already exist or we might not have permissions
  }
}

/**
 * Search across all collections using MongoDB text search
 */
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
}

export interface UnifiedSearchParams {
  query: string
  types?: ("volunteer" | "ngo" | "opportunity")[]
  limit?: number
}

export async function unifiedSearch(params: UnifiedSearchParams): Promise<SearchResult[]> {
  const { query, types = ["volunteer", "ngo", "opportunity"], limit = 20 } = params
  
  if (!query || query.trim().length < 2) {
    return []
  }

  await client.connect()
  const db = client.db(DB_NAME)
  const results: SearchResult[] = []

  // Clean and prepare query for text search
  const searchQuery = query.trim()

  try {
    // Search users (volunteers and NGOs)
    if (types.includes("volunteer") || types.includes("ngo")) {
      const userCollection = db.collection("user")
      
      const roleFilter: any = { $in: [] }
      if (types.includes("volunteer")) roleFilter.$in.push("volunteer")
      if (types.includes("ngo")) roleFilter.$in.push("ngo")

      const userResults = await userCollection
        .find(
          {
            $text: { $search: searchQuery },
            role: roleFilter,
            isOnboarded: true,
          },
          {
            projection: {
              score: { $meta: "textScore" },
              _id: 1,
              name: 1,
              role: 1,
              bio: 1,
              headline: 1,
              location: 1,
              city: 1,
              skills: 1,
              image: 1,
              avatar: 1,
              organizationName: 1,
              description: 1,
              isVerified: 1,
              logo: 1,
            },
          }
        )
        .sort({ score: { $meta: "textScore" } })
        .limit(Math.ceil(limit / 2))
        .toArray()

      for (const user of userResults) {
        if (user.role === "volunteer") {
          // Parse skills if stored as JSON string
          let skillsList: string[] = []
          if (user.skills) {
            try {
              const parsed = typeof user.skills === "string" ? JSON.parse(user.skills) : user.skills
              skillsList = parsed.slice(0, 3).map((s: any) => s.subskillId || s)
            } catch { }
          }

          results.push({
            type: "volunteer",
            id: user._id.toString(),
            title: user.name || "Volunteer",
            subtitle: user.headline || user.bio?.slice(0, 60),
            location: user.location || user.city,
            skills: skillsList,
            score: user.score || 0,
            avatar: user.image || user.avatar,
          })
        } else if (user.role === "ngo") {
          results.push({
            type: "ngo",
            id: user._id.toString(),
            title: user.organizationName || user.name || "Organization",
            subtitle: user.description?.slice(0, 60),
            location: user.location || user.city,
            score: user.score || 0,
            avatar: user.logo || user.image,
            verified: user.isVerified,
          })
        }
      }
    }

    // Search projects/opportunities
    if (types.includes("opportunity")) {
      const projectsCollection = db.collection("projects")

      const projectResults = await projectsCollection
        .find(
          {
            $text: { $search: searchQuery },
            status: { $in: ["open", "active"] },
          },
          {
            projection: {
              score: { $meta: "textScore" },
              _id: 1,
              title: 1,
              description: 1,
              location: 1,
              skillsRequired: 1,
              workMode: 1,
              timeCommitment: 1,
            },
          }
        )
        .sort({ score: { $meta: "textScore" } })
        .limit(Math.ceil(limit / 2))
        .toArray()

      for (const project of projectResults) {
        const skillsList = project.skillsRequired?.slice(0, 3).map((s: any) => s.subskillId || s) || []
        
        results.push({
          type: "opportunity",
          id: project._id.toString(),
          title: project.title,
          subtitle: project.workMode === "remote" ? "Remote" : project.location,
          description: project.description?.slice(0, 80),
          location: project.workMode === "remote" ? "Remote" : project.location,
          skills: skillsList,
          score: project.score || 0,
        })
      }
    }

    // Sort all results by score
    results.sort((a, b) => b.score - a.score)

    return results.slice(0, limit)
  } catch (error: any) {
    // If text index doesn't exist, fall back to regex search
    if (error.code === 27 || error.message?.includes("text index")) {
      console.warn("[Search] Text index not found, using fallback regex search")
      return fallbackRegexSearch(params)
    }
    console.error("[Search] Error:", error)
    return []
  }
}

/**
 * Fallback regex-based search when text index is not available
 */
async function fallbackRegexSearch(params: UnifiedSearchParams): Promise<SearchResult[]> {
  const { query, types = ["volunteer", "ngo", "opportunity"], limit = 20 } = params
  
  await client.connect()
  const db = client.db(DB_NAME)
  const results: SearchResult[] = []

  // Create regex pattern for fuzzy matching
  const searchTerms = query.trim().toLowerCase().split(/\s+/)
  const regexPatterns = searchTerms.map(term => new RegExp(term, "i"))

  // Search users
  if (types.includes("volunteer") || types.includes("ngo")) {
    const userCollection = db.collection("user")
    
    const roleFilter: any = { $in: [] }
    if (types.includes("volunteer")) roleFilter.$in.push("volunteer")
    if (types.includes("ngo")) roleFilter.$in.push("ngo")

    const userResults = await userCollection
      .find({
        role: roleFilter,
        isOnboarded: true,
        $or: regexPatterns.flatMap(regex => [
          { name: regex },
          { bio: regex },
          { headline: regex },
          { location: regex },
          { city: regex },
          { organizationName: regex },
          { description: regex },
        ]),
      })
      .limit(Math.ceil(limit / 2))
      .toArray()

    for (const user of userResults) {
      if (user.role === "volunteer") {
        let skillsList: string[] = []
        if (user.skills) {
          try {
            const parsed = typeof user.skills === "string" ? JSON.parse(user.skills) : user.skills
            skillsList = parsed.slice(0, 3).map((s: any) => s.subskillId || s)
          } catch { }
        }

        results.push({
          type: "volunteer",
          id: user._id.toString(),
          title: user.name || "Volunteer",
          subtitle: user.headline || user.bio?.slice(0, 60),
          location: user.location || user.city,
          skills: skillsList,
          score: calculateRelevanceScore(user, searchTerms),
          avatar: user.image || user.avatar,
        })
      } else if (user.role === "ngo") {
        results.push({
          type: "ngo",
          id: user._id.toString(),
          title: user.organizationName || user.name || "Organization",
          subtitle: user.description?.slice(0, 60),
          location: user.location || user.city,
          score: calculateRelevanceScore(user, searchTerms),
          avatar: user.logo || user.image,
          verified: user.isVerified,
        })
      }
    }
  }

  // Search projects
  if (types.includes("opportunity")) {
    const projectsCollection = db.collection("projects")

    const projectResults = await projectsCollection
      .find({
        status: { $in: ["open", "active"] },
        $or: regexPatterns.flatMap(regex => [
          { title: regex },
          { description: regex },
          { location: regex },
        ]),
      })
      .limit(Math.ceil(limit / 2))
      .toArray()

    for (const project of projectResults) {
      const skillsList = project.skillsRequired?.slice(0, 3).map((s: any) => s.subskillId || s) || []
      
      results.push({
        type: "opportunity",
        id: project._id.toString(),
        title: project.title,
        subtitle: project.workMode === "remote" ? "Remote" : project.location,
        description: project.description?.slice(0, 80),
        location: project.workMode === "remote" ? "Remote" : project.location,
        skills: skillsList,
        score: calculateRelevanceScore(project, searchTerms),
      })
    }
  }

  // Sort by relevance score
  results.sort((a, b) => b.score - a.score)
  return results.slice(0, limit)
}

/**
 * Calculate simple relevance score based on term matches
 */
function calculateRelevanceScore(doc: any, searchTerms: string[]): number {
  let score = 0
  const text = [
    doc.name,
    doc.title,
    doc.organizationName,
    doc.headline,
    doc.bio,
    doc.description,
    doc.location,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  for (const term of searchTerms) {
    if (doc.name?.toLowerCase().includes(term)) score += 10
    if (doc.title?.toLowerCase().includes(term)) score += 10
    if (doc.organizationName?.toLowerCase().includes(term)) score += 10
    if (text.includes(term)) score += 5
  }

  return score
}
