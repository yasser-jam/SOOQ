import type { AxiosError } from "axios"
import { toast } from "sonner"

import { mapAuthError } from "@/lib/auth/error-codes"

/**
 * Translates an Axios error into the shape the rest of the app handles
 * (status + mapped action + user-facing message). Also surfaces a toast for
 * actions the caller isn't expected to render inline.
 *
 * Extracted from `lib/api.ts` so `lib/public-api.ts` can reuse the same
 * error-handling without re-implementing it.
 */
export const handleApiError = (error: AxiosError<unknown>) => {
  const responseData = (error.response?.data ?? null) as
    | {
        success?: boolean
        errorCode?: string
        message?: string
        fieldErrors?: Array<{ field?: string; message?: string }>
        retryAfterSeconds?: number
      }
    | null

  const status = error.response?.status
  const mapped = mapAuthError(responseData)

  // Suppress toast for handled actions:
  // - 401 refresh-and-retry already handled silently by the interceptor
  // - field errors should be rendered inline by the caller
  // - cooldown is rendered inline
  const suppressToast =
    status === 401 ||
    mapped.action === "show-field-error" ||
    mapped.action === "show-cooldown" ||
    mapped.action === "hide-feature" ||
    mapped.action === "request-mfa"

  if (!suppressToast && typeof window !== "undefined") {
    toast.error(mapped.toastMessage)
  }

  if (error.response) {
    return {
      status: error.response.status,
      message: mapped.toastMessage,
      errorCode: mapped.errorCode,
      fieldKey: mapped.fieldKey,
      action: mapped.action,
      retryAfterSeconds: mapped.retryAfterSeconds,
      data: error.response.data,
    }
  }

  if (error.request) {
    return {
      status: 0,
      message: "لا يوجد اتصال بالخادم",
    }
  }

  return {
    status: 0,
    message: error.message,
  }
}

export type ApiErrorShape = ReturnType<typeof handleApiError>
