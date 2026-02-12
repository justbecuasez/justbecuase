import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getNGOProfile, browseVolunteers, getNGOSubscriptionStatus } from "@/lib/actions"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { NGOSidebar } from "@/components/dashboard/ngo-sidebar"
import { FindTalentClient } from "@/components/volunteers/find-talent-client"

export default async function NGOFindTalentPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect("/auth/signin")
  }

  if (session.user.role !== "ngo") {
    if (session.user.role === "volunteer") {
      redirect("/volunteer/dashboard")
    } else if (session.user.role === "admin") {
      redirect("/admin")
    } else {
      redirect("/auth/role-select")
    }
  }

  if (!session.user.isOnboarded) {
    redirect("/ngo/onboarding")
  }

  const ngoProfile = await getNGOProfile()
  const volunteers = await browseVolunteers()
  const ngoSubscription = await getNGOSubscriptionStatus()

  const serializedVolunteers = volunteers.map((v: any) => ({
    id: v.id || "",
    userId: v.id,
    name: v.name || undefined,
    avatar: v.avatar || undefined,
    headline: (v as any).bio?.slice(0, 60) || undefined,
    location: v.location,
    city: v.location?.split(',')[0]?.trim(),
    country: v.location?.split(',')[1]?.trim(),
    hoursPerWeek: typeof v.hoursPerWeek === 'number' ? v.hoursPerWeek : parseInt(v.hoursPerWeek) || 10,
    skills: v.skills,
    volunteerType: v.volunteerType as "free" | "paid" | "both" | undefined,
    hourlyRate: v.hourlyRate || undefined,
    discountedRate: v.discountedRate || undefined,
    currency: v.currency || "USD",
    rating: v.rating,
    completedProjects: v.completedProjects,
    freeHoursPerMonth: v.freeHoursPerMonth,
  }))

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        userType="ngo"
        userName={ngoProfile?.organizationName || session.user.name || "NGO"}
        userAvatar={ngoProfile?.logo || session.user.image || undefined}
      />

      <div className="flex">
        <NGOSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Find Talent</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Browse skilled impact agents to help with your opportunities
            </p>
          </div>

          <FindTalentClient 
            volunteers={serializedVolunteers}
            subscriptionPlan={ngoSubscription?.plan || "free"}
          />
        </main>
      </div>
    </div>
  )
}
