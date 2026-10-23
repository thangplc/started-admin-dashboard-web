import { HttpResponse } from "msw"

import type { ErrorResponse, FieldError } from "@/api/generated/model"
import { env } from "@/config/env"
import { ACCESS_TOKEN_TTL_SECONDS, db } from "./db"

/** Full URL for a handler, so mocks only answer calls to our API. */
export const apiUrl = (path: string) => `${env.apiUrl}${path}`

export function errorResponse(status: number, body: ErrorResponse) {
  return HttpResponse.json(body, { status })
}

export function validationError(errors: FieldError[]) {
  return errorResponse(422, {
    code: "VALIDATION_FAILED",
    message: "Some fields are invalid.",
    errors,
  })
}

export function notFound(what: string) {
  return errorResponse(404, { code: "NOT_FOUND", message: `${what} not found.` })
}

export function unauthorized(message = "Your session has expired. Please sign in again.") {
  return errorResponse(401, { code: "UNAUTHORIZED", message })
}

// Mock token format: "mock-access.<userId>.<expiresAtMs>". Not a real JWT, but the
// client treats it as opaque either way.
export function issueTokens(userId: string) {
  const expiresAt = Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000
  const refreshToken = crypto.randomUUID()
  db.sessions.set(refreshToken, userId)
  return {
    accessToken: `mock-access.${userId}.${expiresAt}`,
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  }
}

/** The signed-in user for a request, or null when the token is missing, bad or expired. */
export function getAuthUser(request: Request) {
  const token = request.headers.get("Authorization")?.replace(/^Bearer /, "")
  const [prefix, userId, expiresAt] = token?.split(".") ?? []
  if (prefix !== "mock-access" || Number(expiresAt) < Date.now()) return null
  return db.users.find((user) => user.id === userId) ?? null
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Server-side checks for create / update, mirroring the constraints in openapi.yaml. */
export function validateUser(
  body: { name?: string; email?: string },
  options: { partial: boolean; ignoreId?: string }
) {
  const errors: FieldError[] = []
  const { name, email } = body

  if (name !== undefined || !options.partial) {
    const length = name?.trim().length ?? 0
    if (length < 2 || length > 100) {
      errors.push({ field: "name", message: "Name must be 2–100 characters." })
    }
  }

  if (email !== undefined || !options.partial) {
    if (!email || !EMAIL_PATTERN.test(email)) {
      errors.push({ field: "email", message: "Enter a valid email address." })
    } else if (
      db.users.some((user) => user.email === email.toLowerCase() && user.id !== options.ignoreId)
    ) {
      errors.push({ field: "email", message: "This email is already in use." })
    }
  }

  return errors
}
