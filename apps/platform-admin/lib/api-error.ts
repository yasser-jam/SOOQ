import type { AxiosError } from "axios"
import { toast } from "sonner"

import { mapAuthError } from "@/lib/auth/error-codes"

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
