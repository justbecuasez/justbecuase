import { Suspense } from "react"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getVolunteerProfile, getMatchedOpportunitiesForVolunteer, hasAppliedToProject } from "@/lib/actions"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { VolunteerSidebar } from "@/components/dashboard/volunteer-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ApplyButton } from "@/app/projects/[id]/apply-button"
import { OpportunitiesBrowser } from "./opportunities-browser"
import Link from "next/link"
import {
  Clock,
  MapPin,
  Calendar,
  Users,
  Sparkles,
} from "lucide-react"

export default async function VolunteerOpportunitiesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect("/auth/signin")
  }

  // Role verification: Ensure user is a volunteer
  if (session.user.role !== "volunteer") {
    if (session.user.role === "ngo") {
      redirect("/ngo/dashboard")
    } else if (session.user.role === "admin") {
      redirect("/admin")
    } else {
      redirect("/auth/role-select")
    }
  }

  // Redirect to onboarding if not completed
  if (!session.user.isOnboarded) {
    redirect("/volunteer/onboarding")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        userType="volunteer"
        userName={session.user.name || "Volunteer"}
        userAvatar={session.user.image || undefined}
      />

      <div className="flex">
        <VolunteerSidebar />

        <main className="flex-1 p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Browse Opportunities</h1>
            <p className="text-muted-foreground">
              Find volunteer opportunities that match your skills
            </p>
          </div>

          {/* Recommended Section — always visible, server-rendered */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Recommended for You</h2>
            </div>
            <Suspense fallback={<OpportunitiesSkeleton />}>
              <RecommendedOpportunities />
            </Suspense>
          </div>

          {/* All Opportunities — client component with search + filters */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">All Opportunities</h2>
            <OpportunitiesBrowser />
          </div>
        </main>
      </div>
    </div>
  )
}

async function RecommendedOpportunities() {
  const matches = await getMatchedOpportunitiesForVolunteer()

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            Complete your profile to get personalized recommendations
          </p>
          <Button variant="link" asChild>
            <Link href="/volunteer/profile">Complete Profile</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {await Promise.all(matches.slice(0, 6).map(async (match) => (
        <OpportunityCard
          key={match.projectId}
          project={match.project}
          matchScore={match.score}
        />
      )))}
    </div>
  )
}

async function OpportunityCard({
  project,
  matchScore,
}: {
  project: any
  matchScore?: number
}) {
  const projectId = project._id?.toString() || ""
  const hasApplied = await hasAppliedToProject(projectId)
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <Badge variant="outline" className="text-xs">
            {project.projectType}
          </Badge>
          {matchScore !== undefined && (
            <Badge
              className={
                matchScore >= 70
                  ? "bg-green-100 text-green-700"
                  : matchScore >= 50
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-700"
              }
            >
              {Math.round(matchScore)}% match
            </Badge>
          )}
        </div>

        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
          {project.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {project.description}
        </p>

        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {project.workMode}
            {project.location && ` • ${project.location}`}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {project.timeCommitment}
          </div>
          {project.deadline && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Deadline: {new Date(project.deadline).toLocaleDateString()}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {project.applicantsCount} applicants
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {project.skillsRequired?.slice(0, 3).map((skill: any, i: number) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {skill.subskillId}
            </Badge>
          ))}
          {project.skillsRequired?.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{project.skillsRequired.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/projects/${projectId}`}>
              View Details
            </Link>
          </Button>
          <div className="flex-1">
            <ApplyButton 
              projectId={projectId}
              projectTitle={project.title}
              hasApplied={hasApplied}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function OpportunitiesSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="h-48 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
