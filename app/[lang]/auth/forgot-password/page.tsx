"use client"

import type React from "react"
import { useState } from "react"
import LocaleLink from "@/components/locale-link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { useDictionary } from "@/components/dictionary-provider"

export default function ForgotPasswordPage() {
  const dict = useDictionary()
  const a = (dict as any).auth || {}
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [codeInput, setCodeInput] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log(`[ForgotPassword] Requesting reset for email: ${email}`)
      // Trigger server-side better-auth reset; our sendResetPassword hook will send a code
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: "/auth/reset-password",
      })
      console.log(`[ForgotPassword] Result:`, result)

      if (result.error) {
        console.log(`[ForgotPassword] Error:`, result.error)
        setError(result.error.message || (a.failedSendResetEmail || "Failed to send reset email"))
        setIsLoading(false)
        return
      }

      // Show UI to accept verification code
      console.log(`[ForgotPassword] Success - showing code input`)
      setIsSubmitted(true)
    } catch (err: any) {
      console.error(`[ForgotPassword] Exception:`, err)
      setError(err.message || (a.somethingWentWrong || "Something went wrong"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (code: string) => {
    setIsLoading(true)
    setError("")
    try {
      console.log(`[ForgotPassword] Verifying code: ${code} for email: ${email}`)
      const res = await fetch('/api/auth/password/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })
      const data = await res.json()
      console.log(`[ForgotPassword] Verify response:`, data)
      
      if (!data.success) {
        setError(data.error || (a.invalidCode || 'Invalid code'))
        setIsLoading(false)
        return
      }

      // Redirect to the reset URL (now contains just the path with token)
      if (data.resetUrl) {
        console.log(`[ForgotPassword] Redirecting to: ${data.resetUrl}`)
        router.push(data.resetUrl)
      } else {
        setError(a.noResetUrl || 'No reset URL returned')
        setIsLoading(false)
      }
    } catch (err: any) {
      console.error(`[ForgotPassword] Verify exception:`, err)
      setError(err.message || (a.somethingWentWrong || 'Something went wrong'))
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md">
        <LocaleLink href="/" className="flex items-center gap-2 mb-8 justify-center">
          <Image src="/logo-main.png" alt="JBC Logo" width={240} height={117} className="h-20 w-auto" />
        </LocaleLink>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">{a.resetPassword || "Reset your password"}</CardTitle>
            <CardDescription>
              {isSubmitted
                ? (a.checkEmail || "Check your email for reset instructions")
                : (a.resetPasswordDesc || "Enter your email and we'll send you a reset link")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-success-light flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{a.enterVerificationCode || "Enter verification code"}</h3>
                <p className="text-muted-foreground mb-4">{(a.emailedCodeTo || "We emailed a 6-digit code to") + " "}<strong>{email}</strong>{". "}{a.enterCodeBelow || "Enter it below to continue."}</p>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      onChange={(e) => setCodeInput(e.target.value)}
                      value={codeInput}
                      className="w-full px-4 py-2 border rounded"
                      placeholder={a.enterCodePlaceholder || "Enter 6-digit code"}
                    />
                  </div>
                  {error && <div className="text-sm text-destructive">{error}</div>}
                  <div className="flex gap-2">
                    <Button onClick={() => handleVerifyCode(codeInput)} className="flex-1" disabled={isLoading}>
                      {isLoading ? (a.verifying || 'Verifying...') : (a.verifyCode || 'Verify Code')}
                    </Button>
                    <Button asChild variant="ghost">
                      <LocaleLink href="/auth/signin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {a.signIn || "Sign in"}
                      </LocaleLink>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">{a.email || "Email"}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={a.emailPlaceholder || "you@example.com"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {a.sending || "Sending..."}
                    </>
                  ) : (
                    a.sendResetLink || "Send Reset Link"
                  )}
                </Button>

                <Button asChild variant="ghost" className="w-full">
                  <LocaleLink href="/auth/signin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {a.backToSignIn || "Back to sign in"}
                  </LocaleLink>
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
