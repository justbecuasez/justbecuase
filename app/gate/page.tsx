"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function GatePage() {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })

      if (res.ok) {
        router.push("/")
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.message || "Invalid access code")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 text-white text-2xl font-bold mb-4 shadow-lg">
            JB
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            JustBeCause Network
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            This platform is currently in private development.
            <br />
            Enter the access code to continue.
          </p>
        </div>

        {/* Access Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 space-y-6"
        >
          <div>
            <label
              htmlFor="access-code"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Access Code
            </label>
            <input
              id="access-code"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your access code"
              required
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !code}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold hover:from-teal-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/25"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Verifying...
              </span>
            ) : (
              "Enter Platform"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          &copy; {new Date().getFullYear()} JustBeCause Network. All rights reserved.
          <br />
          Contact the team if you need access.
        </p>
      </div>
    </div>
  )
}
