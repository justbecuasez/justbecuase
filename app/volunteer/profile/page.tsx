"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { VolunteerSidebar } from "@/components/dashboard/volunteer-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { sampleVolunteers } from "@/lib/data"
import { Camera, Save, Plus, X, Loader2, CheckCircle } from "lucide-react"

const allSkills = [
  "Marketing",
  "Social Media",
  "Content Strategy",
  "Web Development",
  "UI/UX Design",
  "Graphic Design",
  "Branding",
  "Grant Writing",
  "Finance",
  "Legal",
  "HR",
  "Training",
  "Strategy",
  "Research",
  "Data Analysis",
  "Project Management",
  "Fundraising",
  "Communications",
  "Public Relations",
  "SEO",
]

const locations = [
  "Singapore",
  "Hong Kong",
  "Jakarta, Indonesia",
  "Manila, Philippines",
  "Mumbai, India",
  "Tokyo, Japan",
  "Seoul, South Korea",
  "Bangkok, Thailand",
  "Kuala Lumpur, Malaysia",
]

export default function VolunteerProfileEditPage() {
  const volunteer = sampleVolunteers[0]
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [formData, setFormData] = useState({
    name: volunteer.name,
    headline: volunteer.headline,
    location: volunteer.location,
    bio: "Experienced marketing professional with over 10 years in digital marketing and brand strategy. Passionate about using my skills to support causes I believe in, particularly in education and environmental sustainability.",
    skills: [...volunteer.skills],
    linkedin: "https://linkedin.com/in/sarahchen",
    portfolio: "https://sarahchen.design",
    availability: "10-15",
  })

  const profileCompletion = 85

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userType="volunteer" userName={volunteer.name} userAvatar={volunteer.avatar} />

      <div className="flex">
        <VolunteerSidebar />

        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Edit Profile</h1>
                <p className="text-muted-foreground">Update your information to help NGOs find you</p>
              </div>
              <Button asChild variant="outline" className="bg-transparent">
                <Link href={`/volunteers/${volunteer.id}`}>View Public Profile</Link>
              </Button>
            </div>

            {/* Profile Completion */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Profile Completion</span>
                  <span className="text-sm font-medium text-primary">{profileCompletion}%</span>
                </div>
                <Progress value={profileCompletion} className="h-2 mb-4" />
                <p className="text-sm text-muted-foreground">
                  Complete your profile to increase your chances of being matched with projects.
                </p>
              </CardContent>
            </Card>

            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="skills">Skills & Experience</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                </TabsList>

                <TabsContent value="basic">
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                      <CardDescription>Your personal details and bio</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Avatar */}
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <img
                            src={volunteer.avatar || "/placeholder.svg"}
                            alt={volunteer.name}
                            className="w-24 h-24 rounded-full object-cover"
                          />
                          <button
                            type="button"
                            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90"
                          >
                            <Camera className="h-4 w-4" />
                          </button>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Profile Photo</p>
                          <p className="text-sm text-muted-foreground">JPG or PNG. Max 2MB.</p>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Select
                            value={formData.location}
                            onValueChange={(value) => setFormData({ ...formData, location: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {locations.map((loc) => (
                                <SelectItem key={loc} value={loc}>
                                  {loc}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="headline">Professional Headline</Label>
                        <Input
                          id="headline"
                          value={formData.headline}
                          onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                          placeholder="e.g., Senior Marketing Manager | Pro Bono Consultant"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          rows={4}
                          placeholder="Tell NGOs about yourself, your experience, and why you volunteer..."
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="linkedin">LinkedIn URL</Label>
                          <Input
                            id="linkedin"
                            type="url"
                            value={formData.linkedin}
                            onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                            placeholder="https://linkedin.com/in/yourprofile"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="portfolio">Portfolio URL</Label>
                          <Input
                            id="portfolio"
                            type="url"
                            value={formData.portfolio}
                            onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                            placeholder="https://yourportfolio.com"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="skills">
                  <Card>
                    <CardHeader>
                      <CardTitle>Skills & Expertise</CardTitle>
                      <CardDescription>Select the skills you can offer to NGOs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Label>Your Skills (select all that apply)</Label>
                        <div className="flex flex-wrap gap-2">
                          {allSkills.map((skill) => (
                            <Badge
                              key={skill}
                              variant={formData.skills.includes(skill) ? "default" : "outline"}
                              className={`cursor-pointer transition-colors ${
                                formData.skills.includes(skill)
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-primary/10 hover:border-primary"
                              }`}
                              onClick={() => toggleSkill(skill)}
                            >
                              {formData.skills.includes(skill) ? (
                                <X className="h-3 w-3 mr-1" />
                              ) : (
                                <Plus className="h-3 w-3 mr-1" />
                              )}
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formData.skills.length} skills selected. More skills help you match with more projects.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="preferences">
                  <Card>
                    <CardHeader>
                      <CardTitle>Volunteering Preferences</CardTitle>
                      <CardDescription>Set your availability and preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="availability">Weekly Availability</Label>
                        <Select
                          value={formData.availability}
                          onValueChange={(value) => setFormData({ ...formData, availability: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-5">1-5 hours per week</SelectItem>
                            <SelectItem value="5-10">5-10 hours per week</SelectItem>
                            <SelectItem value="10-15">10-15 hours per week</SelectItem>
                            <SelectItem value="15+">15+ hours per week</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Preferred Causes</Label>
                        <div className="flex flex-wrap gap-2">
                          {["Education", "Environment", "Health", "Poverty", "Youth", "Community"].map((cause) => (
                            <Badge key={cause} variant="outline" className="cursor-pointer hover:bg-primary/10">
                              {cause}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Preferred Project Types</Label>
                        <div className="flex flex-wrap gap-2">
                          {["Virtual", "One-hour consultation", "Short-term", "Long-term"].map((type) => (
                            <Badge key={type} variant="outline" className="cursor-pointer hover:bg-primary/10">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Save Button */}
              <div className="flex justify-end mt-8">
                <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : isSaved ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
