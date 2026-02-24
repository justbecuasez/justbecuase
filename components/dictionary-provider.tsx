"use client"

import { createContext, useContext, type ReactNode } from "react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dictionary = Record<string, any>

const DictionaryContext = createContext<Dictionary>({})

/**
 * Provides the i18n dictionary to all descendant client components.
 * Wrap your locale layout or page with this provider and pass the
 * dictionary loaded on the server via getDictionary().
 */
export function DictionaryProvider({
  dictionary,
  children,
}: {
  dictionary: Dictionary
  children: ReactNode
}) {
  return (
    <DictionaryContext.Provider value={dictionary}>
      {children}
    </DictionaryContext.Provider>
  )
}

/**
 * Hook to access the i18n dictionary in client components.
 *
 * Usage:
 *   const dict = useDictionary()
 *   dict.hero.tagline
 *
 * Or access a specific section:
 *   const { hero } = useDictionary()
 */
export function useDictionary() {
  const context = useContext(DictionaryContext)
  if (!context || Object.keys(context).length === 0) {
    // Return empty dict — happens during HMR or if provider is missing
    // Components should gracefully fallback
    return {} as Dictionary
  }
  return context
}
