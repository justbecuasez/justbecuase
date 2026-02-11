import { NextRequest, NextResponse } from "next/server"
import { unifiedSearch } from "@/lib/search-indexes"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const typesParam = searchParams.get("types") // comma-separated: "volunteer,ngo,opportunity"
    const limitParam = searchParams.get("limit")

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [], message: "Query too short" })
    }

    const types = typesParam
      ? (typesParam.split(",") as ("volunteer" | "ngo" | "opportunity")[])
      : undefined

    const limit = limitParam ? parseInt(limitParam, 10) : 20

    const results = await unifiedSearch({
      query,
      types,
      limit: Math.min(limit, 50), // Cap at 50 results
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
      { success: false, error: error.message || "Search failed" },
      { status: 500 }
    )
  }
}
