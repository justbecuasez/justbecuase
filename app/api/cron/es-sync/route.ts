import { NextResponse } from "next/server"
import { ensureElasticsearchIndexes } from "@/lib/es-indexes"
import { bulkSyncToElasticsearch, cleanupStaleDocuments } from "@/lib/es-sync"

// ============================================
// ES Sync Cron Endpoint
// ============================================
// Triggers bulk sync from MongoDB → Elasticsearch.
// Secured via CRON_SECRET.
//
// Modes:
//   GET /api/cron/es-sync              — Full bulk sync
//   GET /api/cron/es-sync?mode=incremental&since=2025-01-01  — Incremental
//   GET /api/cron/es-sync?mode=setup   — Create indexes only
//   GET /api/cron/es-sync?mode=cleanup — Remove stale docs
// ============================================

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mode = searchParams.get("mode") || "full"

    // Always ensure indexes exist
    await ensureElasticsearchIndexes()

    if (mode === "setup") {
      return NextResponse.json({
        success: true,
        message: "Elasticsearch indexes created/verified",
      })
    }

    if (mode === "cleanup") {
      const removed = await cleanupStaleDocuments()
      return NextResponse.json({
        success: true,
        message: `Cleaned up ${removed} stale documents`,
        removed,
      })
    }

    // Incremental or full sync
    const since = searchParams.get("since")
    const collections = searchParams.get("collections")?.split(",") as any

    const result = await bulkSyncToElasticsearch({
      collections: collections || undefined,
      since: since ? new Date(since) : (mode === "incremental" ? getLastSyncTime() : undefined),
    })

    return NextResponse.json({
      success: true,
      mode,
      synced: result.synced,
      errors: result.errors.length > 0 ? result.errors : undefined,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[ES Sync Cron] Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Sync failed" },
      { status: 500 }
    )
  }
}

// Default incremental window: last 15 minutes
function getLastSyncTime(): Date {
  const now = new Date()
  now.setMinutes(now.getMinutes() - 15)
  return now
}
