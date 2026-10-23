import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { useTranslation } from "react-i18next"

import { EmptyState } from "@/components/common/empty-state"
import { Button } from "@/components/ui/button"
import type { RouterContext } from "@/router"

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  return (
    <>
      <Outlet />
      {import.meta.env.DEV && (
        // Bottom-left, next to the React Query button: the right side holds the table pagination.
        <TanStackRouterDevtools
          position="bottom-left"
          toggleButtonProps={{ style: { left: "4rem" } }}
        />
      )}
    </>
  )
}

function NotFound() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <EmptyState
        title={t("notFound.title")}
        description={t("notFound.description")}
        action={
          <Button asChild>
            <Link to="/">{t("common.backHome")}</Link>
          </Button>
        }
      />
    </div>
  )
}
