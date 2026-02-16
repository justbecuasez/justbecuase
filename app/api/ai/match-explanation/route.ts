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
    const {
      volunteerSkills,
      volunteerBio,
      volunteerLocation,
      projectTitle,
      projectDescription,
      projectSkills,
      matchScore,
    } = body

    const { output } = await generateText({
      model: openai("gpt-4o-mini"),
      output: Output.object({
        schema: z.object({
          explanation: z.string().describe("A natural language explanation of why this is a good match (2-4 sentences)"),
          strengths: z.array(z.string()).describe("2-3 specific match strengths"),
          gaps: z.array(z.string()).describe("0-2 potential gaps or areas for growth"),
          compatibilityScore: z.string().describe("A one-word compatibility assessment: Excellent, Strong, Good, Fair"),
        }),
      }),
      prompt: `Explain why a volunteer is a good match for an NGO project.

VOLUNTEER:
- Skills: ${volunteerSkills?.join(", ") || "Not specified"}
- Bio: ${volunteerBio || "Not provided"}
- Location: ${volunteerLocation || "Not specified"}

PROJECT:
- Title: ${projectTitle}
- Description: ${projectDescription}
- Required Skills: ${projectSkills?.join(", ") || "Not specified"}
- Algorithm Match Score: ${matchScore || "Not provided"}

Provide a brief, natural language explanation of the match quality.
Focus on skill overlap, potential impact, and complementary abilities.
Be honest but encouraging — highlight strengths while acknowledging any gaps.`,
    })

    return NextResponse.json(output)
  } catch (error) {
    console.error("AI match explanation failed:", error)
    return NextResponse.json({ error: "Failed to generate match explanation" }, { status: 500 })
  }
}
