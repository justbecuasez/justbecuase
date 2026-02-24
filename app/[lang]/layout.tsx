import { notFound } from "next/navigation"
import { i18n, type Locale } from "@/lib/i18n-config"

/**
 * Locale segment layout — validates that the [lang] param is a supported locale.
 * The root layout (app/layout.tsx) handles <html>, <body>, fonts, ThemeProvider, etc.
 * This layout simply validates the locale and passes children through.
 */

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  // Validate locale — show 404 for unsupported locales
  if (!i18n.locales.includes(lang as Locale)) {
    notFound()
  }

  return <>{children}</>
}
