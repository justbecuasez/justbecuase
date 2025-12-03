"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Heart, Mail, Lock, User, Building2, MapPin, Loader2, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react"

type AccountType = "volunteer" | "ngo" | null

export default function SignUpPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [accountType, setAccountType] = useState<AccountType>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    location: "",
    orgName: "",
    registrationNumber: "",
    causes: [] as string[],
    skills: [] as string[],
    agreeTerms: false,
  })

  const skillOptions = [
    "Marketing",
    "Web Development",
    "Graphic Design",
    "Finance",
    "Legal",
    "Strategy",
    "HR",
    "Fundraising",
    "Content Writing",
    "Social Media",
  ]

  const causeOptions = [
    "Education",
    "Health",
    "Environment",
    "Poverty",
    "Human Rights",
    "Animal Welfare",
    "Community Development",
    "Youth",
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

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
    }))
  }

  const toggleCause = (cause: string) => {
    setFormData((prev) => ({
      ...prev,
      causes: prev.causes.includes(cause) ? prev.causes.filter((c) => c !== cause) : [...prev.causes, cause],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
    router.push(accountType === "volunteer" ? "/volunteer/dashboard" : "/ngo/dashboard")
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-2">Choose your account type</h2>
        <p className="text-muted-foreground">Select how you'd like to use JustBecause.asia</p>
      </div>

      <div className="grid gap-4">
        <button
          type="button"
          onClick={() => {
            setAccountType("volunteer")
            setStep(2)
          }}
          className={`group p-6 rounded-xl border-2 text-left transition-all hover:border-primary hover:shadow-md ${
            accountType === "volunteer" ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">I'm a Volunteer</h3>
              <p className="text-sm text-muted-foreground">
                I want to contribute my skills and expertise to help NGOs and nonprofits.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setAccountType("ngo")
            setStep(2)
          }}
          className={`group p-6 rounded-xl border-2 text-left transition-all hover:border-secondary hover:shadow-md ${
            accountType === "ngo" ? "border-secondary bg-secondary/5" : "border-border"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
              <Building2 className="h-6 w-6 text-secondary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">I'm an NGO / Nonprofit</h3>
              <p className="text-sm text-muted-foreground">
                I want to find skilled volunteers to help with projects and grow our capacity.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors" />
          </div>
        </button>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setStep(3)
      }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 mb-6">
        <Button type="button" variant="ghost" size="icon" onClick={() => setStep(1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="font-semibold text-foreground">
            {accountType === "volunteer" ? "Create your volunteer account" : "Register your organization"}
          </h2>
          <p className="text-sm text-muted-foreground">Step 1 of 2: Basic information</p>
        </div>
      </div>

      {accountType === "ngo" && (
        <div className="space-y-2">
          <Label htmlFor="orgName">Organization Name</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="orgName"
              placeholder="Your organization name"
              value={formData.orgName}
              onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
              className="pl-10"
              required
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">{accountType === "volunteer" ? "Full Name" : "Contact Person Name"}</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="name"
            placeholder="Your full name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="Create password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="pl-10"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="pl-10"
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
          <SelectTrigger>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Select your location" />
            </div>
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

      {accountType === "ngo" && (
        <div className="space-y-2">
          <Label htmlFor="regNumber">Registration Number (optional)</Label>
          <Input
            id="regNumber"
            placeholder="Organization registration number"
            value={formData.registrationNumber}
            onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">For verified badge on your profile</p>
        </div>
      )}

      <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
        Continue
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  )

  const renderStep3 = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Button type="button" variant="ghost" size="icon" onClick={() => setStep(2)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="font-semibold text-foreground">
            {accountType === "volunteer" ? "Select your skills" : "Select your causes"}
          </h2>
          <p className="text-sm text-muted-foreground">Step 2 of 2: Help us match you better</p>
        </div>
      </div>

      {accountType === "volunteer" ? (
        <div className="space-y-4">
          <Label>What skills can you offer? (select at least 1)</Label>
          <div className="flex flex-wrap gap-2">
            {skillOptions.map((skill) => (
              <Badge
                key={skill}
                variant={formData.skills.includes(skill) ? "default" : "outline"}
                className={`cursor-pointer text-sm py-1.5 px-3 transition-colors ${
                  formData.skills.includes(skill)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-primary/10 hover:text-primary hover:border-primary"
                }`}
                onClick={() => toggleSkill(skill)}
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Label>What causes does your organization focus on? (select at least 1)</Label>
          <div className="flex flex-wrap gap-2">
            {causeOptions.map((cause) => (
              <Badge
                key={cause}
                variant={formData.causes.includes(cause) ? "default" : "outline"}
                className={`cursor-pointer text-sm py-1.5 px-3 transition-colors ${
                  formData.causes.includes(cause)
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-secondary/10 hover:text-secondary hover:border-secondary"
                }`}
                onClick={() => toggleCause(cause)}
              >
                {cause}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-start space-x-2 pt-4">
        <Checkbox
          id="terms"
          checked={formData.agreeTerms}
          onCheckedChange={(checked) => setFormData({ ...formData, agreeTerms: checked as boolean })}
        />
        <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
          I agree to the{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </label>
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90"
        disabled={
          isLoading ||
          !formData.agreeTerms ||
          (accountType === "volunteer" ? formData.skills.length === 0 : formData.causes.length === 0)
        }
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Create Account
          </>
        )}
      </Button>
    </form>
  )

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Heart className="h-5 w-5 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="text-2xl font-bold text-foreground">
              JustBecause<span className="text-primary">.asia</span>
            </span>
          </Link>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Create an account</CardTitle>
              <CardDescription>Join thousands of volunteers and NGOs making an impact</CardDescription>
            </CardHeader>
            <CardContent>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}

              {step === 1 && (
                <>
                  <div className="relative my-6">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                      or continue with
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" type="button" className="w-full bg-transparent">
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google
                    </Button>
                    <Button variant="outline" type="button" className="w-full bg-transparent">
                      <svg className="mr-2 h-4 w-4 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      LinkedIn
                    </Button>
                  </div>
                </>
              )}

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/signin" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Image/Info */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-primary/80 items-center justify-center p-12">
        <div className="max-w-md text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">Turn Your Skills Into Impact</h2>
          <p className="text-primary-foreground/90 mb-8">
            Whether you're a skilled professional looking to give back or an NGO seeking expert help, JustBecause.asia
            connects you with opportunities that matter.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold mb-1">2,847</p>
              <p className="text-sm text-primary-foreground/80">Volunteers</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold mb-1">456</p>
              <p className="text-sm text-primary-foreground/80">Projects Completed</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold mb-1">128</p>
              <p className="text-sm text-primary-foreground/80">NGOs Supported</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold mb-1">$2.4M</p>
              <p className="text-sm text-primary-foreground/80">Value Created</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
