import { i18n } from "@/lib/i18n"

/** 1,284 · 12.9K · 4.2M in the current language. */
export function formatCompact(value: number) {
  return new Intl.NumberFormat(i18n.language, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

/** Signed percent change from `previous` to `current`: "+12%", "−5%"; null when there's no base. */
export function formatChange(current: number, previous: number) {
  if (previous === 0) return null
  return new Intl.NumberFormat(i18n.language, {
    style: "percent",
    signDisplay: "exceptZero",
    maximumFractionDigits: 0,
  }).format((current - previous) / previous)
}

/** "2026-10" → "Oct" / "thg 10" (short) or "October 2026" / "tháng 10, 2026" (long). */
export function formatMonth(month: string, style: "short" | "long" = "short") {
  const [year, monthIndex] = month.split("-").map(Number)
  const date = new Date(year, monthIndex - 1, 1)
  return new Intl.DateTimeFormat(i18n.language, {
    month: style,
    ...(style === "long" && { year: "numeric" }),
  }).format(date)
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(i18n.language)
}

/** "Demo Admin" → "DA" (last two words), for avatar fallbacks. */
export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}
