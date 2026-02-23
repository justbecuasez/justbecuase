/**
 * Platform Analytics & Event Tracking
 * 
 * Tracks user actions, business metrics, and system events
 * into a time-series `platform_events` collection for dashboards,
 * investor reporting, and operational monitoring.
 */

import { getDb } from "./database"

// ==========================================
// EVENT TYPES
// ==========================================

export type EventCategory = 
  | "user"          // signups, logins, profile updates
  | "project"       // created, published, completed, closed
  | "application"   // submitted, accepted, rejected
  | "payment"       // subscription, one-time, refund
  | "search"        // queries, result clicks
  | "email"         // sent, opened, clicked, bounced
  | "notification"  // sent, read
  | "match"         // AI match triggered, match accepted
  | "system"        // errors, health checks, cron runs

export interface PlatformEvent {
  category: EventCategory
  action: string
  userId?: string
  metadata?: Record<string, unknown>
  value?: number
  timestamp: Date
  sessionId?: string
}

// ==========================================
// TRACK EVENT (fire-and-forget)
// ==========================================

export async function trackEvent(
  category: EventCategory,
  action: string,
  opts?: {
    userId?: string
    metadata?: Record<string, unknown>
    value?: number
    sessionId?: string
  }
): Promise<void> {
  try {
    const db = await getDb()
    await db.collection("platform_events").insertOne({
      category,
      action,
      userId: opts?.userId || null,
      metadata: opts?.metadata || {},
      value: opts?.value || 0,
      sessionId: opts?.sessionId || null,
      timestamp: new Date(),
      _createdAt: new Date(),
    })
  } catch (err) {
    // Never let analytics tracking break the main flow
    console.error("[Analytics] Failed to track event:", err)
  }
}

// ==========================================
// TIME-SERIES QUERIES
// ==========================================

export interface TimeSeriesPoint {
  date: string
  count: number
  value?: number
}

export interface AnalyticsTimeRange {
  start: Date
  end: Date
  granularity: "hour" | "day" | "week" | "month"
}

function getDateGroupExpression(granularity: string) {
  switch (granularity) {
    case "hour":
      return {
        year: { $year: "$timestamp" },
        month: { $month: "$timestamp" },
        day: { $dayOfMonth: "$timestamp" },
        hour: { $hour: "$timestamp" },
      }
    case "week":
      return {
        year: { $isoWeekYear: "$timestamp" },
        week: { $isoWeek: "$timestamp" },
      }
    case "month":
      return {
        year: { $year: "$timestamp" },
        month: { $month: "$timestamp" },
      }
    default:
      return {
        year: { $year: "$timestamp" },
        month: { $month: "$timestamp" },
        day: { $dayOfMonth: "$timestamp" },
      }
  }
}

export async function getEventTimeSeries(
  category: EventCategory,
  action: string | null,
  range: AnalyticsTimeRange
): Promise<TimeSeriesPoint[]> {
  try {
    const db = await getDb()
    const matchStage: Record<string, unknown> = {
      category,
      timestamp: { $gte: range.start, $lte: range.end },
    }
    if (action) matchStage.action = action

    const results = await db.collection("platform_events").aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: getDateGroupExpression(range.granularity),
          count: { $sum: 1 },
          value: { $sum: "$value" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } },
    ]).toArray()

    return results.map(r => {
      const id = r._id as Record<string, number>
      let date: string
      if (range.granularity === "hour") {
        date = `${id.year}-${String(id.month).padStart(2, "0")}-${String(id.day).padStart(2, "0")}T${String(id.hour).padStart(2, "0")}:00`
      } else if (range.granularity === "week") {
        date = `${id.year}-W${String(id.week).padStart(2, "0")}`
      } else if (range.granularity === "month") {
        date = `${id.year}-${String(id.month).padStart(2, "0")}`
      } else {
        date = `${id.year}-${String(id.month).padStart(2, "0")}-${String(id.day).padStart(2, "0")}`
      }
      return { date, count: r.count, value: r.value || 0 }
    })
  } catch (err) {
    console.error("[Analytics] Time series query failed:", err)
    return []
  }
}

// ==========================================
// AGGREGATED DASHBOARD METRICS
// ==========================================

export interface DashboardMetrics {
  userGrowth: TimeSeriesPoint[]
  ngoGrowth: TimeSeriesPoint[]
  projectGrowth: TimeSeriesPoint[]
  revenueTimeSeries: TimeSeriesPoint[]
  mrr: number
  arr: number
  totalRevenue: number
  searchesPerDay: TimeSeriesPoint[]
  applicationsPerDay: TimeSeriesPoint[]
  matchRate: number
  signupToProfileRate: number
  profileToApplicationRate: number
  applicationToMatchRate: number
  emailsSent: number
  emailOpenRate: number
  emailClickRate: number
}

