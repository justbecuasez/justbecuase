import { NextResponse } from "next/server"
import { adminSettingsDb } from "@/lib/database"

// GET /api/settings - Get public platform settings (no auth required)
export async function GET() {
  try {
    const settings = await adminSettingsDb.get()
    
    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        success: true,
        data: {
          platformName: "JustBeCause Network",
          platformDescription: "Connecting Skills with Purpose",
          supportEmail: "support@justbecausenetwork.com",
          currency: "INR",
          volunteerFreeApplicationsPerMonth: 3,
          volunteerProPrice: 1, // TEST PRICE (use 999 for production)
          volunteerProFeatures: [
            "Unlimited job applications",
            "Featured profile badge",
            "Priority in search results",
            "Direct message NGOs",
            "Early access to opportunities",
            "Profile analytics",
            "Certificate downloads",
          ],
          ngoFreeProjectsPerMonth: 3,
          ngoFreeProfileUnlocksPerMonth: 0,
          ngoProPrice: 1, // TEST PRICE (use 2999 for production)
          ngoProFeatures: [
            "Unlimited projects",
            "Unlimited profile unlocks",
            "Advanced AI-powered matching",
            "Priority support",
            "Project analytics & reports",
            "Featured NGO badge",
            "Bulk volunteer outreach",
          ],
          enablePayments: true,
          enableMessaging: true,
          metaTitle: "JustBeCause Network - Connect NGOs with Volunteers",
          metaDescription: "Platform connecting NGOs with skilled volunteers for social impact",
        }
      })
    }
    
    // Return only public settings (exclude sensitive data)
    return NextResponse.json({
      success: true,
      data: {
        platformName: settings.platformName,
        platformDescription: settings.platformDescription,
        supportEmail: settings.supportEmail,
        platformLogo: settings.platformLogo,
        currency: settings.currency,
        volunteerFreeApplicationsPerMonth: settings.volunteerFreeApplicationsPerMonth,
        volunteerProPrice: settings.volunteerProPrice,
        volunteerProFeatures: settings.volunteerProFeatures || [],
        ngoFreeProjectsPerMonth: settings.ngoFreeProjectsPerMonth,
        ngoFreeProfileUnlocksPerMonth: settings.ngoFreeProfileUnlocksPerMonth,
        ngoProPrice: settings.ngoProPrice,
        ngoProFeatures: settings.ngoProFeatures || [],
        enablePayments: settings.enablePayments,
        enableMessaging: settings.enableMessaging,
        metaTitle: settings.metaTitle,
        metaDescription: settings.metaDescription,
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
        socialLinks: settings.socialLinks,
      }
    })
  } catch (error) {
    console.error("Failed to fetch platform settings:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch settings" }, { status: 500 })
  }
}
