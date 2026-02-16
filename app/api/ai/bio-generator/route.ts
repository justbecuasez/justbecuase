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

    const { output } = await generateText({
      model: openai("gpt-4o-mini"),
      output: Output.object({
        schema: z.object({
          bio: z.string().describe("A professional, compelling bio (80-150 words)"),
          headline: z.string().describe("A catchy one-line headline for their profile"),
          highlights: z.array(z.string()).describe("3-4 key highlights to showcase"),
          keywords: z.array(z.string()).describe("5-7 SEO-friendly keywords for their profile"),
        }),
      }),
      prompt: `Generate a professional bio for a volunteer on a social impact platform.

VOLUNTEER DETAILS:
- Name: ${name || "Not specified"}
- Skills: ${skills?.join(", ") || "Not specified"}
- Causes they care about: ${causes?.join(", ") || "Not specified"}
- Completed Projects: ${completedProjects || 0}
- Hours Contributed: ${hoursContributed || 0}
- Location: ${location || "Not specified"}
- Current Bio: ${currentBio || "None"}

Write a bio that:
1. Is professional but personable
2. Highlights their expertise and impact
3. Shows their passion for social good
4. Mentions their key skills naturally
5. Is between 80-150 words
6. Would appeal to NGOs looking for skilled professionals

Also generate:
- A catchy headline (like LinkedIn)
- Key profile highlights
- SEO keywords for discoverability`,
    })

    return NextResponse.json(output)
  } catch (error) {
    console.error("AI bio generation failed:", error)
    return NextResponse.json({ error: "Failed to generate bio" }, { status: 500 })
  }
}
