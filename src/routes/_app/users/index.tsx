import { useCallback } from "react"
import { keepPreviousData, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, stripSearchParams, useNavigate } from "@tanstack/react-router"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import {
  UserRole,
  UserSortField,
  UserStatus,
  type ListUsersParams,
  type User,
} from "@/api/generated/model"
import {
  getListUsersQueryKey,
  getListUsersQueryOptions,
  useDeleteUser,
  useListUsers,
} from "@/api/generated/users/users"
import { DataTable, type DataTableFilter, type RowAction } from "@/components/common/data-table"
import { EmptyState } from "@/components/common/empty-state"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { useDataTableUrlState } from "@/hooks/use-data-table-url-state"
import { getErrorMessage } from "@/lib/api/error-message"
import { useUserColumns } from "./-components/columns"

// Every piece of list state lives in the URL: /users?q=an&role=admin&sortBy=name&page=2
// Bad values (?page=abc, ?role=boss) are dropped instead of breaking the page.
const searchSchema = z.object({
  page: z.number().int().min(1).optional().catch(undefined),
  pageSize: z.number().int().min(1).max(100).optional().catch(undefined),
  q: z.string().optional().catch(undefined),
  role: z.enum(UserRole).optional().catch(undefined),
  status: z.enum(UserStatus).optional().catch(undefined),
  sortBy: z.enum(UserSortField).optional().catch(undefined),
  sortOrder: z.enum(["asc", "desc"]).optional().catch(undefined),
})
type UsersSearch = z.infer<typeof searchSchema>

const DEFAULTS = { pageSize: 10, sortBy: "createdAt", sortOrder: "desc" } as const
const FILTER_KEYS = ["role", "status"] as const

/** URL → API params. Shared by the loader (prefetch) and the page so both hit the same cache entry. */
function toListParams(search: UsersSearch): ListUsersParams {
  return {
    page: search.page ?? 1,
    pageSize: search.pageSize ?? DEFAULTS.pageSize,
    search: search.q,
    role: search.role,
    status: search.status,
    sortBy: search.sortBy ?? DEFAULTS.sortBy,
    sortOrder: search.sortOrder ?? DEFAULTS.sortOrder,
  }
}

export const Route = createFileRoute("/_app/users/")({
  validateSearch: searchSchema,
  search: { middlewares: [stripSearchParams({ page: 1, pageSize: DEFAULTS.pageSize })] },
  loaderDeps: ({ search }) => toListParams(search),
  // Start fetching as soon as navigation starts (or on hover, with defaultPreload: "intent"),
  // without blocking it: the page shows its own loading state.
  loader: ({ context, deps }) => {
    void context.queryClient.prefetchQuery(getListUsersQueryOptions(deps))
  },
  component: UsersPage,
})

function UsersPage() {
  const { t } = useTranslation()
  const columns = useUserColumns()
  const queryClient = useQueryClient()
  const navigate = useNavigate({ from: Route.fullPath })
  const search = Route.useSearch()

  const setSearch = useCallback(
    (patch: Partial<UsersSearch>) =>
      void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true }),
    [navigate]
  )
  const { tableProps } = useDataTableUrlState({
    search,
    setSearch,
    filterKeys: FILTER_KEYS,
    defaults: DEFAULTS,
  })

  const { data, isPending, isError, error, refetch } = useListUsers(toListParams(search), {
    // Keep showing the previous page while the next one loads (no flash of skeletons).
    query: { placeholderData: keepPreviousData },
  })

  // Errors are toasted by the global MutationCache handler (lib/query-client.ts).
  const deleteUser = useDeleteUser({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() }),
    },
  })

  const filters: DataTableFilter[] = [
    {
      columnId: "role",
      title: t("users.columns.role"),
      type: "select",
      options: Object.values(UserRole).map((role) => ({
        value: role,
        label: t(`users.role.${role}`),
      })),
    },
    {
      columnId: "status",
      title: t("users.columns.status"),
      type: "select",
      options: Object.values(UserStatus).map((status) => ({
        value: status,
        label: t(`users.status.${status}`),
      })),
    },
  ]

  const openUser = (user: User) =>
    void navigate({ to: "/users/$userId", params: { userId: user.id } })

  const rowActions = (user: User): RowAction<User>[] => [
    { label: t("users.edit"), icon: PencilIcon, onClick: openUser },
    {
      label: t("users.delete"),
      icon: Trash2Icon,
      variant: "destructive",
      confirm: {
        title: t("users.deleteConfirmTitle", { name: user.name }),
        description: t("users.deleteConfirmDescription"),
        confirmText: t("users.delete"),
      },
      onClick: async () => {
        await deleteUser.mutateAsync({ id: user.id })
        toast.success(t("users.deleted", { name: user.name }))
      },
    },
  ]

  return (
    <>
      <PageHeader title={t("users.title")} description={t("users.description")} />
      {isError ? (
        <EmptyState
          title={t("users.loadError")}
          description={getErrorMessage(error)}
          action={<Button onClick={() => void refetch()}>{t("common.retry")}</Button>}
        />
      ) : (
        <DataTable
          {...tableProps}
          columns={columns}
          data={data?.items ?? []}
          rowCount={data?.meta.total ?? 0}
          getRowId={(user) => user.id}
          isLoading={isPending}
          searchPlaceholder={t("users.searchPlaceholder")}
          filters={filters}
          rowActions={rowActions}
          onRowClick={openUser}
          toolbarActions={
            <Button size="sm" asChild>
              <Link to="/users/new">
                <PlusIcon data-icon="inline-start" />
                {t("users.add")}
              </Link>
            </Button>
          }
          emptyState={
            <EmptyState title={t("users.emptyTitle")} description={t("users.emptyDescription")} />
          }
        />
      )}
    </>
  )
}
