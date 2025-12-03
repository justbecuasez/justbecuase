import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectCard } from "@/components/project-card"
import { sampleNGOs, sampleProjects, sampleVolunteers } from "@/lib/data"
import { MapPin, CheckCircle, Users, FolderKanban, ExternalLink, Globe, Heart } from "lucide-react"

export default async function NGOProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ngo = sampleNGOs.find((n) => n.id === id) || sampleNGOs[0]
  const ngoProjects = sampleProjects.filter((p) => p.ngo.name === ngo.name || true).slice(0, 4)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <div className="bg-gradient-to-r from-secondary/10 to-primary/10 py-12">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <img
                src={ngo.logo || "/placeholder.svg"}
                alt={ngo.name}
                className="w-32 h-32 rounded-2xl object-cover border-4 border-background shadow-xl bg-muted"
              />
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">{ngo.name}</h1>
                  {ngo.verified && <CheckCircle className="h-6 w-6 text-primary" />}
                </div>
                <p className="text-lg text-muted-foreground mb-4">{ngo.mission}</p>

                <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mb-4">
                  <div className="flex items-center gap-1 text-foreground">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {ngo.location}
                  </div>
                  <div className="flex items-center gap-1 text-foreground">
                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    {ngo.projectsCompleted} projects completed
                  </div>
                  <div className="flex items-center gap-1 text-foreground">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {ngo.volunteersEngaged} volunteers engaged
                  </div>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  {ngo.causes.map((cause) => (
                    <Badge key={cause} className="bg-secondary/10 text-secondary border-0">
                      {cause}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button className="bg-primary hover:bg-primary/90">
                  <Heart className="h-4 w-4 mr-2" />
                  Follow Organization
                </Button>
                <Button variant="outline" className="bg-transparent">
                  <Globe className="h-4 w-4 mr-2" />
                  Visit Website
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-6 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <Card>
                <CardHeader>
                  <CardTitle>About {ngo.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed">{ngo.mission}</p>
                  <p className="text-foreground leading-relaxed mt-4">
                    Founded in 2015, {ngo.name} has been working tirelessly to create positive change in our
                    communities. Through innovative programs and partnerships, we've impacted thousands of lives across
                    the region.
                  </p>
                  <p className="text-foreground leading-relaxed mt-4">
                    Our team of dedicated staff and volunteers work together to develop and implement programs that
                    address the most pressing challenges facing our communities today. We believe in the power of
                    collective action and strive to create sustainable, long-lasting change.
                  </p>
                </CardContent>
              </Card>

              {/* Open Projects */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">Open Projects</h2>
                  <Button asChild variant="outline" className="bg-transparent">
                    <Link href="/projects">View All</Link>
                  </Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  {ngoProjects.slice(0, 4).map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>

              {/* Success Stories */}
              <Card>
                <CardHeader>
                  <CardTitle>Volunteer Testimonials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sampleVolunteers.slice(0, 2).map((volunteer) => (
                    <div key={volunteer.id} className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-start gap-4">
                        <img
                          src={volunteer.avatar || "/placeholder.svg"}
                          alt={volunteer.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-foreground italic mb-2">
                            "Working with {ngo.name} was an incredible experience. The team was organized,
                            communicative, and truly passionate about their mission. I felt like my contribution really
                            mattered."
                          </p>
                          <p className="text-sm font-medium text-foreground">{volunteer.name}</p>
                          <p className="text-sm text-muted-foreground">{volunteer.skills[0]} Volunteer</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Impact Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Impact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 rounded-lg bg-primary/10">
                    <p className="text-3xl font-bold text-primary">{ngo.projectsCompleted}</p>
                    <p className="text-sm text-muted-foreground">Projects Completed</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xl font-bold text-foreground">{ngo.volunteersEngaged}</p>
                      <p className="text-xs text-muted-foreground">Volunteers</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xl font-bold text-foreground">$45K</p>
                      <p className="text-xs text-muted-foreground">Value Created</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Organization Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Organization Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Established</span>
                    <span className="text-sm font-medium text-foreground">2015</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Team Size</span>
                    <span className="text-sm font-medium text-foreground">15-25 staff</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className="bg-success-light text-success">Verified</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Connect</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                    <Link href="#">
                      <Globe className="h-4 w-4 mr-2" />
                      Website
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                    <Link href="#">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Facebook
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                    <Link href="#">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Instagram
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
