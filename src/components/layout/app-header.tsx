import { Fragment } from "react"
import { Link, useMatches } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ThemeToggle } from "@/components/common/theme-toggle"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { LanguageSwitcher } from "./language-switcher"
import { UserMenu } from "./user-menu"

/**
 * Sticky top bar: sidebar toggle, breadcrumbs, language, theme and user menu. Part of AppShell.
 * Breadcrumbs come from the matched routes' `staticData.breadcrumb` (a translation key),
 * e.g. /users/new → "Users › New user".
 */
export function AppHeader() {
  const { t } = useTranslation()
  const crumbs = useMatches({
    select: (matches) =>
      matches.flatMap((match) =>
        match.staticData.breadcrumb
          ? [{ id: match.id, pathname: match.pathname, label: match.staticData.breadcrumb }]
          : []
      ),
  })

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, index) => (
            <Fragment key={crumb.id}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {index === crumbs.length - 1 ? (
                  <BreadcrumbPage>{t(crumb.label)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.pathname}>{t(crumb.label)}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
