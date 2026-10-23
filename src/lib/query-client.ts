import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { isApiError } from "@/lib/api/api-error"
import { getErrorMessage } from "@/lib/api/error-message"

declare module "@tanstack/react-query" {
  interface Register {
    /** `meta: { skipErrorToast: true }` on a query / mutation that shows its own error. */
    queryMeta: { skipErrorToast?: boolean }
    mutationMeta: { skipErrorToast?: boolean }
  }
}

/** 4xx means the request itself is wrong (or unauthorized): retrying won't help. */
function shouldRetry(failureCount: number, error: unknown) {
  if (isApiError(error) && error.status >= 400 && error.status < 500) return false
  return failureCount < 2
}

/** 401 is handled by the auth flow (refresh or back to /login); a toast would be noise. */
function isHandledElsewhere(error: unknown) {
  return isApiError(error) && error.isUnauthorized
}

export const queryClient = new QueryClient({
  // Global error handling. Pages still render their own error state for a failed first
  // load; these toasts cover what a page can't show inline.
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (isHandledElsewhere(error) || query.meta?.skipErrorToast) return
      // Only when stale data is on screen (a background refetch failed). A failed first
      // load has nothing on screen, so the page shows the error itself.
      if (query.state.data !== undefined) toast.error(getErrorMessage(error))
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (isHandledElsewhere(error) || mutation.meta?.skipErrorToast) return
      // 422 belongs under the form fields (see applyServerErrors in lib/forms.ts).
      if (isApiError(error) && error.isValidationError) return
      toast.error(getErrorMessage(error))
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})
