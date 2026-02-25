"use client"

import { useEffect } from "react"

/**
 * Client component that sets the `lang` and `dir` attributes on the root
 * <html> element. This is needed because the root layout is rendered once
 * and doesn't have access to the [lang] dynamic segment.
 */
export function HtmlDirSetter({ lang, dir }: { lang: string; dir: "ltr" | "rtl" }) {
  useEffect(() => {
    const html = document.documentElement
    html.setAttribute("lang", lang)
    html.setAttribute("dir", dir)
  }, [lang, dir])

  return null
}
