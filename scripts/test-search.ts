import { config } from "dotenv"
config({ path: ".env.local" })

const QUERIES = [
  "free web developer",
  "cheap designer under 500",
  "expert marketing 10 years",
  "beginner friendly remote project",
  "verified NGO education",
  "weekend volunteer graphic design",
  "remote react developer",
  "urgent volunteer needed",
  "top rated fundraising expert",
  "pro bono legal help",
]

async function main() {
  const { elasticSearch } = await import("../lib/es-search")
  
  for (const query of QUERIES) {
    console.log(`\n${"=".repeat(70)}`)
    console.log(`QUERY: "${query}"`)
    console.log("=".repeat(70))
    const result = await elasticSearch({
      query,
      types: ["volunteer", "ngo", "project"],
      limit: 3,
    })
    console.log(`Results: ${result.results.length} of ${result.total}`)
    for (const r of result.results) {
      console.log(`  [${r.type}] ${r.title} (score: ${r.score?.toFixed(2)})`)
      const m = r.metadata
      console.log(`    location=${m.city || m.country || ""} verified=${m.isVerified} rate=${m.hourlyRate || "N/A"} volunteerType=${m.volunteerType || "N/A"}`)
      if (m.skillNames?.length) console.log(`    skills=${JSON.stringify(m.skillNames).substring(0, 120)}`)
    }
  }
  process.exit(0)
}

main().catch(e => {
  console.error("Error:", e.message)
  process.exit(1)
})
