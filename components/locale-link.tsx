"use client"

import Link, { type LinkProps } from "next/link"
import { forwardRef, type AnchorHTMLAttributes } from "react"
import { useLocale, localePath } from "@/hooks/use-locale"

type LocaleLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> &
  LinkProps & {
    children?: React.ReactNode
  }

/**
 * Drop-in replacement for next/link that automatically prepends the
 * current locale from the URL. Works in client components.
 *
 * Usage: <LocaleLink href="/about">About</LocaleLink>
 * Renders: <Link href="/en/about">About</Link>  (if locale is "en")
 */
const LocaleLink = forwardRef<HTMLAnchorElement, LocaleLinkProps>(
  function LocaleLink({ href, ...props }, ref) {
    const locale = useLocale()

    // Resolve href to string
    const hrefString = typeof href === "string" ? href : href.pathname ?? "/"
    const localizedHref = localePath(hrefString, locale)

    // If href was an object (UrlObject), reconstruct it
    const finalHref =
      typeof href === "string"
        ? localizedHref
        : { ...href, pathname: localizedHref }

    return <Link ref={ref} href={finalHref} {...props} />
  }
)

export { LocaleLink }
export default LocaleLink
