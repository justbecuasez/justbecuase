"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, Building2, User, Sparkles, Zap, Loader2, Tag, X } from "lucide-react"
import { client } from "@/lib/auth-client"
import { toast } from "sonner"
import { useSubscriptionStore, usePlatformSettingsStore } from "@/lib/store"
import { formatPrice, getCurrencySymbol } from "@/lib/currency"
import { Input } from "@/components/ui/input"
import type { SupportedCurrency } from "@/lib/types"
import { PricingPageSkeleton } from "@/components/ui/page-skeletons"
import { useDictionary } from "@/components/dictionary-provider"

export default function PricingPage() {
  const dict = useDictionary()
  const p = (dict as any).pricing || {}
  const { data: session } = client.useSession()
  const user = session?.user
  const userRole = user?.role as string | undefined
  
  // Zustand subscription store
  const { 
    ngoSubscription, 
    volunteerSubscription, 
    setNGOSubscription, 
    setVolunteerSubscription 
  } = useSubscriptionStore()

  // Platform settings from Zustand store
  const { settings: platformSettings, isLoaded: settingsLoaded, setSettings, setLoaded } = usePlatformSettingsStore()
  const [settingsError, setSettingsError] = useState(false)
  
  // Fetch platform settings on mount
  useEffect(() => {
    if (!settingsLoaded && !settingsError) {
      fetch("/api/settings")
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setSettings(data.data)
          }
          setLoaded(true)
        })
        .catch(() => {
          setSettingsError(true)
          setLoaded(true)
        })
    }
  }, [settingsLoaded, settingsError, setSettings, setLoaded])
  
  // Default tab based on user role
  const defaultTab = userRole === "volunteer" ? "volunteer" : "ngo"
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  // Coupon state
  const [couponInput, setCouponInput] = useState("")
  const [couponLoading, setCouponLoading] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discountAmount: number
    finalAmount: number
    originalAmount: number
    discountType: "percentage" | "fixed"
    discountValue: number
    planId: string
  } | null>(null)
  const [couponError, setCouponError] = useState("")
  
  // Get current plan from store
  const currentNGOPlan = ngoSubscription?.plan || "free"
  const currentVolunteerPlan = volunteerSubscription?.plan || "free"

  // Get currency from admin settings
  const currency = (platformSettings?.currency || "INR") as SupportedCurrency
  const currencySymbol = getCurrencySymbol(currency)

  // Get admin-configured prices (whole currency units, e.g., 2999 = ₹2,999)
  const ngoProPrice = platformSettings?.ngoProPrice ?? 2999
  const volunteerProPrice = platformSettings?.volunteerProPrice ?? 999
  
  // Show only the plans relevant to the user's role
  // If user is logged in as volunteer, they can only see/buy volunteer plans
  // If user is logged in as NGO, they can only see/buy NGO plans
  // If not logged in, show both tabs for browsing
  const showBothTabs = !user || (userRole !== "volunteer" && userRole !== "ngo")
  const forcedTab = userRole === "volunteer" ? "volunteer" : userRole === "ngo" ? "ngo" : null
  
  // Build dynamic plans from settings
  const ngoPlans = [
    {
      id: "ngo-free",
      name: p.free || "Free",
      description: p.ngoFreeDesc || "Perfect for small NGOs just getting started",
      price: 0,
      priceDisplay: `${currencySymbol}0`,
      period: p.forever || "forever",
      icon: Building2,
      features: (p.ngoFreeFeatures || [
        `Post up to ${platformSettings?.ngoFreeProjectsPerMonth || 3} projects per month`,
        "Browse impact agent profiles",
        "View paid impact agent profiles",
        "Basic impact agent matching",
        "Email support",
      ]).map((f: string) => f.replace("{count}", String(platformSettings?.ngoFreeProjectsPerMonth || 3))),
      limitations: p.ngoFreeLimitations || [
        "Cannot unlock FREE impact agent profiles",
        "Upgrade to Pro to unlock impact agents",
      ],
      popular: false,
    },
    {
      id: "ngo-pro",
      name: p.pro || "Pro",
      description: p.ngoProDesc || "Unlock unlimited FREE impact agent profiles",
      price: ngoProPrice,
      priceDisplay: formatPrice(ngoProPrice, currency),
      period: p.perMonth || "per month",
      icon: Zap,
      features: platformSettings?.ngoProFeatures || p.ngoProFeaturesDefault || [
        "Unlimited opportunities",
        "Unlock UNLIMITED free impact agent profiles",
        "View all paid impact agent profiles",
        "Advanced AI-powered matching",
        "Priority support",
        "Opportunity analytics & reports",
        "Featured NGO badge",
      ],
      limitations: [],
      popular: true,
    },
  ]

  const volunteerPlans = [
    {
      id: "volunteer-free",
      name: p.free || "Free",
      description: p.volFreeDesc || "Start contributing and make an impact",
      price: 0,
      priceDisplay: `${currencySymbol}0`,
      period: p.forever || "forever",
      icon: User,
      features: (p.volFreeFeatures || [
        "Browse all opportunities",
        `${platformSettings?.volunteerFreeApplicationsPerMonth || 3} applications per month`,
        "Basic profile visibility",
        "Email notifications",
        "Community access",
      ]).map((f: string) => f.replace("{count}", String(platformSettings?.volunteerFreeApplicationsPerMonth || 3))),
      limitations: (p.volFreeLimitations || [
        `Limited to ${platformSettings?.volunteerFreeApplicationsPerMonth || 3} applications/month`,
      ]).map((f: string) => f.replace("{count}", String(platformSettings?.volunteerFreeApplicationsPerMonth || 3))),
      popular: false,
    },
    {
      id: "volunteer-pro",
      name: p.pro || "Pro",
      description: p.volProDesc || "Apply to unlimited jobs",
      price: volunteerProPrice,
      priceDisplay: formatPrice(volunteerProPrice, currency),
      period: p.perMonth || "per month",
      icon: Sparkles,
      features: platformSettings?.volunteerProFeatures || p.volProFeaturesDefault || [
        "Unlimited job applications",
        "Featured profile badge",
        "Priority in search results",
        "Direct message NGOs",
        "Early access to opportunities",
        "Profile analytics",
        "Certificate downloads",
      ],
      limitations: [],
      popular: true,
    },
  ]

  const handleApplyCoupon = async (planId: string) => {
    if (!couponInput.trim()) return
    if (!user) {
      toast.error("Please sign in to apply a coupon")
      return
    }

    setCouponLoading(true)
    setCouponError("")

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim(), planId }),
      })

      const data = await response.json()
      if (!data.valid) {
        setCouponError(data.error || "Invalid coupon")
        setAppliedCoupon(null)
      } else {
        setAppliedCoupon({
          code: couponInput.trim().toUpperCase(),
          discountAmount: data.discountAmount,
          finalAmount: data.finalAmount,
          originalAmount: data.originalAmount,
          discountType: data.discountType,
          discountValue: data.discountValue,
          planId,
        })
        setCouponError("")
        toast.success("Coupon applied!", {
          description: data.discountType === "percentage"
            ? `${data.discountValue}% off applied`
            : `${getCurrencySymbol(currency)}${data.discountAmount} off applied`,
        })
      }
    } catch {
      setCouponError("Failed to validate coupon")
    } finally {
      setCouponLoading(false)
    }
  }

  const clearCoupon = () => {
    setAppliedCoupon(null)
    setCouponInput("")
    setCouponError("")
  }

  const handleSubscribe = async (planId: string, amount: number, planName: string) => {
    if (!user) {
      window.location.href = "/auth/signin?redirect=/pricing"
      return
    }

    if (amount === 0) {
      // Free plan - just redirect to appropriate dashboard
      window.location.href = userRole === "ngo" ? "/ngo/dashboard" : "/volunteer/dashboard"
      return
    }

    setLoadingPlan(planId)

    try {
      // Create Stripe Checkout Session via API (with optional coupon)
      const response = await fetch("/api/payments/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          planId,
          ...(appliedCoupon && appliedCoupon.planId === planId ? { couponCode: appliedCoupon.code } : {}),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session")
      }

      if (data.url) {
        // Redirect to Stripe Checkout (or coupon-free URL)
        window.location.href = data.url
      } else {
        throw new Error("No checkout URL returned")
      }
    } catch (error: any) {
      toast.error("Payment error", {
        description: error.message || "Failed to initiate payment",
      })
      setLoadingPlan(null)
    }
  }

  const renderPlanCard = (plan: typeof ngoPlans[0], currentPlan?: string) => {
    const Icon = plan.icon
    const isCurrentPlan = currentPlan === plan.id || (currentPlan === undefined && plan.price === 0)
    const isLoading = loadingPlan === plan.id

    return (
      <Card 
        key={plan.id}
        className={`relative flex flex-col ${plan.popular ? "border-primary shadow-lg scale-[1.02]" : ""}`}
      >
        {plan.popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground">
              {p.recommended || "Recommended"}
            </Badge>
          </div>
        )}
        <CardHeader>
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{plan.name}</CardTitle>
          <CardDescription>{plan.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="mb-6">
            <span className="text-4xl font-bold text-foreground">{plan.priceDisplay}</span>
            <span className="text-muted-foreground ml-2">/{plan.period}</span>
          </div>
          <ul className="space-y-3">
            {plan.features.map((feature: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{feature}</span>
              </li>
            ))}
          </ul>
          {plan.limitations.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">{p.limitations || "Limitations:"}</p>
              {plan.limitations.map((limit: string, i: number) => (
                <p key={i} className="text-xs text-amber-600">{limit}</p>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {/* Coupon section — only for paid plans */}
          {plan.price > 0 && !isCurrentPlan && (
            <div className="w-full space-y-2">
              {appliedCoupon && appliedCoupon.planId === plan.id ? (
                <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md text-sm">
                  <div className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-green-600" />
                    <span className="font-medium text-green-700 dark:text-green-400">{appliedCoupon.code}</span>
                    <span className="text-green-600 dark:text-green-500">
                      ({appliedCoupon.discountType === "percentage" 
                        ? `${appliedCoupon.discountValue}% ${p.off || "off"}` 
                        : `${currencySymbol}${appliedCoupon.discountAmount} ${p.off || "off"}`})
                    </span>
                  </div>
                  <button onClick={clearCoupon} className="text-green-600 hover:text-green-800 dark:hover:text-green-300">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder={p.couponPlaceholder || "Coupon code"}
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value); setCouponError("") }}
                    className="h-8 text-sm uppercase"
                    disabled={couponLoading}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0"
                    disabled={!couponInput.trim() || couponLoading}
                    onClick={() => handleApplyCoupon(plan.id)}
                  >
                    {couponLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : (p.applyCoupon || "Apply")}
                  </Button>
                </div>
              )}
              {couponError && (
                <p className="text-xs text-destructive">{couponError}</p>
              )}
              {appliedCoupon && appliedCoupon.planId === plan.id && (
                <div className="text-sm text-muted-foreground">
                  <span className="line-through">{formatPrice(appliedCoupon.originalAmount, currency)}</span>
                  {" → "}
                  <span className="font-semibold text-primary">{formatPrice(appliedCoupon.finalAmount, currency)}</span>
                  <span className="text-muted-foreground">/{p.month || "month"}</span>
                </div>
              )}
            </div>
          )}
          <Button 
            className="w-full" 
            variant={isCurrentPlan ? "outline" : plan.popular ? "default" : "outline"}
            disabled={isCurrentPlan || isLoading}
            onClick={() => handleSubscribe(plan.id, plan.price, plan.name)}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {p.processing || "Processing..."}
              </>
            ) : isCurrentPlan ? (
              p.currentPlan || "Current Plan"
            ) : plan.price === 0 ? (
              p.getStartedFree || "Get Started Free"
            ) : (
              (p.upgradeTo || "Upgrade to {plan}").replace("{plan}", plan.name)
            )}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Header */}
        <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <Badge className="mb-4">{p.badge || "Pricing"}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {p.title || "Simple, transparent pricing"}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {p.subtitle || "Choose the perfect plan for your needs. Upgrade anytime."}
            </p>
          </div>
        </section>

        {/* Loading state */}
        {!settingsLoaded && (
          <PricingPageSkeleton />
        )}

        {/* Pricing Tabs */}
        {settingsLoaded && (
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6">
            {/* Show message if user is logged in - they can only upgrade their own plan type */}
            {user && forcedTab && (
              <div className="text-center mb-8 p-4 bg-muted/50 rounded-lg max-w-2xl mx-auto">
                <p className="text-muted-foreground">
                  {(p.loggedInAs || "You're logged in as {role}.").replace("{role}", userRole === "ngo" ? (p.anNGO || "an NGO") : (p.anImpactAgent || "an impact agent"))}
                  {" "}
                  {userRole === "ngo" 
                    ? (p.ngoUpgradeHint || "Upgrade your NGO subscription below.")
                    : (p.volunteerUpgradeHint || "Upgrade your impact agent subscription below.")}
                </p>
              </div>
            )}
            
            <Tabs value={forcedTab || activeTab} onValueChange={showBothTabs ? setActiveTab : undefined} className="w-full">
              {/* Only show tabs if user is not logged in OR is admin */}
              {showBothTabs && (
                <div className="flex justify-center mb-12">
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="ngo" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {p.forNGOs || "For NGOs"}
                    </TabsTrigger>
                    <TabsTrigger value="volunteer" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {p.forImpactAgents || "For Impact Agents"}
                    </TabsTrigger>
                  </TabsList>
                </div>
              )}

              <TabsContent value="ngo">
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  {ngoPlans.map((plan) => renderPlanCard(plan, currentNGOPlan === "pro" ? "ngo-pro" : undefined))}
                </div>
                
                <div className="mt-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    {p.contactSalesDesc || "Need a custom solution for your large organization?"}
                  </p>
                  <Button variant="outline" asChild>
                    <a href="/contact">{p.contactSales || "Contact Sales"}</a>
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="volunteer">
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  {volunteerPlans.map((plan) => renderPlanCard(plan, currentVolunteerPlan === "pro" ? "volunteer-pro" : undefined))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
        )}

        {/* FAQ Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4 md:px-6 max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-12">{p.faq || "Frequently Asked Questions"}</h2>
            
            <div className="space-y-6">
              <div className="p-6 bg-background rounded-lg border">
                <h3 className="font-semibold text-foreground mb-2">{p.faqProfileUnlock || "What is a profile unlock? (NGOs)"}</h3>
                <p className="text-muted-foreground">
                  {p.faqProfileUnlockAnswer || "When you find a FREE impact agent you'd like to connect with, you need to unlock their profile to view their contact information. NGO Pro subscribers can unlock unlimited free impact agent profiles. Free plan NGOs must upgrade to Pro to unlock any profiles."}
                </p>
              </div>
              
              <div className="p-6 bg-background rounded-lg border">
                <h3 className="font-semibold text-foreground mb-2">{p.faqApplication || "What counts as an application? (Impact Agents)"}</h3>
                <p className="text-muted-foreground">
                  {(p.faqApplicationAnswer || "Each time you apply to a project/opportunity, it counts as one application. Free plan includes {count} applications per month.").replace("{count}", String(platformSettings?.volunteerFreeApplicationsPerMonth || 3))}
                </p>
              </div>
              
              <div className="p-6 bg-background rounded-lg border">
                <h3 className="font-semibold text-foreground mb-2">{p.faqChangePlan || "Can I change plans anytime?"}</h3>
                <p className="text-muted-foreground">
                  {p.faqChangePlanAnswer || "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately."}
                </p>
              </div>
              
              <div className="p-6 bg-background rounded-lg border">
                <h3 className="font-semibold text-foreground mb-2">{p.faqRollover || "Do unused limits roll over?"}</h3>
                <p className="text-muted-foreground">
                  {p.faqRolloverAnswer || "No, unused applications or unlocks do not roll over to the next month. Counters reset on the 1st of each month."}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
