import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { sampleVolunteers, sampleProjects } from "@/lib/data"
import { Star, MapPin, Clock, CheckCircle, ExternalLink, Award, TrendingUp, Calendar } from "lucide-react"

export default async function VolunteerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const volunteer = sampleVolunteers.find((v) => v.id === id) || sampleVolunteers[0]

  const completedProjects = sampleProjects.slice(0, 3).map((p) => ({
    ...p,
    completedDate: "Nov 2025",
    testimonial: "Excellent work! Very professional and delivered beyond expectations.",
  }))

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <img
                src={volunteer.avatar || "/placeholder.svg"}
                alt={volunteer.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-background shadow-xl"
              />
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-foreground mb-2">{volunteer.name}</h1>
                <p className="text-lg text-muted-foreground mb-4">{volunteer.headline}</p>

                <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mb-4">
                  <div className="flex items-center gap-1 text-foreground">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {volunteer.location}
                  </div>
                  <div className="flex items-center gap-1 text-foreground">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    {volunteer.rating} rating
                  </div>
                  <div className="flex items-center gap-1 text-foreground">
                    <CheckCircle className="h-4 w-4 text-success" />
                    {volunteer.completedProjects} projects completed
                  </div>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  {volunteer.skills.map((skill) => (
                    <Badge key={skill} className="bg-primary/10 text-primary border-0">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button className="bg-primary hover:bg-primary/90">Contact Volunteer</Button>
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
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed">
                    Experienced marketing professional with over 10 years in digital marketing and brand strategy.
                    Passionate about using my skills to support causes I believe in, particularly in education and
                    environmental sustainability.
                  </p>
                  <p className="text-foreground leading-relaxed mt-4">
                    I specialize in helping organizations build their online presence, develop content strategies, and
                    create impactful marketing campaigns. Through pro bono work, I've helped NGOs increase their reach
                    by an average of 150% and improve donor engagement.
                  </p>
                </CardContent>
              </Card>

              {/* Portfolio */}
              <Card>
                <CardHeader>
                  <CardTitle>Completed Projects</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {completedProjects.map((project) => (
                    <div key={project.id} className="p-4 rounded-lg border border-border">
                      <div className="flex items-start gap-4">
                        <img
                          src={project.ngo.logo || "/placeholder.svg"}
                          alt={project.ngo.name}
                          className="w-12 h-12 rounded-lg object-cover bg-muted"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{project.title}</h4>
                          <p className="text-sm text-muted-foreground">{project.ngo.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            Completed {project.completedDate}
                          </p>
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm text-foreground italic">"{project.testimonial}"</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Impact Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Impact Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Hours Contributed</span>
                    <span className="font-semibold text-foreground">{volunteer.hoursContributed}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Projects Completed</span>
                    <span className="font-semibold text-foreground">{volunteer.completedProjects}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                    <span className="text-sm text-primary">Estimated Value</span>
                    <span className="font-semibold text-primary">
                      ${(volunteer.hoursContributed * 75).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Badges */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-secondary" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Star className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Top Rated</p>
                      <p className="text-xs text-muted-foreground">5.0 rating average</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">100+ Hours</p>
                      <p className="text-xs text-muted-foreground">Volunteer milestone</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">10 Projects</p>
                      <p className="text-xs text-muted-foreground">Completed milestone</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Links */}
              <Card>
                <CardHeader>
                  <CardTitle>Connect</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                    <Link href="#">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      LinkedIn Profile
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                    <Link href="#">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Portfolio Website
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
