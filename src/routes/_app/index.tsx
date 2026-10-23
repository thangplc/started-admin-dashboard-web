import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import {
  getGetDashboardSummaryQueryOptions,
  useGetDashboardSummary,
} from "@/api/generated/dashboard/dashboard"
import { EmptyState } from "@/components/common/empty-state"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { getErrorMessage } from "@/lib/api/error-message"
import { useCurrentUser } from "@/lib/auth/auth"
import { formatChange, formatCompact } from "@/lib/format"
import { RecentUsers } from "./-dashboard/recent-users"
import { RoleBreakdown } from "./-dashboard/role-breakdown"
import { SignupsChart } from "./-dashboard/signups-chart"
import { StatTile, StatTileSkeleton } from "./-dashboard/stat-tile"

const RANGES = [6, 12] as const

// The period filter lives in the URL (/?months=12) like the users list filters.
const searchSchema = z.object({
  months: z
    .union([z.literal(6), z.literal(12)])
    .optional()
    .catch(undefined),
})

export const Route = createFileRoute("/_app/")({
  staticData: { breadcrumb: "nav.overview" },
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ months: search.months ?? 6 }),
  loader: ({ context, deps }) => {
    void context.queryClient.prefetchQuery(getGetDashboardSummaryQueryOptions(deps))
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const navigate = useNavigate({ from: Route.fullPath })
  const months = Route.useSearch({ select: (search) => search.months ?? 6 })
  const { data, isPending, isError, error, refetch } = useGetDashboardSummary({ months })

  const rangeSelect = (
    <Select
      value={String(months)}
      onValueChange={(value) =>
        void navigate({ search: { months: value === "6" ? undefined : 12 }, replace: true })
      }
    >
      <SelectTrigger className="w-44" aria-label={t("dashboard.range.label")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {RANGES.map((count) => (
          <SelectItem key={count} value={String(count)}>
            {t("dashboard.range.months", { count })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  if (isError) {
    return (
      <>
        <PageHeader title={t("nav.overview")} />
        <EmptyState
          title={t("dashboard.loadError")}
          description={getErrorMessage(error)}
          action={<Button onClick={() => void refetch()}>{t("common.retry")}</Button>}
        />
      </>
    )
  }

  const totals = data?.totals
  const change = data ? formatChange(data.newThisMonth, data.newLastMonth) : null
  const trend = !data
    ? undefined
    : data.newThisMonth > data.newLastMonth
      ? "up"
      : data.newThisMonth < data.newLastMonth
        ? "down"
        : "flat"
  const percentOfTotal = (count: number) =>
    totals && totals.total > 0 ? Math.round((count / totals.total) * 100) : 0

  return (
    <>
      <PageHeader
        title={t("nav.overview")}
        description={t("dashboard.welcome", { name: user?.name ?? "" })}
        actions={rangeSelect}
      />

      {/* KPI row: headline numbers are stat tiles, not charts. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!data || !totals ? (
          Array.from({ length: 4 }, (_, index) => <StatTileSkeleton key={index} />)
        ) : (
          <>
            <StatTile label={t("dashboard.stats.total")} value={formatCompact(totals.total)} />
            <StatTile
              label={t("dashboard.stats.active")}
              value={formatCompact(totals.active)}
              hint={t("dashboard.stats.ofTotal", { percent: percentOfTotal(totals.active) })}
            />
            <StatTile
              label={t("dashboard.stats.invited")}
              value={formatCompact(totals.invited)}
              hint={t("dashboard.stats.ofTotal", { percent: percentOfTotal(totals.invited) })}
            />
            <StatTile
              label={t("dashboard.stats.newThisMonth")}
              value={formatCompact(data.newThisMonth)}
              hint={change ? t("dashboard.stats.vsLastMonth", { value: change }) : undefined}
              trend={change ? trend : undefined}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("dashboard.signups.title")}</CardTitle>
            <CardDescription>{t("dashboard.signups.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <SignupsChart data={data.signups} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.byRole.title")}</CardTitle>
            <CardDescription>{t("dashboard.byRole.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <RoleBreakdown data={data.byRole} total={data.totals.total} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.recent.title")}</CardTitle>
          <CardAction>
            <Button variant="link" size="sm" asChild>
              <Link to="/users">{t("dashboard.recent.viewAll")}</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <RecentUsers users={data.recentUsers} />
          )}
        </CardContent>
      </Card>
    </>
  )
}
