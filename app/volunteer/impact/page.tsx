import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { VolunteerSidebar } from "@/components/dashboard/volunteer-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getVolunteerProfile, getUserBadges, getReviewsForUser } from "@/lib/actions"
import { Trophy, Award, Clock, FolderKanban, Star, TrendingUp, Shield, Target } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function getLevelInfo(hours: number) {
  if (hours >= 500) return { level: "Platinum", color: "bg-purple-500", icon: "💎", next: null, progress: 100 }
  if (hours >= 200) return { level: "Gold", color: "bg-yellow-500", icon: "🥇", next: 500, progress: (hours / 500) * 100 }
  if (hours >= 50) return { level: "Silver", color: "bg-gray-400", icon: "🥈", next: 200, progress: (hours / 200) * 100 }
  return { level: "Bronze", color: "bg-amber-600", icon: "🥉", next: 50, progress: (hours / 50) * 100 }
}

export default async function ImpactDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/auth/signin")

  // Role verification
  if (session.user.role !== "volunteer") {
    if (session.user.role === "ngo") redirect("/ngo/dashboard")
    else if (session.user.role === "admin") redirect("/admin")
    else redirect("/auth/role-select")
  }

  // Redirect to onboarding if not completed
  if (!session.user.isOnboarded) redirect("/volunteer/onboarding")

  const profile = await getVolunteerProfile()
  if (!profile) redirect("/volunteer/onboarding")

  const [badgesResult, reviewsResult] = await Promise.all([
    getUserBadges(session.user.id),
    getReviewsForUser(session.user.id),
  ])

  const badges = badgesResult.success ? badgesResult.data || [] : []
  const reviews = reviewsResult.success ? reviewsResult.data || [] : []
  const earnedBadges = badges.filter((b: any) => b.earned)
  const hours = profile.hoursContributed || 0
  const projects = profile.completedProjects || 0
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum: number, r: any) => sum + r.overallRating, 0) / reviews.length
    : 0

  const levelInfo = getLevelInfo(hours)
  const estimatedValue = hours * 1500 // ~₹1500/hr estimated value

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userType="volunteer" userName={profile.name || session.user.name} userAvatar={profile.avatar || session.user.image || undefined} />
      <div className="flex">
        <VolunteerSidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">Your Impact Dashboard</h1>
              <p className="text-muted-foreground">See the difference you&apos;re making in the world</p>
            </div>

            {/* Level Card */}
            <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="text-5xl">{levelInfo.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-foreground">{levelInfo.level} Impact Agent</h2>
                      <Badge className={`${levelInfo.color} text-white`}>{levelInfo.level}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {levelInfo.next
                        ? `${levelInfo.next - hours} more hours to reach the next level`
                        : "You've reached the highest level — incredible!"}
                    </p>
                    <Progress value={levelInfo.progress} className="h-3" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FolderKanban className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{projects}</p>
                    <p className="text-xs text-muted-foreground">Projects Completed</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{hours}</p>
                    <p className="text-xs text-muted-foreground">Hours Contributed</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Average Rating</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      ₹{estimatedValue.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Value Created</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Badges */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      Badges
                    </CardTitle>
                    <Badge variant="secondary">
                      {earnedBadges.length}/{badges.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {badges.map((badge: any) => (
                      <div
                        key={badge.badgeId}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          badge.earned
                            ? "bg-primary/5 border-primary/30"
                            : "opacity-40 grayscale"
                        }`}
                      >
                        <div className="text-2xl mb-1">{badge.icon}</div>
                        <p className="text-xs font-medium text-foreground truncate">
                          {badge.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {badge.earned ? "Earned!" : badge.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Reviews */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No reviews yet</p>
                      <p className="text-xs text-muted-foreground">
                        Complete projects to receive reviews from NGOs
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviews.slice(0, 5).map((review: any, i: number) => (
                        <div key={i} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{review.reviewerName || "NGO"}</span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${
                                    star <= review.overallRating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Impact Certificate */}
            {projects >= 1 && (
              <Card className="mt-8">
                <CardContent className="p-6 text-center">
                  <Shield className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-1">Impact Certificate Available</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You&apos;ve completed {projects} project{projects !== 1 ? "s" : ""} and contributed {hours} hours.
                    Your verified impact certificate is ready.
                  </p>
                  <Badge className="text-sm px-4 py-1">
                    Certificate ID: JBC-{session.user.id.slice(-8).toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
