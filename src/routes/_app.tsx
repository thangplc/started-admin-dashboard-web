import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { getGetMeQueryOptions } from "@/api/generated/auth/auth"
import { AppShell } from "@/components/layout/app-shell"
import { isApiError } from "@/lib/api/api-error"
import { hasSession } from "@/lib/auth/auth"

/**
 * Pathless layout route: every page under src/routes/_app/ gets the sidebar + header,
 * and is only reachable when signed in.
 */
export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context, location }) => {
    const toLogin = redirect({ to: "/login", search: { redirect: location.href } })
    if (!hasSession()) throw toLogin

    try {
      // Proves the tokens still work (refreshing them if needed) and caches the user.
      await context.queryClient.ensureQueryData(getGetMeQueryOptions())
    } catch (error) {
      if (isApiError(error) && error.isUnauthorized) throw toLogin
      throw error
    }
  },
  component: AppLayout,
})

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
