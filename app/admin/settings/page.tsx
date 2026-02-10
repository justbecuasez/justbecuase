"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Settings,
  Globe,
  CreditCard,
  Shield,
  Save,
  Loader2,
  Users,
  Building2,
  Plus,
  X,
  MessageSquare,
  Phone,
  Send,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  TestTube,
  Zap,
} from "lucide-react"
import { getAdminSettings, updateAdminSettings } from "@/lib/actions"
import { toast } from "sonner"
import type { AdminSettings, SupportedCurrency, PaymentGatewayType } from "@/lib/types"

const CURRENCIES: { value: SupportedCurrency; label: string; symbol: string }[] = [
  { value: "INR", label: "Indian Rupee (INR)", symbol: "₹" },
  { value: "USD", label: "US Dollar (USD)", symbol: "$" },
  { value: "EUR", label: "Euro (EUR)", symbol: "€" },
  { value: "GBP", label: "British Pound (GBP)", symbol: "£" },
  { value: "SGD", label: "Singapore Dollar (SGD)", symbol: "S$" },
  { value: "AED", label: "UAE Dirham (AED)", symbol: "د.إ" },
  { value: "MYR", label: "Malaysian Ringgit (MYR)", symbol: "RM" },
]

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [newVolunteerFeature, setNewVolunteerFeature] = useState("")
  const [newNGOFeature, setNewNGOFeature] = useState("")
  
  // SMS Configuration State
  const [smsConfig, setSmsConfig] = useState<{
    provider: string
    twilioConfigured: boolean
    vonageConfigured: boolean
    msg91Configured: boolean
    textlocalConfigured: boolean
    twilioAccountSid: string
    twilioPhoneNumber: string
    vonageApiKey: string
    vonageFromNumber: string
    msg91SenderId: string
    textlocalSender: string
  } | null>(null)
  const [smsForm, setSmsForm] = useState({
    provider: "none",
    twilioAccountSid: "",
    twilioAuthToken: "",
    twilioPhoneNumber: "",
    vonageApiKey: "",
    vonageApiSecret: "",
    vonageFromNumber: "",
    msg91AuthKey: "",
    msg91SenderId: "",
    msg91TemplateId: "",
    textlocalApiKey: "",
    textlocalSender: "",
  })
  const [smsSaving, setSmsSaving] = useState(false)
  const [smsTestPhone, setSmsTestPhone] = useState("")
  const [smsTesting, setSmsTesting] = useState(false)

  // Payment Gateway Configuration State
  const [paymentConfig, setPaymentConfig] = useState<{
    gateway: PaymentGatewayType
    isLive: boolean
    stripeConfigured: boolean
    stripePublishableKey: string
    stripeSecretKeyMasked: string
    razorpayConfigured: boolean
    razorpayKeyId: string
    razorpayKeySecretMasked: string
    configuredAt?: string
    lastTestedAt?: string
    testSuccessful?: boolean
  } | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    gateway: "none" as PaymentGatewayType,
    isLive: false,
    stripePublishableKey: "",
    stripeSecretKey: "",
    razorpayKeyId: "",
    razorpayKeySecret: "",
  })
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [paymentTesting, setPaymentTesting] = useState(false)
  const [showStripeSecret, setShowStripeSecret] = useState(false)
  const [showRazorpaySecret, setShowRazorpaySecret] = useState(false)
  const [testAmount, setTestAmount] = useState("1")

  useEffect(() => {
    loadSettings()
    loadSmsConfig()
    loadPaymentConfig()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    const data = await getAdminSettings()
    setSettings(data)
    setIsLoading(false)
  }

  const loadSmsConfig = async () => {
    try {
      const response = await fetch("/api/admin/sms-config")
      if (response.ok) {
        const data = await response.json()
        setSmsConfig(data)
        setSmsForm(prev => ({
          ...prev,
          provider: data.provider || "none",
          twilioPhoneNumber: data.twilioPhoneNumber || "",
          vonageApiKey: data.vonageApiKey || "",
          vonageFromNumber: data.vonageFromNumber || "",
          msg91SenderId: data.msg91SenderId || "",
          textlocalSender: data.textlocalSender || "",
        }))
      }
    } catch (error) {
      console.error("Failed to load SMS config:", error)
    }
  }

  const loadPaymentConfig = async () => {
    try {
      const response = await fetch("/api/admin/payment-config")
      if (response.ok) {
        const data = await response.json()
        setPaymentConfig(data)
        setPaymentForm(prev => ({
          ...prev,
          gateway: data.gateway || "none",
          isLive: data.isLive || false,
          stripePublishableKey: data.stripePublishableKey || "",
          razorpayKeyId: data.razorpayKeyId || "",
        }))
      }
    } catch (error) {
      console.error("Failed to load payment config:", error)
    }
  }

  const savePaymentConfig = async () => {
    setPaymentSaving(true)
    try {
      const response = await fetch("/api/admin/payment-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentForm)
      })
      const data = await response.json()
      if (response.ok) {
        toast.success("Payment gateway configuration saved successfully")
        loadPaymentConfig()
      } else {
        toast.error(data.error || "Failed to save payment configuration")
      }
    } catch (error) {
      toast.error("Failed to save payment configuration")
    } finally {
      setPaymentSaving(false)
    }
  }

  const testPaymentConfig = async () => {
    setPaymentTesting(true)
    try {
      const response = await fetch("/api/admin/payment-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateway: paymentForm.gateway })
      })
      const data = await response.json()
      if (data.success) {
        toast.success(data.message)
        loadPaymentConfig()
      } else {
        toast.error(data.error || data.message || "Failed to test payment gateway")
      }
    } catch (error) {
      toast.error("Failed to test payment gateway")
    } finally {
      setPaymentTesting(false)
    }
  }

  const saveSmsConfig = async () => {
    setSmsSaving(true)
    console.log("[Admin] Saving SMS config:", smsForm)
    try {
      const response = await fetch("/api/admin/sms-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smsForm)
      })
      const data = await response.json()
      console.log("[Admin] Save response:", data)
      if (response.ok) {
        toast.success("SMS configuration saved successfully")
        loadSmsConfig()
      } else {
        console.error("[Admin] Save failed:", data.error)
        toast.error(data.error || "Failed to save SMS configuration")
      }
    } catch (error) {
      console.error("[Admin] Save error:", error)
      toast.error("Failed to save SMS configuration")
    } finally {
      setSmsSaving(false)
    }
  }

  const testSmsConfig = async () => {
    if (!smsTestPhone) {
      toast.error("Please enter a phone number to test")
      return
    }
    setSmsTesting(true)
    try {
      const response = await fetch("/api/admin/sms-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: smsTestPhone })
      })
      const data = await response.json()
      if (data.success) {
        toast.success(data.message)
      } else {
        toast.error(data.error || "Failed to send test SMS")
      }
    } catch (error) {
      toast.error("Failed to send test SMS")
    } finally {
      setSmsTesting(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return
    setIsSaving(true)
    const result = await updateAdminSettings(settings)
    if (result.success) {
      toast.success("Settings saved successfully")
    } else {
      toast.error(result.error || "Failed to save settings")
    }
    setIsSaving(false)
  }

  const getCurrencySymbol = () => {
    const curr = CURRENCIES.find(c => c.value === settings?.currency)
    return curr?.symbol || "$"
  }

  const addVolunteerFeature = () => {
    if (!newVolunteerFeature.trim() || !settings) return
    setSettings({
      ...settings,
      volunteerProFeatures: [...(settings.volunteerProFeatures || []), newVolunteerFeature.trim()],
    })
    setNewVolunteerFeature("")
  }

  const removeVolunteerFeature = (index: number) => {
    if (!settings) return
    setSettings({
      ...settings,
      volunteerProFeatures: settings.volunteerProFeatures?.filter((_, i) => i !== index) || [],
    })
  }

  const addNGOFeature = () => {
    if (!newNGOFeature.trim() || !settings) return
    setSettings({
      ...settings,
      ngoProFeatures: [...(settings.ngoProFeatures || []), newNGOFeature.trim()],
    })
    setNewNGOFeature("")
  }

  const removeNGOFeature = (index: number) => {
    if (!settings) return
    setSettings({
      ...settings,
      ngoProFeatures: settings.ngoProFeatures?.filter((_, i) => i !== index) || [],
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load settings</p>
        <Button onClick={loadSettings} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Platform Settings</h1>
          <p className="text-muted-foreground">
            Configure all platform settings, pricing, and subscription plans
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save All Changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="volunteer-plans" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Volunteer Plans
          </TabsTrigger>
          <TabsTrigger value="ngo-plans" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            NGO Plans
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            SMS & Integrations
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Information</CardTitle>
              <CardDescription>
                Basic information about your platform displayed across the site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    value={settings.platformName}
                    onChange={(e) =>
                      setSettings({ ...settings, platformName: e.target.value })
                    }
                    placeholder="JustBeCause Network"
                  />
                  <p className="text-xs text-muted-foreground">
                    Displayed in navbar, emails, and meta tags
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) =>
                      setSettings({ ...settings, supportEmail: e.target.value })
                    }
                    placeholder="support@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="platformDescription">Platform Description</Label>
                <Textarea
                  id="platformDescription"
                  value={settings.platformDescription}
                  onChange={(e) =>
                    setSettings({ ...settings, platformDescription: e.target.value })
                  }
                  rows={3}
                  placeholder="Connecting NGOs with skilled volunteers..."
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platformLogo">Logo URL</Label>
                  <Input
                    id="platformLogo"
                    value={settings.platformLogo || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, platformLogo: e.target.value })
                    }
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platformFavicon">Favicon URL</Label>
                  <Input
                    id="platformFavicon"
                    value={settings.platformFavicon || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, platformFavicon: e.target.value })
                    }
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>
                Search engine optimization settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={settings.metaTitle}
                  onChange={(e) =>
                    setSettings({ ...settings, metaTitle: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={settings.metaDescription}
                  onChange={(e) =>
                    setSettings({ ...settings, metaDescription: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>
                Social media links displayed in the footer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={settings.socialLinks?.facebook || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        socialLinks: { ...settings.socialLinks, facebook: e.target.value },
                      })
                    }
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter/X</Label>
                  <Input
                    id="twitter"
                    value={settings.socialLinks?.twitter || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        socialLinks: { ...settings.socialLinks, twitter: e.target.value },
                      })
                    }
                    placeholder="https://twitter.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={settings.socialLinks?.instagram || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        socialLinks: { ...settings.socialLinks, instagram: e.target.value },
                      })
                    }
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={settings.socialLinks?.linkedin || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        socialLinks: { ...settings.socialLinks, linkedin: e.target.value },
                      })
                    }
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance Mode</CardTitle>
              <CardDescription>
                Put the site in maintenance mode when needed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Users will see a maintenance message instead of the site
                  </p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, maintenanceMode: checked })
                  }
                />
              </div>
              {settings.maintenanceMode && (
                <div className="space-y-2">
                  <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                  <Textarea
                    id="maintenanceMessage"
                    value={settings.maintenanceMessage || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, maintenanceMessage: e.target.value })
                    }
                    placeholder="We're currently performing scheduled maintenance..."
                    rows={2}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment" className="space-y-6">
          {/* Payment Gateway Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Payment Gateway Configuration
              </CardTitle>
              <CardDescription>
                Configure your payment gateway (Stripe or Razorpay). Keys are stored securely in the database.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Status */}
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Current Status</p>
                <div className="flex flex-wrap gap-2">
                  {paymentConfig?.gateway === "none" || !paymentConfig?.gateway ? (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      No Payment Gateway Configured
                    </Badge>
                  ) : (
                    <>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        <Check className="h-3 w-3 mr-1" />
                        {paymentConfig.gateway.charAt(0).toUpperCase() + paymentConfig.gateway.slice(1)} Active
                      </Badge>
                      <Badge variant={paymentConfig.isLive ? "default" : "secondary"}>
                        {paymentConfig.isLive ? "🔴 LIVE MODE" : "🟡 Test Mode"}
                      </Badge>
                      {paymentConfig.testSuccessful !== undefined && (
                        <Badge variant={paymentConfig.testSuccessful ? "outline" : "destructive"}>
                          {paymentConfig.testSuccessful ? "✓ Connection Verified" : "✗ Connection Failed"}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                {paymentConfig?.lastTestedAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last tested: {new Date(paymentConfig.lastTestedAt).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Gateway Selection */}
              <div className="space-y-2">
                <Label>Active Payment Gateway</Label>
                <Select 
                  value={paymentForm.gateway} 
                  onValueChange={(value: PaymentGatewayType) => setPaymentForm({ ...paymentForm, gateway: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment gateway" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Payments Disabled)</SelectItem>
                    <SelectItem value="stripe">Stripe (Global)</SelectItem>
                    <SelectItem value="razorpay">Razorpay (India)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Live Mode Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">Live Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Enable to process real payments. Keep disabled for testing.
                  </p>
                </div>
                <Switch
                  checked={paymentForm.isLive}
                  onCheckedChange={(checked) => setPaymentForm({ ...paymentForm, isLive: checked })}
                />
              </div>

              <Separator />

              {/* Stripe Configuration */}
              {paymentForm.gateway === "stripe" && (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Stripe Configuration
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="stripePublishableKey">Publishable Key</Label>
                      <Input
                        id="stripePublishableKey"
                        value={paymentForm.stripePublishableKey}
                        onChange={(e) => setPaymentForm({ ...paymentForm, stripePublishableKey: e.target.value })}
                        placeholder={paymentConfig?.stripePublishableKey || "pk_live_... or pk_test_..."}
                      />
                      <p className="text-xs text-muted-foreground">
                        Safe to expose - used on frontend
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stripeSecretKey">Secret Key</Label>
                      <div className="relative">
                        <Input
                          id="stripeSecretKey"
                          type={showStripeSecret ? "text" : "password"}
                          value={paymentForm.stripeSecretKey}
                          onChange={(e) => setPaymentForm({ ...paymentForm, stripeSecretKey: e.target.value })}
                          placeholder={paymentConfig?.stripeSecretKeyMasked || "sk_live_... or sk_test_..."}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowStripeSecret(!showStripeSecret)}
                        >
                          {showStripeSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Keep secret - stored encrypted in database
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                    <p className="font-medium mb-2">Get Stripe Keys:</p>
                    <ol className="list-decimal ml-4 space-y-1 text-xs text-muted-foreground">
                      <li>Go to <a href="https://dashboard.stripe.com/apikeys" target="_blank" className="text-blue-600 hover:underline">Stripe Dashboard → API Keys</a></li>
                      <li>Copy your Publishable key (pk_live_... or pk_test_...)</li>
                      <li>Reveal and copy your Secret key (sk_live_... or sk_test_...)</li>
                      <li>For testing, use test mode keys first</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Razorpay Configuration */}
              {paymentForm.gateway === "razorpay" && (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Razorpay Configuration
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="razorpayKeyId">Key ID</Label>
                      <Input
                        id="razorpayKeyId"
                        value={paymentForm.razorpayKeyId}
                        onChange={(e) => setPaymentForm({ ...paymentForm, razorpayKeyId: e.target.value })}
                        placeholder={paymentConfig?.razorpayKeyId || "rzp_live_... or rzp_test_..."}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="razorpayKeySecret">Key Secret</Label>
                      <div className="relative">
                        <Input
                          id="razorpayKeySecret"
                          type={showRazorpaySecret ? "text" : "password"}
                          value={paymentForm.razorpayKeySecret}
                          onChange={(e) => setPaymentForm({ ...paymentForm, razorpayKeySecret: e.target.value })}
                          placeholder={paymentConfig?.razorpayKeySecretMasked || "Enter secret key"}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowRazorpaySecret(!showRazorpaySecret)}
                        >
                          {showRazorpaySecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                    <p className="font-medium mb-2">Get Razorpay Keys:</p>
                    <ol className="list-decimal ml-4 space-y-1 text-xs text-muted-foreground">
                      <li>Go to <a href="https://dashboard.razorpay.com/app/keys" target="_blank" className="text-blue-600 hover:underline">Razorpay Dashboard → API Keys</a></li>
                      <li>Generate new keys or copy existing ones</li>
                      <li>Use test mode keys for development</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Save & Test Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button onClick={savePaymentConfig} disabled={paymentSaving}>
                  {paymentSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Payment Configuration
                    </>
                  )}
                </Button>
                {paymentForm.gateway !== "none" && (
                  <Button variant="outline" onClick={testPaymentConfig} disabled={paymentTesting}>
                    {paymentTesting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Test Payment Card */}
          {paymentForm.gateway !== "none" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Test Payment ($1)
                </CardTitle>
                <CardDescription>
                  Create a test payment to verify your payment gateway is working correctly.
                  This will create a real payment intent but won't charge unless completed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Test Amount</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{getCurrencySymbol()}</span>
                      <Input
                        type="number"
                        value={testAmount}
                        onChange={(e) => setTestAmount(e.target.value)}
                        min="1"
                        max="100"
                        className="w-24"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Minimum $1 for testing
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  onClick={async () => {
                    try {
                      const amount = Math.max(1, parseInt(testAmount) || 1) * 100; // Convert to paise
                      const response = await fetch("/api/admin/test-payment", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ 
                          amount,
                          currency: settings?.currency || "USD"
                        })
                      });
                      const data = await response.json();
                      if (data.success) {
                        toast.success(`Test payment created: ${data.message}`);
                        console.log("Test payment details:", data);
                      } else {
                        toast.error(data.error || "Failed to create test payment");
                      }
                    } catch (error) {
                      toast.error("Failed to create test payment");
                    }
                  }}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Create Test Payment
                </Button>
                <p className="text-xs text-muted-foreground">
                  This creates a PaymentIntent. Check the browser console for details.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Currency & Pricing</CardTitle>
              <CardDescription>
                Configure your payment currency and default pricing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={settings?.currency}
                    onValueChange={(value: SupportedCurrency) =>
                      setSettings(settings ? { ...settings, currency: value } : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((curr) => (
                        <SelectItem key={curr.value} value={curr.value}>
                          {curr.symbol} - {curr.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    All prices will be displayed in this currency
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Model Info</CardTitle>
              <CardDescription>
                How the subscription system works
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <div className="flex items-start gap-2">
                  <Building2 className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">NGO Pro Subscription</p>
                    <p className="text-sm text-muted-foreground">
                      NGOs with Pro subscription can unlock <strong>unlimited FREE volunteer profiles</strong>.
                      NGOs can view paid volunteer profiles without subscription.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Volunteer Pro Subscription</p>
                    <p className="text-sm text-muted-foreground">
                      Volunteers with Pro subscription can apply to <strong>unlimited jobs</strong>.
                      Free volunteers are limited to {settings?.volunteerFreeApplicationsPerMonth || 3} applications/month.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Note: Individual profile unlock payments are not part of the business model. 
                NGOs must upgrade to Pro to unlock volunteer profiles.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Volunteer Plans */}
        <TabsContent value="volunteer-plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">Free Plan</Badge>
                Volunteer Free Plan Limits
              </CardTitle>
              <CardDescription>
                Configure limits for volunteers on the free plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="volunteerFreeApps">Applications per Month</Label>
                  <Input
                    id="volunteerFreeApps"
                    type="number"
                    value={settings.volunteerFreeApplicationsPerMonth || 3}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        volunteerFreeApplicationsPerMonth: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of opportunity applications allowed per month
                  </p>
                </div>
                <div className="space-y-2 flex items-center gap-4 pt-6">
                  <Switch
                    checked={settings.volunteerFreeProfileVisibility !== false}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, volunteerFreeProfileVisibility: checked })
                    }
                  />
                  <div>
                    <Label>Profile Visibility</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow free plan volunteers to be visible in search
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className="bg-primary">Pro Plan</Badge>
                Volunteer Pro Plan
              </CardTitle>
              <CardDescription>
                Configure pricing and features for the volunteer pro plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="volunteerProPrice">Monthly Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {getCurrencySymbol()}
                  </span>
                  <Input
                    id="volunteerProPrice"
                    type="number"
                    className="pl-8"
                    value={settings.volunteerProPrice || 999}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        volunteerProPrice: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Pro Plan Features</Label>
                <p className="text-sm text-muted-foreground">
                  These features are displayed on the pricing page
                </p>
                <div className="space-y-2">
                  {settings.volunteerProFeatures?.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...(settings.volunteerProFeatures || [])]
                          newFeatures[index] = e.target.value
                          setSettings({ ...settings, volunteerProFeatures: newFeatures })
                        }}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVolunteerFeature(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newVolunteerFeature}
                    onChange={(e) => setNewVolunteerFeature(e.target.value)}
                    placeholder="Add a feature..."
                    onKeyDown={(e) => e.key === "Enter" && addVolunteerFeature()}
                  />
                  <Button variant="outline" onClick={addVolunteerFeature}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NGO Plans */}
        <TabsContent value="ngo-plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">Free Plan</Badge>
                NGO Free Plan Limits
              </CardTitle>
              <CardDescription>
                Configure limits for NGOs on the free plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ngoFreeProjects">Opportunities per Month</Label>
                  <Input
                    id="ngoFreeProjects"
                    type="number"
                    value={settings.ngoFreeProjectsPerMonth || 3}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ngoFreeProjectsPerMonth: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of opportunities NGOs can post per month
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ngoFreeUnlocks">Profile Unlocks per Month</Label>
                  <Input
                    id="ngoFreeUnlocks"
                    type="number"
                    value={settings.ngoFreeProfileUnlocksPerMonth || 0}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ngoFreeProfileUnlocksPerMonth: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Free profile unlocks (0 = must upgrade to Pro)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className="bg-primary">Pro Plan</Badge>
                NGO Pro Plan
              </CardTitle>
              <CardDescription>
                Configure pricing and features for the NGO pro plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ngoProPrice">Monthly Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {getCurrencySymbol()}
                    </span>
                    <Input
                      id="ngoProPrice"
                      type="number"
                      className="pl-8"
                      value={settings.ngoProPrice || 2999}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          ngoProPrice: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2 flex items-center gap-2 pt-6">
                  <Switch
                    checked={settings.ngoProProjectsUnlimited !== false}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, ngoProProjectsUnlimited: checked })
                    }
                  />
                  <Label>Unlimited Opportunities</Label>
                </div>
                <div className="space-y-2 flex items-center gap-2 pt-6">
                  <Switch
                    checked={settings.ngoProUnlocksUnlimited !== false}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, ngoProUnlocksUnlimited: checked })
                    }
                  />
                  <Label>Unlimited Unlocks</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Pro Plan Features</Label>
                <p className="text-sm text-muted-foreground">
                  These features are displayed on the pricing page
                </p>
                <div className="space-y-2">
                  {settings.ngoProFeatures?.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...(settings.ngoProFeatures || [])]
                          newFeatures[index] = e.target.value
                          setSettings({ ...settings, ngoProFeatures: newFeatures })
                        }}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeNGOFeature(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newNGOFeature}
                    onChange={(e) => setNewNGOFeature(e.target.value)}
                    placeholder="Add a feature..."
                    onKeyDown={(e) => e.key === "Enter" && addNGOFeature()}
                  />
                  <Button variant="outline" onClick={addNGOFeature}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Toggle */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Toggles</CardTitle>
              <CardDescription>
                Enable or disable platform features globally
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Payments</p>
                  <p className="text-sm text-muted-foreground">
                    Enable payment processing for subscriptions and profile unlocks
                  </p>
                </div>
                <Switch
                  checked={settings.enablePayments}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, enablePayments: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Messaging</p>
                  <p className="text-sm text-muted-foreground">
                    Allow users to send messages to each other
                  </p>
                </div>
                <Switch
                  checked={settings.enableMessaging}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, enableMessaging: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Send email and in-app notifications to users
                  </p>
                </div>
                <Switch
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, enableNotifications: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS & Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                SMS Provider Configuration
              </CardTitle>
              <CardDescription>
                Configure SMS provider for phone number verification during onboarding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Status */}
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Current Status</p>
                <div className="flex flex-wrap gap-2">
                  {smsConfig?.provider === "none" ? (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      No SMS Provider Configured (Dev Mode)
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700">
                      <Check className="h-3 w-3 mr-1" />
                      {smsConfig?.provider?.toUpperCase()} Configured
                    </Badge>
                  )}
                </div>
              </div>

              {/* Provider Selection */}
              <div className="space-y-2">
                <Label>SMS Provider</Label>
                <Select 
                  value={smsForm.provider} 
                  onValueChange={(value) => setSmsForm({ ...smsForm, provider: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select SMS provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Development Mode)</SelectItem>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="vonage">Vonage (Nexmo)</SelectItem>
                    <SelectItem value="msg91">MSG91 (India)</SelectItem>
                    <SelectItem value="textlocal">TextLocal</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  In development mode, OTP codes are shown in console/browser
                </p>
              </div>

              <Separator />

              {/* Twilio Configuration */}
              {smsForm.provider === "twilio" && (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Twilio Configuration
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="twilioAccountSid">Account SID</Label>
                      <Input
                        id="twilioAccountSid"
                        value={smsForm.twilioAccountSid}
                        onChange={(e) => setSmsForm({ ...smsForm, twilioAccountSid: e.target.value })}
                        placeholder={smsConfig?.twilioAccountSid || "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twilioAuthToken">Auth Token</Label>
                      <Input
                        id="twilioAuthToken"
                        type="password"
                        value={smsForm.twilioAuthToken}
                        onChange={(e) => setSmsForm({ ...smsForm, twilioAuthToken: e.target.value })}
                        placeholder="Enter auth token"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twilioPhoneNumber">Twilio Phone Number</Label>
                    <Input
                      id="twilioPhoneNumber"
                      value={smsForm.twilioPhoneNumber}
                      onChange={(e) => setSmsForm({ ...smsForm, twilioPhoneNumber: e.target.value })}
                      placeholder="+1234567890"
                    />
                    <p className="text-xs text-muted-foreground">
                      The phone number SMS messages will be sent from
                    </p>
                  </div>
                </div>
              )}

              {/* Vonage Configuration */}
              {smsForm.provider === "vonage" && (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Vonage (Nexmo) Configuration
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vonageApiKey">API Key</Label>
                      <Input
                        id="vonageApiKey"
                        value={smsForm.vonageApiKey}
                        onChange={(e) => setSmsForm({ ...smsForm, vonageApiKey: e.target.value })}
                        placeholder="Enter Vonage API Key"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vonageApiSecret">API Secret</Label>
                      <Input
                        id="vonageApiSecret"
                        type="password"
                        value={smsForm.vonageApiSecret}
                        onChange={(e) => setSmsForm({ ...smsForm, vonageApiSecret: e.target.value })}
                        placeholder="Enter API Secret"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vonageFromNumber">From Number / Brand Name</Label>
                    <Input
                      id="vonageFromNumber"
                      value={smsForm.vonageFromNumber}
                      onChange={(e) => setSmsForm({ ...smsForm, vonageFromNumber: e.target.value })}
                      placeholder="JustBecause or +1234567890"
                    />
                    <p className="text-xs text-muted-foreground">
                      Can be a brand name (alphanumeric) or phone number. Brand names work in most countries.
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                    <p className="font-medium mb-2">Get Vonage Credentials:</p>
                    <ol className="list-decimal ml-4 space-y-1 text-xs text-muted-foreground">
                      <li>Login: <a href="https://dashboard.nexmo.com" target="_blank" className="text-blue-600 hover:underline">dashboard.nexmo.com</a></li>
                      <li>Go to Settings → API Settings</li>
                      <li>Copy your API Key and API Secret</li>
                      <li>Current Balance: $9.00</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* MSG91 Configuration */}
              {smsForm.provider === "msg91" && (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    MSG91 Configuration
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="msg91AuthKey">Auth Key</Label>
                      <Input
                        id="msg91AuthKey"
                        type="password"
                        value={smsForm.msg91AuthKey}
                        onChange={(e) => setSmsForm({ ...smsForm, msg91AuthKey: e.target.value })}
                        placeholder="Enter MSG91 auth key"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="msg91SenderId">Sender ID</Label>
                      <Input
                        id="msg91SenderId"
                        value={smsForm.msg91SenderId}
                        onChange={(e) => setSmsForm({ ...smsForm, msg91SenderId: e.target.value })}
                        placeholder="VERIFY"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="msg91TemplateId">Template ID (Optional)</Label>
                    <Input
                      id="msg91TemplateId"
                      value={smsForm.msg91TemplateId}
                      onChange={(e) => setSmsForm({ ...smsForm, msg91TemplateId: e.target.value })}
                      placeholder="DLT approved template ID"
                    />
                    <p className="text-xs text-muted-foreground">
                      Required for Indian DLT compliance
                    </p>
                  </div>
                </div>
              )}

              {/* TextLocal Configuration */}
              {smsForm.provider === "textlocal" && (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    TextLocal Configuration
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="textlocalApiKey">API Key</Label>
                      <Input
                        id="textlocalApiKey"
                        type="password"
                        value={smsForm.textlocalApiKey}
                        onChange={(e) => setSmsForm({ ...smsForm, textlocalApiKey: e.target.value })}
                        placeholder="Enter TextLocal API key"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="textlocalSender">Sender Name</Label>
                      <Input
                        id="textlocalSender"
                        value={smsForm.textlocalSender}
                        onChange={(e) => setSmsForm({ ...smsForm, textlocalSender: e.target.value })}
                        placeholder="VERIFY"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <Button onClick={saveSmsConfig} disabled={smsSaving} className="w-full sm:w-auto">
                {smsSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save SMS Configuration
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Test SMS */}
          <Card>
            <CardHeader>
              <CardTitle>Test SMS Configuration</CardTitle>
              <CardDescription>
                Send a test SMS to verify your configuration is working
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter phone number (e.g., +919876543210)"
                  value={smsTestPhone}
                  onChange={(e) => setSmsTestPhone(e.target.value)}
                />
                <Button onClick={testSmsConfig} disabled={smsTesting || smsForm.provider === "none"}>
                  {smsTesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Test
                    </>
                  )}
                </Button>
              </div>
              {smsForm.provider === "none" && (
                <p className="text-sm text-yellow-600">
                  Configure an SMS provider above before testing
                </p>
              )}
            </CardContent>
          </Card>

          {/* Phone Verification Toggle */}
          <Card>
            <CardHeader>
              <CardTitle>Phone Verification Settings</CardTitle>
              <CardDescription>
                Control phone verification requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Require Phone Verification</p>
                  <p className="text-sm text-muted-foreground">
                    Require volunteers to verify their phone number during onboarding
                  </p>
                </div>
                <Switch
                  checked={settings?.requirePhoneVerification || false}
                  onCheckedChange={(checked) =>
                    setSettings(settings ? { ...settings, requirePhoneVerification: checked } : null)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Verification Requirements</CardTitle>
              <CardDescription>
                Set verification requirements for users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Verification</p>
                  <p className="text-sm text-muted-foreground">
                    Require users to verify their email address before using the platform
                  </p>
                </div>
                <Switch
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, requireEmailVerification: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">NGO Verification</p>
                  <p className="text-sm text-muted-foreground">
                    Require NGOs to be verified by admin before they can post opportunities
                  </p>
                </div>
                <Switch
                  checked={settings.requireNGOVerification}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, requireNGOVerification: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
