import { useEffect } from "react"
import { useQueryErrorResetBoundary } from "@tanstack/react-query"
import { Link, useRouter, type ErrorComponentProps } from "@tanstack/react-router"
import { TriangleAlertIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { EmptyState } from "@/components/common/empty-state"
import { Button } from "@/components/ui/button"
import { isApiError } from "@/lib/api/api-error"
import { getErrorMessage } from "@/lib/api/error-message"

/**
 * Shown in place of a route when its `beforeLoad` / `loader` throws or its component
 * crashes while rendering. The rest of the app (sidebar, header) keeps working.
 */
export function RouteError({ error, reset }: ErrorComponentProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const queryErrorBoundary = useQueryErrorResetBoundary()

  useEffect(() => {
    // Let queries that failed inside this boundary fetch again on retry.
    queryErrorBoundary.reset()
  }, [queryErrorBoundary])

  const retry = () => {
    reset()
    void router.invalidate()
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <EmptyState
        icon={<TriangleAlertIcon />}
        title={t("errors.title")}
        description={
          <>
            {getErrorMessage(error)}
            {import.meta.env.DEV && error instanceof Error && !isApiError(error) && (
              <code className="mt-2 block text-xs break-all">{error.message}</code>
            )}
          </>
        }
        action={
          <div className="flex gap-2">
            <Button onClick={retry}>{t("common.retry")}</Button>
            <Button variant="outline" asChild>
              <Link to="/">{t("common.backHome")}</Link>
            </Button>
          </div>
        }
      />
    </div>
  )
}
