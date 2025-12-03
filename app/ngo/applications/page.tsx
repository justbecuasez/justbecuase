"use client"

import { useState } from "react"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { NGOSidebar } from "@/components/dashboard/ngo-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { sampleNGOs, sampleVolunteers, sampleProjects } from "@/lib/data"
import { Search, Star, Clock, CheckCircle, XCircle, MessageSquare, ExternalLink, Filter } from "lucide-react"

const applicationStatuses = ["pending", "accepted", "declined"] as const
type ApplicationStatus = (typeof applicationStatuses)[number]

interface Application {
  id: string
  volunteer: (typeof sampleVolunteers)[0]
  project: (typeof sampleProjects)[0]
  status: ApplicationStatus
  appliedDate: string
  message: string
}

const mockApplications: Application[] = sampleVolunteers.flatMap((volunteer, vIndex) =>
  sampleProjects.slice(0, 2).map((project, pIndex) => ({
    id: `${volunteer.id}-${project.id}`,
    volunteer,
    project,
    status: (["pending", "accepted", "declined"] as const)[vIndex % 3],
    appliedDate: `Dec ${5 + vIndex + pIndex}, 2025`,
    message:
      "I am very excited about this opportunity to contribute my skills. I have extensive experience in this area and believe I can make a meaningful impact on your project.",
  })),
)

export default function ApplicationsPage() {
  const ngo = sampleNGOs[0]
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const pendingCount = mockApplications.filter((a) => a.status === "pending").length
  const acceptedCount = mockApplications.filter((a) => a.status === "accepted").length

  const handleViewApplication = (application: Application) => {
    setSelectedApplication(application)
    setIsDetailOpen(true)
  }

  const ApplicationCard = ({ application }: { application: Application }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <img
            src={application.volunteer.avatar || "/placeholder.svg"}
            alt={application.volunteer.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-foreground">{application.volunteer.name}</h3>
                <p className="text-sm text-muted-foreground">{application.volunteer.location}</p>
              </div>
              <Badge
                className={
                  application.status === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : application.status === "accepted"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                }
              >
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </Badge>
            </div>

            <p className="text-sm text-foreground mb-2">
              Applied for: <span className="font-medium">{application.project.title}</span>
            </p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                {application.volunteer.rating}
              </span>
              <span>{application.volunteer.completedProjects} projects</span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {application.appliedDate}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {application.volunteer.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs bg-accent text-accent-foreground">
                  {skill}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => handleViewApplication(application)}>
                View Application
              </Button>
              {application.status === "pending" && (
                <>
                  <Button size="sm" variant="outline" className="bg-transparent text-success border-success">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" className="bg-transparent text-destructive border-destructive">
                    <XCircle className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </>
              )}
              {application.status === "accepted" && (
                <Button size="sm" variant="outline" className="bg-transparent">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Message
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userType="ngo" userName={ngo.name} userAvatar={ngo.logo} />

      <div className="flex">
        <NGOSidebar />

        <main className="flex-1 p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Applications</h1>
            <p className="text-muted-foreground">Review and manage volunteer applications for your projects</p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, skills, or project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="bg-transparent">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
              <TabsTrigger value="accepted">Accepted ({acceptedCount})</TabsTrigger>
              <TabsTrigger value="all">All Applications</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {mockApplications
                .filter((a) => a.status === "pending")
                .map((application) => (
                  <ApplicationCard key={application.id} application={application} />
                ))}
            </TabsContent>

            <TabsContent value="accepted" className="space-y-4">
              {mockApplications
                .filter((a) => a.status === "accepted")
                .map((application) => (
                  <ApplicationCard key={application.id} application={application} />
                ))}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {mockApplications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Application Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl bg-background">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>Review the volunteer's application and profile</DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Volunteer Info */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                <img
                  src={selectedApplication.volunteer.avatar || "/placeholder.svg"}
                  alt={selectedApplication.volunteer.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{selectedApplication.volunteer.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedApplication.volunteer.headline}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      {selectedApplication.volunteer.rating}
                    </span>
                    <span>{selectedApplication.volunteer.completedProjects} projects completed</span>
                    <span>{selectedApplication.volunteer.hoursContributed} hours contributed</span>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="bg-transparent">
                  <Link href={`/volunteers/${selectedApplication.volunteer.id}`}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Profile
                  </Link>
                </Button>
              </div>

              {/* Project */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Applied for</p>
                <p className="font-medium text-foreground">{selectedApplication.project.title}</p>
              </div>

              {/* Application Message */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Application Message</p>
                <p className="text-foreground bg-muted/50 p-4 rounded-lg">{selectedApplication.message}</p>
              </div>

              {/* Skills */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {selectedApplication.volunteer.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="bg-accent text-accent-foreground">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <DialogFooter>
                {selectedApplication.status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      className="bg-transparent text-destructive border-destructive"
                      onClick={() => setIsDetailOpen(false)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                    <Button className="bg-success text-success-foreground hover:bg-success/90">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept Application
                    </Button>
                  </>
                )}
                {selectedApplication.status === "accepted" && (
                  <Button className="bg-primary hover:bg-primary/90">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message Volunteer
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
