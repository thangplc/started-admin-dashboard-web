import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form"

import { isApiError } from "@/lib/api/api-error"
import { getErrorMessage } from "@/lib/api/error-message"

/**
 * Shows a failed submit in the form: the server's 422 `errors` go under their fields,
 * anything else becomes a form-level error (`errors.root.server`).
 * Fields the form doesn't have are reported at the form level too.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly FieldPath<T>[]
) {
  const fieldErrors = isApiError(error) ? error.fieldErrors : []
  const unmatched: string[] = []

  for (const { field, message } of fieldErrors) {
    if ((fields as readonly string[]).includes(field)) {
      setError(field as FieldPath<T>, { type: "server", message })
    } else {
      unmatched.push(message)
    }
  }

  if (fieldErrors.length === 0 || unmatched.length > 0) {
    setError("root.server", {
      type: "server",
      message: unmatched.length > 0 ? unmatched.join(" ") : getErrorMessage(error),
    })
  }
}
