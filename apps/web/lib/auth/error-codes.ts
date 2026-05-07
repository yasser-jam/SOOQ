export type AuthErrorAction =
  | "refresh-and-retry"
  | "show-resend"
  | "show-cooldown"
  | "logout"
  | "show-field-error"
  | "show-toast"
  | "hide-feature"

export type MappedAuthError = {
  errorCode?: string
  toastMessage: string
  fieldKey?: string
  action: AuthErrorAction
  retryAfterSeconds?: number
}

type RawError = {
  errorCode?: string
  message?: string
  fieldErrors?: Array<{ field?: string; message?: string }>
  retryAfterSeconds?: number
} | null | undefined

const fallbackMessage = (raw: RawError, fallback = "حدث خطأ ما"): string =>
  raw?.message?.trim() || fallback

export const mapAuthError = (raw: RawError): MappedAuthError => {
  const code = raw?.errorCode
  const firstFieldError = raw?.fieldErrors?.[0]

  switch (code) {
    case "ERR_1001":
      return {
        errorCode: code,
        toastMessage: fallbackMessage(raw, "البيانات غير صحيحة"),
        fieldKey: firstFieldError?.field,
        action: firstFieldError ? "show-field-error" : "show-toast",
      }
    case "ERR_1003":
      return {
        errorCode: code,
        toastMessage: fallbackMessage(raw, "هذه القيمة مستخدمة مسبقاً"),
        fieldKey: firstFieldError?.field ?? "slug",
        action: "show-field-error",
      }
    case "ERR_2002":
      return {
        errorCode: code,
        toastMessage: fallbackMessage(raw, "انتهت صلاحية الجلسة"),
        action: "refresh-and-retry",
      }
    case "ERR_2003":
      return {
        errorCode: code,
        toastMessage: fallbackMessage(raw, "ليست لديك الصلاحية لهذا الإجراء"),
        action: "hide-feature",
      }
    case "ERR_2005":
      return {
        errorCode: code,
        toastMessage: fallbackMessage(raw, "رمز التحقق غير صحيح"),
        fieldKey: "otpCode",
        action: "show-field-error",
      }
    case "ERR_2006":
      return {
        errorCode: code,
        toastMessage: fallbackMessage(raw, "انتهت صلاحية الرمز، يمكنك طلب رمز جديد"),
        action: "show-resend",
      }
    case "ERR_2007":
      return {
        errorCode: code,
        toastMessage: fallbackMessage(raw, "حاول مرة أخرى بعد قليل"),
        action: "show-cooldown",
        retryAfterSeconds: raw?.retryAfterSeconds ?? 60,
      }
    case "ERR_3000":
      return {
        errorCode: code,
        toastMessage: fallbackMessage(raw, "تعذّر إكمال العملية"),
        action: "show-toast",
      }
    default:
      return {
        errorCode: code,
        toastMessage: fallbackMessage(raw),
        action: "show-toast",
      }
  }
}
