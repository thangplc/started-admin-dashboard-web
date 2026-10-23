import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useTranslation } from "react-i18next"

import type { MonthlyCount } from "@/api/generated/model"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatMonth } from "@/lib/format"

/**
 * Sign-ups per month as columns: one series, one hue (--chart-1), so no legend box
 * (the card title names it). Hover a month for its exact value; a screen-reader table
 * carries the same numbers.
 */
export function SignupsChart({ data }: { data: MonthlyCount[] }) {
  const { t, i18n } = useTranslation()
  const config = {
    count: { label: t("dashboard.signups.series"), color: "var(--chart-1)" },
  } satisfies ChartConfig

  return (
    <>
      <ChartContainer
        config={config}
        className="aspect-auto h-64 w-full"
        // Month labels depend on the language: re-render the SVG when it changes.
        key={i18n.language}
        aria-hidden
      >
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(month: string) => formatMonth(month)}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={32}
            tickMargin={4}
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.6 }}
            content={
              <ChartTooltipContent
                className="min-w-44 gap-2"
                labelFormatter={(_, payload) =>
                  formatMonth(String(payload?.[0]?.payload?.month ?? ""), "long")
                }
              />
            }
          />
          {/* <= 24px thick, 4px rounded top, square at the baseline. */}
          <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ChartContainer>

      <table className="sr-only">
        <caption>{t("dashboard.signups.title")}</caption>
        <tbody>
          {data.map((row) => (
            <tr key={row.month}>
              <th scope="row">{formatMonth(row.month, "long")}</th>
              <td>{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
