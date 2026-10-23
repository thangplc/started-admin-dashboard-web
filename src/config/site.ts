import type { LinkProps } from "@tanstack/react-router"
import { LayoutDashboardIcon, UsersIcon, type LucideIcon } from "lucide-react"

import { env } from "@/config/env"
import type { TranslationKey } from "@/lib/i18n"

export type NavItem = {
  /** Translation key of the label, e.g. "nav.users". */
  titleKey: TranslationKey
  /** Type-checked against the route tree: a typo here is a compile error. */
  url: NonNullable<LinkProps["to"]>
  icon: LucideIcon
}

export type NavGroup = {
  labelKey: TranslationKey
  items: NavItem[]
}

/** Edit per project: app name, sidebar navigation. */
export const siteConfig = {
  name: env.appName,
  description: "Vite · React · TanStack Router",
  nav: [
    {
      labelKey: "nav.general",
      items: [
        { titleKey: "nav.overview", url: "/", icon: LayoutDashboardIcon },
        { titleKey: "nav.users", url: "/users", icon: UsersIcon },
      ],
    },
  ] satisfies NavGroup[],
}
