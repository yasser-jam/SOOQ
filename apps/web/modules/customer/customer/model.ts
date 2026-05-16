import type { CustomerSortField } from "./types"

export interface CustomerDetailRouteParams {
  customer_id: string
}

export interface CustomerDetailPageRouteProps {
  params: Promise<CustomerDetailRouteParams>
}

export const DEFAULT_CUSTOMERS_PAGE_SIZE = 20

export const CUSTOMER_SORT_FIELD_LABELS: Record<CustomerSortField, string> = {
  createdAt: "تاريخ التسجيل",
  orderCount: "عدد الطلبات",
  totalSpendSyp: "إجمالي الإنفاق",
  lastOrderAt: "آخر طلب",
  fullName: "الاسم",
}

export const CUSTOMER_SORTABLE_FIELDS: CustomerSortField[] = [
  "createdAt",
  "orderCount",
  "totalSpendSyp",
  "lastOrderAt",
  "fullName",
]

/**
 * Address label codes the backend accepts (see CustomerAddress.label).
 * Free-form server-side, but the UI offers these as suggestions.
 */
export const ADDRESS_LABEL_OPTIONS = ["HOME", "WORK", "OTHER"] as const

export const ADDRESS_LABEL_DISPLAY: Record<string, string> = {
  HOME: "المنزل",
  WORK: "العمل",
  OTHER: "أخرى",
}
