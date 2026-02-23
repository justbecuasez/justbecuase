import { NextResponse } from "next/server"
import { getDb } from "@/lib/database"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy"
  version: string
  timestamp: string
  uptime: number
  checks: {
    mongodb: { status: "up" | "down"; latencyMs: number; error?: string }
    elasticsearch: { status: "up" | "down" | "not_configured"; latencyMs: number; error?: string }
    memory: { heapUsedMB: number; heapTotalMB: number; rssMB: number }
  }
}

const startTime = Date.now()

export async function GET() {
  const checks: HealthCheck["checks"] = {
    mongodb: { status: "down", latencyMs: 0 },
    elasticsearch: { status: "not_configured", latencyMs: 0 },
    memory: { heapUsedMB: 0, heapTotalMB: 0, rssMB: 0 },
  }

  // MongoDB health check
  try {
    const mongoStart = Date.now()
    const db = await getDb()
    await db.command({ ping: 1 })
    checks.mongodb = { status: "up", latencyMs: Date.now() - mongoStart }
  } catch (err: unknown) {
    checks.mongodb = { 
      status: "down", 
      latencyMs: 0, 
      error: err instanceof Error ? err.message : "Unknown error" 
    }
  }

  // Elasticsearch health check
  const esUrl = process.env.ELASTICSEARCH_URL
  const esApiKey = process.env.ELASTICSEARCH_API_KEY
  if (esUrl && esApiKey) {
    try {
      const esStart = Date.now()
      const res = await fetch(`${esUrl}/_cluster/health`, {
        headers: { Authorization: `ApiKey ${esApiKey}` },
        signal: AbortSignal.timeout(5000),
      })
      if (res.ok) {
        const data = await res.json()
        checks.elasticsearch = { 
          status: data.status === "red" ? "down" : "up", 
          latencyMs: Date.now() - esStart 
        }
      } else {
        checks.elasticsearch = { status: "down", latencyMs: Date.now() - esStart, error: `HTTP ${res.status}` }
      }
    } catch (err: unknown) {
      checks.elasticsearch = { 
        status: "down", 
        latencyMs: 0, 
        error: err instanceof Error ? err.message : "Unknown error" 
      }
    }
  }

  // Memory check
  if (typeof process !== "undefined" && process.memoryUsage) {
    const mem = process.memoryUsage()
    checks.memory = {
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      rssMB: Math.round(mem.rss / 1024 / 1024),
    }
  }

  // Determine overall status
  const allUp = checks.mongodb.status === "up"
  const esConfigured = checks.elasticsearch.status !== "not_configured"
  const esHealthy = !esConfigured || checks.elasticsearch.status === "up"

  let status: HealthCheck["status"] = "healthy"
  if (!allUp) status = "unhealthy"
  else if (!esHealthy) status = "degraded"

  const health: HealthCheck = {
    status,
    version: process.env.npm_package_version || "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: Math.round((Date.now() - startTime) / 1000),
    checks,
  }

  return NextResponse.json(health, {
    status: status === "unhealthy" ? 503 : 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  })
}
