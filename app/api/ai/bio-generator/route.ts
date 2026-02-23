import { generateText, Output } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await req.json()
    const { name, skills, causes, completedProjects, hoursContributed, location, currentBio } = body

    // Determine experience level for honest tone
    const projectCount = completedProjects || 0
    const hours = hoursContributed || 0
    let experienceContext = ""
    if (projectCount === 0 && hours === 0) {
      experienceContext = "\n\nIMPORTANT: This volunteer has 0 completed projects and 0 hours. Do NOT mention \"track record\", \"proven impact\", or \"extensive experience\". Focus on their skills, aspirations, and what they can offer. Be honest — they are new."
    } else if (projectCount <= 2) {
      experienceContext = `\n\nNOTE: This volunteer has only ${projectCount} project(s) and ${hours} hours. Don't oversell their experience. Be proportionate.`
    }

    const { output } = await generateText({
      model: openai("gpt-5.2"),
      output: Output.object({
        schema: z.object({
          bio: z.string().describe("A professional, honest bio (80-150 words)"),
          headline: z.string().describe("A catchy one-line headline for their profile"),
          highlights: z.array(z.string()).describe("2-4 key highlights based on ACTUAL skills and experience"),
          keywords: z.array(z.string()).describe("5-7 SEO-friendly keywords for their profile"),
        }),
      }),
      prompt: `Generate an honest professional bio for a volunteer on a social impact platform.

VOLUNTEER DETAILS:
- Name: ${name || "Not specified"}
- Skills: ${skills?.join(", ") || "Not specified"}
- Causes they care about: ${causes?.join(", ") || "Not specified"}
- Completed Projects: ${projectCount}
- Hours Contributed: ${hours}
- Location: ${location || "Not specified"}
- Current Bio: ${currentBio || "None"}
${experienceContext}

Write a bio that:
1. Is professional but personable
2. Honestly represents their experience level
3. Mentions their key skills naturally
4. Is between 80-150 words
5. If they have 0 projects/hours, focus on skills and aspirations — NOT fake track record
6. NEVER say "proven track record" or "extensive experience" for someone with 0-1 projects

Also generate:
- A catchy headline (like LinkedIn)
- Key profile highlights (based on ACTUAL data, not invented)
- SEO keywords for discoverability`,
    })

    return NextResponse.json(output)
  } catch (error) {
    console.error("AI bio generation failed:", error)
    return NextResponse.json({ error: "Failed to generate bio" }, { status: 500 })
  }
}
