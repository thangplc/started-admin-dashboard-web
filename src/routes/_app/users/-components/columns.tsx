import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useTranslation } from "react-i18next"

import type { User, UserStatus } from "@/api/generated/model"
import { sortableHeader } from "@/components/common/data-table"
import { Badge } from "@/components/ui/badge"

const statusVariant = {
  active: "default",
  invited: "secondary",
  inactive: "outline",
} as const satisfies Record<UserStatus, string>

/**
 * Column ids match the API's `sortBy` values (name, email, createdAt), so the table's
 * sorting state can be sent to the server as is. A hook so headers follow the language.
 */
export function useUserColumns(): ColumnDef<User>[] {
  const { t, i18n } = useTranslation()

  return useMemo(
    () => [
      {
        accessorKey: "name",
        header: sortableHeader(t("users.columns.name")),
        meta: { label: t("users.columns.name") },
        size: 200,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "email",
        header: sortableHeader(t("users.columns.email")),
        meta: { label: t("users.columns.email") },
        size: 260,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
      },
      {
        accessorKey: "role",
        header: t("users.columns.role"),
        meta: { label: t("users.columns.role") },
        size: 110,
        enableSorting: false,
        cell: ({ row }) => t(`users.role.${row.original.role}`),
      },
      {
        accessorKey: "status",
        header: t("users.columns.status"),
        meta: { label: t("users.columns.status"), fixedWidth: true },
        size: 120,
        enableSorting: false,
        cell: ({ row }) => (
          <Badge variant={statusVariant[row.original.status]}>
            {t(`users.status.${row.original.status}`)}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: sortableHeader(t("users.columns.createdAt")),
        meta: { label: t("users.columns.createdAt"), fixedWidth: true },
        size: 120,
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(i18n.language),
      },
    ],
    [t, i18n.language]
  )
}
