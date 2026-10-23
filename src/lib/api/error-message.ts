import { i18n } from "@/lib/i18n"
import { isApiError } from "./api-error"

/**
 * A message safe to show the user, in the current language.
 * Known error codes / statuses get a translated text; anything else falls back to the
 * server's message, then to a generic one.
 */
export function getErrorMessage(error: unknown): string {
  if (!isApiError(error)) return i18n.t("errors.unknown")

  if (error.isNetworkError) return i18n.t("errors.network")
  if (error.status >= 500) return i18n.t("errors.server")

  switch (error.code) {
    case "UNAUTHORIZED":
      return i18n.t("errors.unauthorized")
    case "FORBIDDEN":
      return i18n.t("errors.forbidden")
    case "NOT_FOUND":
      return i18n.t("errors.notFound")
    case "VALIDATION_FAILED":
      return i18n.t("errors.validation")
    default:
      return error.message || i18n.t("errors.unknown")
  }
}
