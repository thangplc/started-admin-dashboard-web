import type { ReactNode } from "react"
import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type StatTileProps = {
  label: string
  value: string
  /** One line under the value, e.g. "+12% vs last month" or "64% of total". */
  hint?: ReactNode
  /** Direction of `hint` when it is a change; only the icon is coloured, the text stays muted. */
  trend?: "up" | "down" | "flat"
}

const trendIcon = {
  up: <TrendingUpIcon className="size-4 text-success" aria-hidden />,
  down: <TrendingDownIcon className="size-4 text-destructive" aria-hidden />,
  flat: <MinusIcon className="size-4 text-muted-foreground" aria-hidden />,
}

/** Headline number: label, value, optional change / share line. */
export function StatTile({ label, value, hint, trend }: StatTileProps) {
  return (
    <Card className="gap-2 py-4">
      <CardContent className="flex flex-col gap-1 px-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-3xl font-semibold tracking-tight">{value}</span>
        {hint && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {trend && trendIcon[trend]}
            {hint}
          </span>
        )}
      </CardContent>
    </Card>
  )
}

export function StatTileSkeleton() {
  return (
    <Card className="gap-2 py-4">
      <CardContent className="flex flex-col gap-2 px-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}
