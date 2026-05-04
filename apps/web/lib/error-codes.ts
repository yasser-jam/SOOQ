import type { FieldError } from "./types"

export const ERROR_CODE_MESSAGES: Record<string, string> = {
  ERR_1003: "ترويسة المستأجر مفقودة (X-Tenant-Id).",
  ERR_2000: "فشل التحقق من الجلسة. يرجى تسجيل الدخول من جديد.",
  ERR_2001: "بيانات غير صالحة. يرجى مراجعة الحقول والمحاولة مرة أخرى.",
  ERR_3001: "لا يمكن تنفيذ هذا التحويل على حالة الطلب الحالية.",
  ERR_8000: "لا يمكن تنفيذ هذا التحويل على حالة الشحنة الحالية.",
  ERR_8001: "لا يوجد مزود شحن متاح لهذه الإحداثيات.",
  ERR_8003: "تم إنشاء شحنة لهذا الطلب مسبقاً.",
  ERR_8004: "مبلغ الدفع عند الاستلام غير متطابق.",
  ERR_8005: "محتوى الـ webhook غير صالح.",
  RESOURCE_NOT_FOUND: "العنصر المطلوب غير موجود.",
}

export const humanizeError = (
  errorCode?: string | null,
  fallback?: string | null
): string => {
  if (errorCode && ERROR_CODE_MESSAGES[errorCode]) {
    return ERROR_CODE_MESSAGES[errorCode]
  }

  return fallback || "حدث خطأ ما"
}

export const formatFieldErrors = (fieldErrors?: FieldError[]): string => {
  if (!fieldErrors?.length) return ""

  return fieldErrors.map((e) => `${e.field}: ${e.message}`).join("\n")
}
