import type { ProductStatus } from "@/modules/product/product/types"

import type { InventoryVariantStatus } from "./types"

export const formatInventoryQuantity = (
  value?: number | null,
  options: {
    signed?: boolean
  } = {}
) => {
  if (typeof value !== "number") return "—"

  const formatted = Math.abs(value).toLocaleString("en-US")

  if (options.signed) {
    if (value > 0) return `+${formatted}`
    if (value < 0) return `-${formatted}`
  }

  return value < 0 ? `-${formatted}` : formatted
}

export const formatInventoryDateTime = (value?: string | null) => {
  if (!value) return ""

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) return value

  return parsedDate.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export const formatInventoryMoney = (
  amount?: number | null,
  currencyCode?: string | null
) => {
  if (typeof amount !== "number") return "—"
  if (!currencyCode) return String(amount)

  try {
    return new Intl.NumberFormat("ar-SY", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${amount.toLocaleString("en-US")} ${currencyCode}`
  }
}

export const getProductStatusLabel = (status?: ProductStatus) => {
  if (status === "ACTIVE") return "نشط"
  if (status === "ARCHIVED") return "مؤرشف"
  return "مسودة"
}

export const getInventoryHealthMeta = (
  variant?: InventoryVariantStatus | null
) => {
  if (!variant) {
    return {
      label: "غير محدد",
      description: "لم يتم تحديد حالة المخزون بعد.",
      badgeVariant: "outline" as const,
    }
  }

  if (variant.stockQty <= 0 && variant.allowOversell) {
    return {
      label: "نفد المخزون مع البيع المسموح",
      description: "الرصيد صفر لكن البيع ما زال متاحاً.",
      badgeVariant: "primary" as const,
    }
  }

  if (variant.stockQty <= 0) {
    return {
      label: "نفد المخزون",
      description: "لا يوجد رصيد متاح حالياً لهذا المتغير.",
      badgeVariant: "destructive" as const,
    }
  }

  if (variant.isLowStock) {
    return {
      label: "مخزون منخفض",
      description: "الرصيد اقترب من حد التنبيه المحدد.",
      badgeVariant: "outline" as const,
    }
  }

  return {
    label: "متوفر",
    description: "الرصيد ضمن مستوى مريح.",
    badgeVariant: "secondary-tonal" as const,
  }
}

export const getInventoryMovementReasonLabel = (reasonCode?: string | null) => {
  if (reasonCode === "MANUAL_ADJUSTMENT") return "تعديل يدوي"
  return reasonCode ?? "غير محدد"
}

export const getInventoryReferenceLabel = (referenceType?: string | null) => {
  if (referenceType === "MANUAL") return "يدوي"
  return referenceType ?? "بدون مرجع"
}
