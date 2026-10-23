import { getResponse, http } from "msw"

import { getAuthMock } from "@/api/generated/auth/auth.msw"
import { getDashboardMock } from "@/api/generated/dashboard/dashboard.msw"
import { getUsersMock } from "@/api/generated/users/users.msw"
import { apiUrl, getAuthUser, unauthorized } from "../utils"
import { authHandlers } from "./auth"
import { dashboardHandlers } from "./dashboard"
import { usersHandlers } from "./users"

/**
 * Generated faker handlers from orval: a fallback that answers any endpoint added to
 * openapi.yaml before someone writes a stateful handler for it.
 * Their URLs are `*\/users`, which would also catch the SPA's own page loads
 * (http://localhost:5173/users), so they only run for requests to the API URL.
 */
const generatedFallback = http.all(apiUrl("/*"), ({ request }) =>
  getResponse([...getAuthMock(), ...getUsersMock(), ...getDashboardMock()], request)
)

/**
 * Like a real backend, everything except login / refresh needs a valid access token.
 * Returning nothing lets the request continue to the next matching handler.
 */
const requireAuth = http.all(apiUrl("/*"), ({ request }) => {
  const path = new URL(request.url).pathname
  if (path.endsWith("/auth/login") || path.endsWith("/auth/refresh")) return
  if (!getAuthUser(request)) return unauthorized()
})

/** MSW uses the first handler that matches: auth check, then stateful handlers, then fallback. */
export const handlers = [
  requireAuth,
  ...authHandlers,
  ...usersHandlers,
  ...dashboardHandlers,
  generatedFallback,
]
