import "server-only"
import type { Locale } from "@/lib/i18n-config"

// Dictionary type matches the structure of en.json
const dictionaries: Record<Locale, () => Promise<Record<string, unknown>>> = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  hi: () => import("./dictionaries/hi.json").then((m) => m.default),
}

export const getDictionary = async (locale: Locale) => {
  // Fallback to "en" if the locale isn't found
  const loader = dictionaries[locale] ?? dictionaries.en
  return loader()
}
