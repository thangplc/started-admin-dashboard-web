import { delay, http, HttpResponse } from "msw"

import type { LoginRequest, LoginResponse, RefreshRequest } from "@/api/generated/model"
import { db } from "../db"
import { apiUrl, getAuthUser, issueTokens, unauthorized, validationError } from "../utils"

export const authHandlers = [
  http.post<never, LoginRequest>(apiUrl("/auth/login"), async ({ request }) => {
    await delay()
    const { email, password } = await request.json()

    if (!email || !password) {
      return validationError([
        ...(!email ? [{ field: "email", message: "Email is required." }] : []),
        ...(!password ? [{ field: "password", message: "Password is required." }] : []),
      ])
    }

    const user = db.users.find((candidate) => candidate.email === email.toLowerCase())
    if (!user || db.passwords.get(user.id) !== password) {
      return unauthorized("Wrong email or password.")
    }

    return HttpResponse.json<LoginResponse>({ ...issueTokens(user.id), user })
  }),

  http.post<never, RefreshRequest>(apiUrl("/auth/refresh"), async ({ request }) => {
    await delay(150)
    const { refreshToken } = await request.json()
    const userId = db.sessions.get(refreshToken)
    if (!userId) return unauthorized()

    // Rotate: the old refresh token stops working.
    db.sessions.delete(refreshToken)
    return HttpResponse.json(issueTokens(userId))
  }),

  http.post<never, RefreshRequest>(apiUrl("/auth/logout"), async ({ request }) => {
    const { refreshToken } = await request.json()
    db.sessions.delete(refreshToken)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(apiUrl("/auth/me"), async ({ request }) => {
    await delay(150)
    const user = getAuthUser(request)
    return user ? HttpResponse.json(user) : unauthorized()
  }),
]
