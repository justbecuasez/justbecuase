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
    const { projectTitle, projectDescription, projectSkills, volunteerName, volunteerSkills, volunteerBio } = body

    if (!projectTitle || !projectDescription) {
      return NextResponse.json({ error: "Project title and description are required" }, { status: 400 })
    }

    const { output } = await generateText({
      model: openai("gpt-4o-mini"),
      output: Output.object({
        schema: z.object({
          coverLetter: z.string().describe("A personalized, professional cover letter (200-350 words)"),
          tips: z.array(z.string()).describe("3-4 tips to improve the application"),
          keyStrengths: z.array(z.string()).describe("2-3 key strengths to highlight based on skill overlap"),
        }),
      }),
      prompt: `Generate a professional cover letter for a volunteer applying to an NGO project.

PROJECT DETAILS:
- Title: ${projectTitle}
- Description: ${projectDescription}
- Required Skills: ${projectSkills?.join(", ") || "Not specified"}

VOLUNTEER DETAILS:
- Name: ${volunteerName || "The volunteer"}
- Skills: ${volunteerSkills?.join(", ") || "Not specified"}
- Bio: ${volunteerBio || "Not provided"}

Write a compelling, genuine cover letter that:
1. Shows understanding of the project's mission
2. Highlights relevant skills and experience
3. Demonstrates passion for the cause
4. Is professional but warm
5. Is between 200-350 words

Also provide actionable tips and identify key strengths to highlight.`,
    })

    return NextResponse.json(output)
  } catch (error) {
    console.error("AI cover letter generation failed:", error)
    return NextResponse.json({ error: "Failed to generate cover letter" }, { status: 500 })
  }
}
