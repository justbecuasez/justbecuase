import { NextRequest, NextResponse } from "next/server"
import { unifiedSearch, getSearchSuggestions } from "@/lib/search-indexes"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const typesParam = searchParams.get("types") // comma-separated: "volunteer,ngo,opportunity"
    const limitParam = searchParams.get("limit")
    const mode = searchParams.get("mode") // "suggestions" for autocomplete

    // Allow single character searches (Amazon-level instant search)
    if (!query || query.trim().length < 1) {
      return NextResponse.json({
        success: true,
        results: [],
        suggestions: [],
        message: "Query too short",
        query: "",
        count: 0,
      })
    }

    const types = typesParam
      ? (typesParam.split(",") as ("volunteer" | "ngo" | "opportunity")[])
      : undefined

    const limit = limitParam ? parseInt(limitParam, 10) : 20

    // Autocomplete suggestions mode (lightweight, fast)
    if (mode === "suggestions") {
      const suggestions = await getSearchSuggestions({
        query,
        types,
        limit: Math.min(limit, 8),
      })
      return NextResponse.json({
        success: true,
        suggestions,
        query,
        count: suggestions.length,
      })
    }

    // Full search mode
    const results = await unifiedSearch({
      query,
      types,
      limit: Math.min(limit, 50),
    })

    return NextResponse.json({
      success: true,
      results,
      query,
      count: results.length,
    })
  } catch (error: any) {
    console.error("[Unified Search API] Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Search failed", results: [], count: 0 },
      { status: 500 }
    )
  }
}
