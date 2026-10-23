import { useNavigate } from "@tanstack/react-router"
import { useCallback } from "react"

import { getGetMeQueryKey, login, logout, useGetMe } from "@/api/generated/auth/auth"
import type { LoginRequest } from "@/api/generated/model"
import { tokenStore } from "@/lib/api/token-store"
import { queryClient } from "@/lib/query-client"

/** True when there are tokens to try. Whether they still work is checked by the route guard. */
export function hasSession() {
  return tokenStore.getAccessToken() !== null || tokenStore.getRefreshToken() !== null
}

/** Signs in, stores the token pair and primes the "current user" cache. */
export async function signIn(credentials: LoginRequest) {
  const { user, ...tokens } = await login(credentials)
  tokenStore.set(tokens)
  queryClient.setQueryData(getGetMeQueryKey(), user)
  return user
}

/**
 * Only allow redirects inside this app: "/users?page=2" yes,
 * "https://evil.example" or "//evil.example" no (open-redirect protection).
 */
export function safeRedirect(target: string | undefined) {
  return target && target.startsWith("/") && !target.startsWith("//") ? target : "/"
}

/** Signs out on the server (best effort), then clears tokens and every cached query. */
export function useSignOut() {
  const navigate = useNavigate()

  return useCallback(async () => {
    const refreshToken = tokenStore.getRefreshToken()
    if (refreshToken) await logout({ refreshToken }).catch(() => undefined)
    tokenStore.clear()
    await navigate({ to: "/login" })
    queryClient.clear()
  }, [navigate])
}

/**
 * The signed-in user. Inside `_app` routes it is always loaded: the guard in
 * src/routes/_app.tsx fetches it before the page renders.
 */
export function useCurrentUser() {
  const { data } = useGetMe({ query: { enabled: hasSession(), staleTime: 5 * 60_000 } })
  return data
}
