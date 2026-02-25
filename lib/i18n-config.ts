/**
 * Internationalization configuration
 *
 * Supported locales and default locale for the application.
 * Used by proxy.ts (middleware), getDictionary, and locale layout.
 */

export const i18n = {
  defaultLocale: "en" as const,
  locales: ["en", "hi", "pa", "ur"] as const,
  /** Locales that use right-to-left text direction */
  rtlLocales: ["ar", "ur", "he"] as const,
} satisfies {
  defaultLocale: string
  locales: readonly string[]
  rtlLocales: readonly string[]
}

export type Locale = (typeof i18n)["locales"][number]

/** Check if a locale uses right-to-left text direction */
export function isRtlLocale(locale: string): boolean {
  return (i18n.rtlLocales as readonly string[]).includes(locale)
}
