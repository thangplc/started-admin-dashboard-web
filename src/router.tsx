import type { QueryClient } from "@tanstack/react-query"
import { createRouter } from "@tanstack/react-router"
import { toast } from "sonner"

import { RouteError } from "@/components/route-error"
import { onSessionExpired } from "@/lib/api/session-events"
import { i18n, type TranslationKey } from "@/lib/i18n"
import { queryClient } from "@/lib/query-client"
import { routeTree } from "./routeTree.gen"

/** Available in every route's `beforeLoad` / `loader` as `context`. */
export type RouterContext = {
  queryClient: QueryClient
}

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  // Preloading on hover shouldn't serve stale data: let TanStack Query decide freshness.
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  defaultErrorComponent: RouteError,
})

// A 401 the API client couldn't fix by refreshing: back to /login, then come back here.
onSessionExpired(() => {
  toast.warning(i18n.t("auth.sessionExpired"), { id: "session-expired" })
  const { pathname, href } = router.state.location
  if (pathname !== "/login") {
    void router
      .navigate({ to: "/login", search: { redirect: href } })
      .then(() => queryClient.clear())
  }
})

// Registers the route tree so <Link to>, useParams, useSearch... are type-checked.
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
  interface StaticDataRouteOption {
    /** Translation key shown in the header breadcrumbs for this route. */
    breadcrumb?: TranslationKey
  }
}
