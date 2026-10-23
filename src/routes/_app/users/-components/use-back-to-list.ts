import { useCallback } from "react"
import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router"

/**
 * Leaves a form and returns to the list as the user left it (search, filters, page):
 * history back when we came from inside the app, otherwise plain /users.
 */
export function useBackToList() {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const navigate = useNavigate()

  return useCallback(() => {
    if (canGoBack) router.history.back()
    else void navigate({ to: "/users" })
  }, [canGoBack, router, navigate])
}
