import { delay, http, HttpResponse } from "msw"

import {
  UserStatus,
  type User,
  type UserCreate,
  type UserListResponse,
  type UserUpdate,
} from "@/api/generated/model"
import { db } from "../db"
import { apiUrl, notFound, validateUser, validationError } from "../utils"

type Params = { id: string }

export const usersHandlers = [
  http.get(apiUrl("/users"), async ({ request }) => {
    await delay()
    const query = new URL(request.url).searchParams
    const page = Math.max(1, Number(query.get("page")) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(query.get("pageSize")) || 10))
    const search = query.get("search")?.trim().toLowerCase()
    const role = query.get("role")
    const status = query.get("status")
    const sortBy = (query.get("sortBy") ?? "createdAt") as keyof Pick<
      User,
      "name" | "email" | "createdAt"
    >
    const direction = query.get("sortOrder") === "asc" ? 1 : -1

    const filtered = db.users
      .filter(
        (user) =>
          (!search || user.name.toLowerCase().includes(search) || user.email.includes(search)) &&
          (!role || user.role === role) &&
          (!status || user.status === status)
      )
      .sort((a, b) => a[sortBy].localeCompare(b[sortBy]) * direction)

    const total = filtered.length
    return HttpResponse.json<UserListResponse>({
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    })
  }),

  http.post<never, UserCreate>(apiUrl("/users"), async ({ request }) => {
    await delay()
    const body = await request.json()
    const errors = validateUser(body, { partial: false })
    if (errors.length) return validationError(errors)

    const user: User = {
      id: crypto.randomUUID(),
      name: body.name.trim(),
      email: body.email.toLowerCase(),
      role: body.role,
      status: body.status ?? UserStatus.invited,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    }
    db.users.unshift(user)
    return HttpResponse.json(user, { status: 201 })
  }),

  http.get<Params>(apiUrl("/users/:id"), async ({ params }) => {
    await delay()
    const user = db.users.find((candidate) => candidate.id === params.id)
    return user ? HttpResponse.json(user) : notFound("User")
  }),

  http.patch<Params, UserUpdate>(apiUrl("/users/:id"), async ({ params, request }) => {
    await delay()
    const index = db.users.findIndex((candidate) => candidate.id === params.id)
    if (index === -1) return notFound("User")

    const body = await request.json()
    const errors = validateUser(body, { partial: true, ignoreId: params.id })
    if (errors.length) return validationError(errors)

    const updated: User = {
      ...db.users[index],
      ...body,
      ...(body.name && { name: body.name.trim() }),
      ...(body.email && { email: body.email.toLowerCase() }),
    }
    db.users[index] = updated
    return HttpResponse.json(updated)
  }),

  http.delete<Params>(apiUrl("/users/:id"), async ({ params }) => {
    await delay()
    const index = db.users.findIndex((candidate) => candidate.id === params.id)
    if (index === -1) return notFound("User")
    db.users.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
