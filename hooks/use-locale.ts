"use client"

import { usePathname } from "next/navigation"
import { i18n, type Locale } from "@/lib/i18n-config"

/**
 * Client-side hook to extract the current locale from the URL pathname.
 * The proxy ensures all page routes start with /{locale}/...
 */
export function useLocale(): Locale {
  const pathname = usePathname()
  const segment = pathname.split("/")[1]

  if (segment && i18n.locales.includes(segment as Locale)) {
    return segment as Locale
  }

  return i18n.defaultLocale
}

/**
 * Prepend the locale prefix to a path.
 * Handles edge cases like already-prefixed paths.
 */
export function localePath(path: string, locale: Locale): string {
  // Already has a locale prefix
  if (i18n.locales.some((l) => path.startsWith(`/${l}/`) || path === `/${l}`)) {
    // Replace existing locale
    return path.replace(/^\/[a-z]{2}(\/|$)/, `/${locale}$1`)
  }

  // Ensure path starts with /
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  return `/${locale}${cleanPath}`
}
