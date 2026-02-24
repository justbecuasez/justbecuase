"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useLocale, localePath } from "@/hooks/use-locale"

export default function GatePage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const locale = useLocale()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        router.push(localePath("/", locale))
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || "Incorrect password")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-2xl font-bold mb-4 shadow-lg">
            JB
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            JustBeCause Network
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enter the access password to continue
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 space-y-5"
        >
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Access Password
            </label>
            <input
              id="password"
              type="password"
              autoFocus
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Verifying…" : "Enter Site"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          This site is currently in private preview.
        </p>
      </div>
    </div>
  )
}
