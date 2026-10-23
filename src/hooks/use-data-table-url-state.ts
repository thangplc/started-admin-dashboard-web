import { useCallback, useMemo, useRef } from "react"
import type { ColumnFiltersState, PaginationState, SortingState } from "@tanstack/react-table"

/** URL search params every server-side list page shares. Filters are added per page. */
export type ListSearch = {
  page?: number
  pageSize?: number
  q?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

type Options<TSearch extends ListSearch> = {
  /** The route's validated search params (`Route.useSearch()`). */
  search: TSearch
  /** Merges a patch into the URL, e.g. `navigate({ search: (prev) => ({ ...prev, ...patch }) })`. */
  setSearch: (patch: Partial<TSearch>) => void
  /** Search keys that are also DataTable filter column ids, e.g. ["role", "status"]. */
  filterKeys: readonly (keyof TSearch & string)[]
  defaults: { pageSize: number; sortBy: NonNullable<TSearch["sortBy"]>; sortOrder: "asc" | "desc" }
}

/**
 * Connects a server-side `DataTable` to the URL: page, page size, search box, sorting and
 * filters all live in the query string, so F5, back / forward and shared links keep the view.
 *
 * - Default values are left out of the URL (`/users`, not `/users?page=1&pageSize=10`).
 * - Searching, filtering or sorting goes back to page 1.
 * - Changes made in the same tick (the table reports a filter change and a page reset
 *   separately) are merged into a single history entry.
 */
export function useDataTableUrlState<TSearch extends ListSearch>({
  search,
  setSearch,
  filterKeys,
  defaults,
}: Options<TSearch>) {
  const page = search.page ?? 1
  const pageSize = search.pageSize ?? defaults.pageSize
  const sortBy = (search.sortBy ?? defaults.sortBy) as NonNullable<TSearch["sortBy"]>
  const sortOrder = search.sortOrder ?? defaults.sortOrder

  const pending = useRef<Partial<TSearch> | null>(null)
  const update = useCallback(
    (patch: Partial<TSearch>) => {
      const isFirst = pending.current === null
      pending.current = { ...pending.current, ...patch }
      if (!isFirst) return
      queueMicrotask(() => {
        const merged = pending.current ?? {}
        pending.current = null
        setSearch(merged)
      })
    },
    [setSearch]
  )

  const pagination = useMemo<PaginationState>(
    () => ({ pageIndex: page - 1, pageSize }),
    [page, pageSize]
  )
  const sorting = useMemo<SortingState>(
    () => [{ id: sortBy, desc: sortOrder === "desc" }],
    [sortBy, sortOrder]
  )
  const columnFilters = useMemo<ColumnFiltersState>(
    () =>
      filterKeys
        .filter((key) => search[key] !== undefined)
        .map((key) => ({ id: key, value: search[key] })),
    [filterKeys, search]
  )

  const onPaginationChange = (next: PaginationState) => {
    update({
      page: next.pageIndex > 0 ? next.pageIndex + 1 : undefined,
      pageSize: next.pageSize !== defaults.pageSize ? next.pageSize : undefined,
    } as Partial<TSearch>)
  }

  const onSortingChange = (next: SortingState) => {
    const first = next[0]
    const isDefault =
      !first || (first.id === defaults.sortBy && first.desc === (defaults.sortOrder === "desc"))
    update({
      sortBy: isDefault ? undefined : first.id,
      sortOrder: isDefault ? undefined : first.desc ? "desc" : "asc",
      page: undefined,
    } as Partial<TSearch>)
  }

  const onSearchChange = (value: string) => {
    update({ q: value.trim() || undefined, page: undefined } as Partial<TSearch>)
  }

  const onColumnFiltersChange = (next: ColumnFiltersState) => {
    const patch: Record<string, unknown> = { page: undefined }
    for (const key of filterKeys) {
      const value = next.find((filter) => filter.id === key)?.value
      patch[key] = value === "" || value == null ? undefined : value
    }
    update(patch as Partial<TSearch>)
  }

  return {
    /** Resolved values (defaults applied), ready to send to the API. */
    page,
    pageSize,
    sortBy,
    sortOrder,
    /** Spread onto `<DataTable />`. */
    tableProps: {
      pagination,
      onPaginationChange,
      sorting,
      onSortingChange,
      searchValue: search.q ?? "",
      onSearchChange,
      columnFilters,
      onColumnFiltersChange,
      manualPagination: true,
      manualSorting: true,
      manualFiltering: true,
    },
  }
}
