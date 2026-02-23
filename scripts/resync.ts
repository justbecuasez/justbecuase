import { config } from "dotenv"
config({ path: ".env.local" })

async function main() {
  console.log("Starting ES re-sync...")
  const { bulkSyncToElasticsearch } = await import("../lib/es-sync")
  const result = await bulkSyncToElasticsearch()
  console.log("Sync complete:", JSON.stringify(result, null, 2))
  process.exit(0)
}

main().catch(e => {
  console.error("Sync failed:", e.message)
  process.exit(1)
})
