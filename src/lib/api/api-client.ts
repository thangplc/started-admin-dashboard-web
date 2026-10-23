import type { AuthTokens } from "@/api/generated/model"
import { env } from "@/config/env"
import { ApiError, type FieldError } from "./api-error"
import { notifySessionExpired } from "./session-events"
import { tokenStore } from "./token-store"

type ErrorBody = { code?: string; message?: string; errors?: FieldError[] }

/** Auth endpoints answer 401 for wrong credentials / bad refresh token: never refresh-and-retry them. */
const NO_REFRESH_PATHS = ["/auth/login", "/auth/refresh"]

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined
  const text = await response.text()
  if (!text) return undefined
  const isJson = response.headers.get("content-type")?.includes("json")
  return isJson ? JSON.parse(text) : text
}

function toApiError(status: number, body: unknown, statusText: string) {
  const data = (typeof body === "object" && body !== null ? body : {}) as ErrorBody
  return new ApiError({
    status,
    code: data.code ?? `HTTP_${status}`,
    message: data.message ?? (statusText || "Request failed"),
    fieldErrors: data.errors,
  })
}

async function send(url: string, options: RequestInit) {
  const headers = new Headers(options.headers)
  headers.set("Accept", "application/json")
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const accessToken = tokenStore.getAccessToken()
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`)

  try {
    return await fetch(`${env.apiUrl}${url}`, { ...options, headers })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause
    throw new ApiError({
      status: 0,
      code: "NETWORK_ERROR",
      message: "Cannot reach the server.",
      cause,
    })
  }
}

let refreshing: Promise<boolean> | null = null

/**
 * Swaps the refresh token for a new pair. Several requests failing with 401 at the same
 * time share one refresh call instead of each sending their own (the server rotates
 * refresh tokens, so a second call with the old one would fail).
 */
function refreshTokens(): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = tokenStore.getRefreshToken()
    if (!refreshToken) return false
    try {
      const response = await send("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      })
      if (!response.ok) return false
      const tokens = (await response.json()) as AuthTokens
      tokenStore.set(tokens)
      return true
    } catch {
      return false
    }
  })().finally(() => {
    refreshing = null
  })
  return refreshing
}

/**
 * The one place every generated API call goes through (orval `mutator`):
 * base URL, JSON headers, bearer token, refresh-and-retry on 401, and errors
 * normalised to `ApiError`. Resolves with the parsed body.
 */
export async function customFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  let response = await send(url, options)

  const path = url.split("?")[0]
  if (response.status === 401 && !NO_REFRESH_PATHS.includes(path)) {
    const hadSession = tokenStore.getRefreshToken() !== null
    if (await refreshTokens()) {
      response = await send(url, options)
    }
    if (response.status === 401) {
      // Refresh failed or the new token was rejected too: the session is over.
      tokenStore.clear()
      if (hadSession) notifySessionExpired()
    }
  }

  const body = await parseBody(response)
  if (!response.ok) throw toApiError(response.status, body, response.statusText)
  return body as T
}

/** Lets generated hooks type their `error` as `ApiError`. */
export type ErrorType<_Error> = ApiError

/** Lets generated hooks type request bodies. */
export type BodyType<Body> = Body
