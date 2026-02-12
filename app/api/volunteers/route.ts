import { NextResponse } from "next/server"
import { browseVolunteers } from "@/lib/actions"

export async function GET() {
  try {
    const volunteers = await browseVolunteers()
    return NextResponse.json({ volunteers })
  } catch (error) {
    console.error("Error fetching volunteers:", error)
    return NextResponse.json({ volunteers: [] }, { status: 500 })
  }
}
