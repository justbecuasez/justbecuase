import { notFound } from "next/navigation"
import { i18n, type Locale } from "@/lib/i18n-config"
import { getDictionary } from "./dictionaries"
import { DictionaryProvider } from "@/components/dictionary-provider"

/**
 * Locale segment layout — validates that the [lang] param is a supported locale.
 * Loads the dictionary and wraps all children with DictionaryProvider so every
 * page and component under [lang] can call useDictionary().
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

  const dict = await getDictionary(lang as Locale)

  return (
    <DictionaryProvider dictionary={dict}>
      {children}
    </DictionaryProvider>
  )
}
