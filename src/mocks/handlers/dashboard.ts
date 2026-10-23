import { delay, http, HttpResponse } from "msw"

import { UserRole, type DashboardSummary } from "@/api/generated/model"
import { db } from "../db"
import { apiUrl } from "../utils"

/** "2026-10" for a date, in local time (what the user sees on the chart). */
const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

export const dashboardHandlers = [
  http.get(apiUrl("/dashboard/summary"), async ({ request }) => {
    await delay()
    const months = new URL(request.url).searchParams.get("months") === "12" ? 12 : 6
    const users = db.users

    const countByMonth = new Map<string, number>()
    for (const user of users) {
      const key = monthKey(new Date(user.createdAt))
      countByMonth.set(key, (countByMonth.get(key) ?? 0) + 1)
    }

    const now = new Date()
    const signups = Array.from({ length: months }, (_, index) => {
      const month = monthKey(new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1))
      return { month, count: countByMonth.get(month) ?? 0 }
    })
    const lastMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1))

    return HttpResponse.json<DashboardSummary>({
      totals: {
        total: users.length,
        active: users.filter((user) => user.status === "active").length,
        invited: users.filter((user) => user.status === "invited").length,
        inactive: users.filter((user) => user.status === "inactive").length,
      },
      newThisMonth: countByMonth.get(monthKey(now)) ?? 0,
      newLastMonth: countByMonth.get(lastMonth) ?? 0,
      signups,
      byRole: Object.values(UserRole).map((role) => ({
        role,
        count: users.filter((user) => user.role === role).length,
      })),
      recentUsers: [...users].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    })
  }),
]
