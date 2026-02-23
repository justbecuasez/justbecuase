import { config } from "dotenv"
config({ path: ".env.local" })

async function main() {
  const { elasticSearch } = await import("../lib/es-search")
  const result = await elasticSearch({
    query: "web developer 10 years of experience",
    types: ["volunteer", "ngo", "project"],
    limit: 5,
  })
  console.log(`Results: ${result.results.length} of ${result.total}`)
  for (const r of result.results) {
    console.log(`  [${r.type}] ${r.title} (score: ${r.score?.toFixed(2)}) — ${r.subtitle?.substring(0, 80)}`)
    const m = r.metadata
    console.log(`    city=${m.city} verified=${m.isVerified} skills=${JSON.stringify(m.skillNames)?.substring(0, 100)}`)
  }
  process.exit(0)
}

main().catch(e => {
  console.error("Error:", e.message)
  process.exit(1)
})