export async function getDashboardMetrics(days: number = 30): Promise<DashboardMetrics> {
  const db = await getDb()
  const now = new Date()
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  const monthRange: AnalyticsTimeRange = { start, end: now, granularity: "day" }

  const [
    userGrowth,
    ngoGrowth,
    projectGrowth,
    revenueTimeSeries,
    searchesPerDay,
    applicationsPerDay,
    emailStats,
    revenueAgg,
    funnelStats,
  ] = await Promise.all([
    getEventTimeSeries("user", "signup", monthRange),
    getEventTimeSeries("user", "ngo_signup", monthRange),
    getEventTimeSeries("project", "created", monthRange),
    getEventTimeSeries("payment", null, monthRange),
    getEventTimeSeries("search", "query", monthRange),
    getEventTimeSeries("application", "submitted", monthRange),
    getEmailStats(db, start, now),
    getRevenueAggregates(db),
    getFunnelStats(db, start, now),
  ])

  return {
    userGrowth,
    ngoGrowth,
    projectGrowth,
    revenueTimeSeries,
    mrr: revenueAgg.mrr,
    arr: revenueAgg.arr,
    totalRevenue: revenueAgg.total,
    searchesPerDay,
    applicationsPerDay,
    matchRate: funnelStats.matchRate,
    signupToProfileRate: funnelStats.signupToProfile,
    profileToApplicationRate: funnelStats.profileToApplication,
    applicationToMatchRate: funnelStats.applicationToMatch,
    emailsSent: emailStats.sent,
    emailOpenRate: emailStats.openRate,
    emailClickRate: emailStats.clickRate,
  }
}

// ==========================================
// HELPER QUERIES
// ==========================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getEmailStats(db: any, start: Date, end: Date) {
  try {
    const results = await db.collection("platform_events").aggregate([
      { $match: { category: "email", timestamp: { $gte: start, $lte: end } } },
      { $group: { _id: "$action", count: { $sum: 1 } } },
    ]).toArray()
    const counts: Record<string, number> = {}
    results.forEach((r: { _id: string; count: number }) => { counts[r._id] = r.count })
    const sent = counts["sent"] || 0
    return {
      sent,
      openRate: sent > 0 ? ((counts["opened"] || 0) / sent) * 100 : 0,
      clickRate: sent > 0 ? ((counts["clicked"] || 0) / sent) * 100 : 0,
    }
  } catch {
    return { sent: 0, openRate: 0, clickRate: 0 }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRevenueAggregates(db: any) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentRevenue = await db.collection("platform_events").aggregate([
      { $match: { category: "payment", timestamp: { $gte: thirtyDaysAgo }, value: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$value" } } },
    ]).toArray()
    const mrr = (recentRevenue[0]?.total || 0) / 100

    // Also check transactions collection as fallback
    const txRevenue = await db.collection("transactions").aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).toArray()

    const eventsTotal = await db.collection("platform_events").aggregate([
      { $match: { category: "payment", value: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$value" } } },
    ]).toArray()

    const total = Math.max((eventsTotal[0]?.total || 0) / 100, txRevenue[0]?.total || 0)
    return { mrr, arr: mrr * 12, total }
  } catch {
    return { mrr: 0, arr: 0, total: 0 }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getFunnelStats(db: any, start: Date, end: Date) {
  try {
    const timeFilter = { $gte: start, $lte: end }
    const [signups, profiles, applications, matches] = await Promise.all([
      db.collection("platform_events").countDocuments({ category: "user", action: "signup", timestamp: timeFilter }),
      db.collection("platform_events").countDocuments({ category: "user", action: "profile_complete", timestamp: timeFilter }),
      db.collection("platform_events").countDocuments({ category: "application", action: "submitted", timestamp: timeFilter }),
      db.collection("platform_events").countDocuments({ category: "application", action: "accepted", timestamp: timeFilter }),
    ])

    // Fallback to direct collection counts if no events tracked yet
    const s = signups || await db.collection("user").countDocuments({ createdAt: timeFilter })
    const p = profiles || await db.collection("user").countDocuments({ createdAt: timeFilter, "skills.0": { $exists: true } })
    const a = applications || await db.collection("applications").countDocuments({ createdAt: timeFilter })
    const m = matches || await db.collection("applications").countDocuments({ createdAt: timeFilter, status: "accepted" })

    return {
      signupToProfile: s > 0 ? (p / s) * 100 : 0,
      profileToApplication: p > 0 ? (a / p) * 100 : 0,
      applicationToMatch: a > 0 ? (m / a) * 100 : 0,
      matchRate: a > 0 ? (m / a) * 100 : 0,
    }
  } catch {
    return { signupToProfile: 0, profileToApplication: 0, applicationToMatch: 0, matchRate: 0 }
  }
}

// ==========================================
// ENSURE INDEXES (call once)
// ==========================================

export async function ensureAnalyticsIndexes(): Promise<void> {
  try {
    const db = await getDb()
    const col = db.collection("platform_events")
    await Promise.all([
      col.createIndex({ category: 1, action: 1, timestamp: -1 }),
      col.createIndex({ timestamp: -1 }),
      col.createIndex({ userId: 1, timestamp: -1 }),
      col.createIndex({ category: 1, timestamp: -1 }),
      col.createIndex({ _createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 }),
    ])
  } catch (err) {
    console.error("[Analytics] Failed to create indexes:", err)
  }
}
