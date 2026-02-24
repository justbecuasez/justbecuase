"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Home, RefreshCw, Bug } from "lucide-react"
import LocaleLink from "@/components/locale-link"
import { useDictionary } from "@/app/[lang]/dictionary-provider"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const dict = useDictionary()
  const e = (dict as any).errors || {}

  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">{e.somethingWrong || "Something went wrong!"}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">
            {e.somethingWrongDesc || "We apologize for the inconvenience. An unexpected error occurred while processing your request."}
          </p>
          
          {error.digest && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                {e.errorId || "Error ID"}: <code className="text-primary">{error.digest}</code>
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset} variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              {e.tryAgain || "Try Again"}
            </Button>
            <Button asChild variant="outline">
              <LocaleLink href="/">
                <Home className="h-4 w-4 mr-2" />
                {e.goHome || "Go Home"}
              </LocaleLink>
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">
              {e.contactSupport || "If this problem persists, please contact support."}
            </p>
            <Button asChild variant="ghost" size="sm">
              <LocaleLink href="/contact">
                <Bug className="h-4 w-4 mr-2" />
                Report Issue
              </LocaleLink>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
