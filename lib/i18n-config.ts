/**
 * Internationalization configuration
 *
 * Supported locales and default locale for the application.
 * Used by proxy.ts (middleware), getDictionary, and locale layout.
 */

export const i18n = {
  defaultLocale: "en" as const,
  locales: ["en", "hi"] as const,
} satisfies {
  defaultLocale: string
  locales: readonly string[]
}

export type Locale = (typeof i18n)["locales"][number]
