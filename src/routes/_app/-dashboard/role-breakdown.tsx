import { useTranslation } from "react-i18next"

import type { RoleCount } from "@/api/generated/model"

/**
 * Users per role as thin horizontal bars. Same hue for every row: the labels carry
 * identity, the bar length carries the share.
 */
export function RoleBreakdown({ data, total }: { data: RoleCount[]; total: number }) {
  const { t } = useTranslation()

  return (
    <ul className="flex flex-col gap-4">
      {data.map((row) => {
        const share = total > 0 ? row.count / total : 0
        return (
          <li key={row.role} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span>{t(`users.role.${row.role}`)}</span>
              <span className="text-muted-foreground tabular-nums">
                {row.count} · {Math.round(share * 100)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-chart-1"
                style={{ width: `${share * 100}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
