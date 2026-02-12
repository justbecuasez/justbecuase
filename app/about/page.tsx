import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { impactMetrics } from "@/lib/data"
import { getActiveTeamMembers } from "@/lib/actions"

// Render at request time (needs MongoDB connection)
export const dynamic = "force-dynamic"
import { Heart, Target, Users, Globe, Award, ArrowRight, Linkedin, Twitter, Clock, Sparkles, Code, Palette, BarChart3, BookOpen, Building2, Search, Handshake } from "lucide-react"

const values = [
  {
    icon: Heart,
    title: "Impact First",
    description: "Every decision we make is guided by the impact it will create for communities worldwide.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "We believe in the power of collective action and building strong impact agent communities.",
  },
  {
    icon: Target,
    title: "Excellence",
    description: "We strive to match the highest quality impact agents with NGOs for maximum effectiveness.",
  },
  {
    icon: Globe,
    title: "Accessibility",
    description: "Making skills-based contributions accessible to everyone, regardless of location or background.",
  },
]

const skills = [
  { icon: Code, name: "Developer" },
  { icon: Palette, name: "Designer" },
  { icon: BarChart3, name: "Strategist" },
  { icon: BookOpen, name: "Storyteller" },
]

export default async function AboutPage() {
  // Fetch team members from database
  const teamResult = await getActiveTeamMembers()
  const teamMembers = teamResult.success && teamResult.data ? teamResult.data : []

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Time is the New Currency</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">ABOUT US</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
              At <span className="font-semibold text-foreground">JustBeCause</span>, we believe the best actions don&apos;t need a &quot;why.&quot; We were founded on the simple idea that kindness, connection, and creativity are most powerful when they are spontaneous.
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
              We aren&apos;t here to meet a quota or follow a rigid corporate roadmap. We&apos;re here to build a community that celebrates doing things <span className="font-bold text-foreground">just because</span> it feels right, <span className="font-bold text-foreground">just because</span> it helps someone, and <span className="font-bold text-foreground">just because</span> we can.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {skills.map((skill) => (
                <div key={skill.name} className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full">
                  <skill.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{skill.name}</span>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              <a href="https://www.justbecausenetwork.com" className="text-primary hover:underline">www.justbecausenetwork.com</a> is a fully owned brand of Bizy Bees Asia Pte Ltd, Singapore.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <Link href="/auth/signup">Join Our Community</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent">
                <Link href="/projects">Browse Opportunities</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-4">Mission Statement</h2>
              </div>
              <Card className="border-2 border-primary/20">
                <CardContent className="p-8 md:p-12">
                  <div className="flex items-start gap-4">
                    <div className="hidden md:block">
                      <Target className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg md:text-xl text-foreground italic leading-relaxed">
                        "To accelerate social impact by seamlessly connecting mission-driven NGOs with the specialized talent they need to change the world."
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Our Platform */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">Our Platform</h2>
                <p className="text-lg text-muted-foreground">Precision Matching for Purpose-Driven Work</p>
              </div>

              <div className="mb-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Search className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground leading-relaxed">
                      The <span className="font-bold">JustBeCause Network</span> introduces an advanced AI search engine <span className="font-bold">JBCerta</span> specifically engineered for the unique ecosystem of NGOs and social impact talent. By moving beyond simple keyword searches, our platform uses intelligent filtering to ensure the <span className="font-bold">right role finds the right candidate</span>, and vice versa.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-bold text-foreground mb-6">Why It&apos;s a Game-Changer</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <h4 className="font-semibold text-foreground mb-2">For NGOs</h4>
                      <p className="text-sm text-muted-foreground">
                        Stop sifting through hundreds of mismatched resumes. Our AI analyzes candidate expertise, values, and past impact to present only those who truly align with your mission.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <h4 className="font-semibold text-foreground mb-2">For Talent</h4>
                      <p className="text-sm text-muted-foreground">
                        Don&apos;t waste time on roles that don&apos;t fit your skills or passion. Receive highly relevant opportunities curated to your specific professional profile and altruistic goals.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <Handshake className="h-6 w-6 text-primary" />
                      </div>
                      <h4 className="font-semibold text-foreground mb-2">Mutually Beneficial</h4>
                      <p className="text-sm text-muted-foreground">
                        By automating the heavy lifting of &quot;the search,&quot; we bridge the gap between world-changing organizations and the people who power them.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Impact Stats */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-primary/10 text-center">
                <p className="text-4xl font-bold text-primary mb-2">{impactMetrics.volunteers.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Active Impact Agents</p>
              </div>
              <div className="p-6 rounded-2xl bg-secondary/10 text-center">
                <p className="text-4xl font-bold text-secondary mb-2">{impactMetrics.projectsCompleted}</p>
                <p className="text-sm text-muted-foreground">Opportunities Completed</p>
              </div>
              <div className="p-6 rounded-2xl bg-success-light text-center">
                <p className="text-4xl font-bold text-success mb-2">{impactMetrics.ngosSupported}</p>
                <p className="text-sm text-muted-foreground">NGOs Supported</p>
              </div>
              <div className="p-6 rounded-2xl bg-accent text-center">
                <p className="text-4xl font-bold text-accent-foreground mb-2">
                  ${(impactMetrics.valueGenerated / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-muted-foreground">Value Created</p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Our Values</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                These core principles guide everything we do at JustBeCause Network
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value) => (
                <Card key={value.title} className="text-center">
                  <CardContent className="pt-8 pb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <value.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Meet Our Team</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Passionate individuals dedicated to connecting skills with purpose
              </p>
            </div>
            {teamMembers.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {teamMembers.map((member) => (
                  <div key={member._id?.toString()} className="text-center">
                    <img
                      src={member.avatar || "/placeholder.svg"}
                      alt={member.name}
                      className="w-32 h-32 rounded-full object-cover mx-auto mb-4 bg-muted"
                    />
                    <h3 className="font-semibold text-foreground">{member.name}</h3>
                    <p className="text-sm text-primary mb-2">{member.role}</p>
                    <p className="text-sm text-muted-foreground mb-3">{member.bio}</p>
                    <div className="flex justify-center gap-2">
                      {member.linkedinUrl && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer">
                            <Linkedin className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {member.twitterUrl && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={member.twitterUrl} target="_blank" rel="noopener noreferrer">
                            <Twitter className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Our team is growing! Check back soon.</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <Award className="h-12 w-12 mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl font-bold mb-4">Ready to Make an Impact?</h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
              Whether you're a skilled professional looking to give back or an NGO seeking expert help, we're here to
              connect you with opportunities that matter.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" variant="secondary">
                <Link href="/auth/signup">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link href="/projects">Browse Opportunities</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
