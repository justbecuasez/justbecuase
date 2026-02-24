"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useLocale, localePath } from "@/hooks/use-locale"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Check, Tag, X, Loader2, ArrowLeft, Shield, Zap, Sparkles, CreditCard, AlertCircle } from "lucide-react"
import { client } from "@/lib/auth-client"
import { toast } from "sonner"
import { useSubscriptionStore, usePlatformSettingsStore } from "@/lib/store"
import { formatPrice, getCurrencySymbol } from "@/lib/currency"
import type { SupportedCurrency } from "@/lib/types"

interface PlanInfo {
  id: string
  name: string
  description: string
  price: number
  features: string[]
  icon: typeof Zap
}

export default function CheckoutPage() {
  const router = useRouter()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const planId = searchParams.get("plan")
  
  const { data: session } = client.useSession()
  const user = session?.user
  const userRole = user?.role as string | undefined

  // Zustand stores
  const { ngoSubscription, volunteerSubscription } = useSubscriptionStore()
  const { settings: platformSettings, isLoaded: settingsLoaded, setSettings, setLoaded, needsRefresh } = usePlatformSettingsStore()
  
  // State
  const [couponInput, setCouponInput] = useState("")
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discountAmount: number
    finalAmount: number
    originalAmount: number
    discountType: "percentage" | "fixed"
    discountValue: number
  } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pageError, setPageError] = useState("")

  // Fetch platform settings
  useEffect(() => {
    const shouldFetch = !settingsLoaded || needsRefresh()
    if (shouldFetch) {
      fetch("/api/settings")
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setSettings(data.data)
          }
          setLoaded(true)
        })
        .catch(() => setLoaded(true))
    }
  }, [settingsLoaded, needsRefresh, setSettings, setLoaded])

  // Redirect if not authenticated
  useEffect(() => {
    if (session === null) {
      router.push(localePath(`/auth/signin?redirect=/checkout?plan=${planId}`, locale))
    }
  }, [session, router, planId])

  // Currency and pricing
  const currency = (platformSettings?.currency || "INR") as SupportedCurrency
  const currencySymbol = getCurrencySymbol(currency)
  const ngoProPrice = platformSettings?.ngoProPrice ?? 2999
  const volunteerProPrice = platformSettings?.volunteerProPrice ?? 999

  // Determine plan info from planId
  const getPlanInfo = (): PlanInfo | null => {
    if (!planId) return null

    if (planId === "ngo-pro") {
      return {
        id: "ngo-pro",
        name: "NGO Pro Plan",
        description: "Unlimited projects and profile unlocks for your organization",
        price: ngoProPrice,
        features: platformSettings?.ngoProFeatures || [
          "Unlimited projects",
          "Unlimited profile unlocks",
          "Advanced AI-powered matching",
          "Priority support",
          "Project analytics & reports",
          "Featured NGO badge",
        ],
        icon: Zap,
      }
    }
    
    if (planId === "volunteer-pro") {
      return {
        id: "volunteer-pro",
        name: "Impact Agent Pro Plan",
        description: "Unlimited applications and premium features",
        price: volunteerProPrice,
        features: platformSettings?.volunteerProFeatures || [
          "Unlimited job applications",
          "Featured profile badge",
          "Priority in search results",
          "Direct message NGOs",
          "Early access to opportunities",
          "Profile analytics",
          "Certificate downloads",
        ],
        icon: Sparkles,
      }
    }

    return null
  }

  const plan = getPlanInfo()
  
  // Check if already subscribed
  const currentPlan = planId?.startsWith("ngo-") 
    ? ngoSubscription?.plan 
    : volunteerSubscription?.plan
  const isAlreadyPro = currentPlan === "pro"

  // Validate role matches plan
  const roleMatchesPlan = planId?.startsWith("ngo-") 
    ? userRole === "ngo" 
    : planId?.startsWith("volunteer-") 
      ? userRole === "volunteer" 
      : false

  // Coupon handlers
  const handleApplyCoupon = async () => {
    if (!couponInput.trim() || !plan) return

    setCouponLoading(true)
    setCouponError("")

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim(), planId: plan.id }),
      })

      const data = await response.json()
      if (!data.valid) {
        setCouponError(data.error || "Invalid coupon code")
        setAppliedCoupon(null)
      } else {
        setAppliedCoupon({
          code: couponInput.trim().toUpperCase(),
          discountAmount: data.discountAmount,
          finalAmount: data.finalAmount,
          originalAmount: data.originalAmount,
          discountType: data.discountType,
          discountValue: data.discountValue,
        })
        setCouponError("")
        toast.success("Coupon applied!", {
          description: data.discountType === "percentage"
            ? `${data.discountValue}% off applied`
            : `${currencySymbol}${data.discountAmount} off applied`,
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

  // Payment handler
  const handlePayment = async () => {
    if (!plan || !user) return
    
    setIsProcessing(true)
    setPageError("")

    try {
      const response = await fetch("/api/payments/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        // Show specific error messages
        if (data.error?.includes("not configured") || data.error?.includes("gateway")) {
          setPageError("Payment system is not configured. Please contact support.")
        } else if (data.error?.includes("disabled")) {
          setPageError("Payments are currently disabled. Please try again later.")
        } else if (data.error?.includes("role") || response.status === 403) {
          setPageError(`This plan is not available for your account type. Please check your role.`)
        } else {
          setPageError(data.error || "Failed to initiate payment. Please try again.")
        }
        return
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        setPageError("No checkout URL returned. Please try again.")
      }
    } catch (error: any) {
      setPageError(error.message || "An unexpected error occurred. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Calculate final amount
  const originalAmount = plan?.price || 0
  const finalAmount = appliedCoupon ? appliedCoupon.finalAmount : originalAmount
  const savings = appliedCoupon ? appliedCoupon.discountAmount : 0

  // Loading state
  if (!settingsLoaded) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    )
  }

  // Invalid plan
  if (!plan || !planId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h2 className="text-xl font-semibold">Invalid Plan</h2>
              <p className="text-muted-foreground">
                The selected plan is not valid. Please choose a plan from the pricing page.
              </p>
              <Button onClick={() => router.push(localePath("/pricing", locale))}>
                View Plans
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  // Already subscribed
  if (isAlreadyPro) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center space-y-4">
              <Check className="h-12 w-12 text-green-500 mx-auto" />
              <h2 className="text-xl font-semibold">Already Subscribed!</h2>
              <p className="text-muted-foreground">
                You already have an active Pro subscription. Enjoy your benefits!
              </p>
              <Button onClick={() => router.push(localePath(planId.startsWith("ngo-") ? "/ngo/dashboard" : "/volunteer/dashboard", locale))}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  // Role mismatch
  if (user && !roleMatchesPlan) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
              <h2 className="text-xl font-semibold">Plan Mismatch</h2>
              <p className="text-muted-foreground">
                This plan is for {planId.startsWith("ngo-") ? "NGOs" : "impact agents"} but your account is registered as {userRole === "ngo" ? "an NGO" : "an impact agent"}.
              </p>
              <Button onClick={() => router.push(localePath("/pricing", locale))}>
                View Your Plans
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  const PlanIcon = plan.icon

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 py-8 md:py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          {/* Back button */}
          <Button 
            variant="ghost" 
            className="mb-6 gap-2" 
            onClick={() => router.push(localePath("/pricing", locale))}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to plans
          </Button>

          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Checkout</h1>
          <p className="text-muted-foreground mb-8">Review your plan and complete your subscription</p>

          {pageError && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Payment Error</p>
                <p className="text-sm">{pageError}</p>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Plan Details */}
            <div className="lg:col-span-3 space-y-6">
              {/* Plan Summary Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <PlanIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                    What&apos;s included
                  </h4>
                  <ul className="space-y-2.5">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Coupon Code Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Have a coupon code?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appliedCoupon ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-700 dark:text-green-400">
                            {appliedCoupon.code}
                          </span>
                          <Badge variant="secondary" className="text-green-600 bg-green-100 dark:bg-green-900/50">
                            {appliedCoupon.discountType === "percentage" 
                              ? `${appliedCoupon.discountValue}% off` 
                              : `${currencySymbol}${appliedCoupon.discountAmount} off`}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm" onClick={clearCoupon}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        You save {formatPrice(savings, currency)} on this order!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter coupon code"
                          value={couponInput}
                          onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError("") }}
                          className="uppercase"
                          disabled={couponLoading}
                          onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                        />
                        <Button
                          variant="outline"
                          disabled={!couponInput.trim() || couponLoading}
                          onClick={handleApplyCoupon}
                          className="shrink-0"
                        >
                          {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                        </Button>
                      </div>
                      {couponError && (
                        <p className="text-sm text-destructive">{couponError}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Order Summary + Pay */}
            <div className="lg:col-span-2">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Plan price */}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{plan.name}</span>
                    <span>{formatPrice(originalAmount, currency)}/mo</span>
                  </div>

                  {/* Coupon discount */}
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Coupon ({appliedCoupon.code})</span>
                      <span>-{formatPrice(savings, currency)}</span>
                    </div>
                  )}

                  <Separator />

                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total today</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold">{formatPrice(finalAmount, currency)}</span>
                      <p className="text-xs text-muted-foreground">per month</p>
                    </div>
                  </div>

                  {appliedCoupon && (
                    <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded text-xs text-green-600 text-center">
                      You save {formatPrice(savings, currency)} with coupon!
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button 
                    className="w-full h-12 text-base gap-2"
                    size="lg"
                    disabled={isProcessing || !user}
                    onClick={handlePayment}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : finalAmount <= 0 ? (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Activate Free (100% off)
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        Pay {formatPrice(finalAmount, currency)}
                      </>
                    )}
                  </Button>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Secure payment powered by Stripe</span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    By subscribing, you agree to our Terms of Service. 
                    Your subscription will auto-renew monthly. Cancel anytime.
                  </p>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
