// ============================================
// Elasticsearch Client — Serverless Cloud
// ============================================
// Connects to Elastic Cloud Serverless using API key auth.
// Provides a singleton client instance shared across the app.
// ============================================

import { Client } from "@elastic/elasticsearch"

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || ""
const ELASTICSEARCH_API_KEY = process.env.ELASTICSEARCH_API_KEY || ""

if (!ELASTICSEARCH_URL) {
  console.warn("[Elasticsearch] Missing ELASTICSEARCH_URL env variable")
}
if (!ELASTICSEARCH_API_KEY) {
  console.warn("[Elasticsearch] Missing ELASTICSEARCH_API_KEY env variable")
}

let esClient: Client

function createClient(): Client {
  return new Client({
    node: ELASTICSEARCH_URL,
    auth: {
      apiKey: ELASTICSEARCH_API_KEY,
    },
    // Serverless Elastic Cloud doesn't need TLS config — it's handled by the endpoint
    requestTimeout: 30000,
    maxRetries: 3,
  })
}

if (process.env.NODE_ENV === "development") {
  // Reuse client across HMR in dev
  const globalWithEs = global as typeof globalThis & { _esClient?: Client }
  if (!globalWithEs._esClient) {
    globalWithEs._esClient = createClient()
  }
  esClient = globalWithEs._esClient
} else {
  esClient = createClient()
}

export default esClient

// ============================================
// INDEX NAMES
// ============================================
export const ES_INDEXES = {
  VOLUNTEERS: "jbc_volunteers",
  NGOS: "jbc_ngos",
  PROJECTS: "jbc_projects",
  BLOG_POSTS: "jbc_blog_posts",
  PAGES: "jbc_pages",
} as const

export type ESIndexName = (typeof ES_INDEXES)[keyof typeof ES_INDEXES]
