import { DEFAULT_CUSTOMERS_PAGE_SIZE } from "./model"
import type {
  AdminCustomerSearchRequest,
  CustomerSearchFormValues,
} from "./types"

export const DEFAULT_CUSTOMER_SORT = "createdAt,desc"

export const defaultCustomerSearchValues: CustomerSearchFormValues = {
  q: undefined,
  minSpend: undefined,
  maxSpend: undefined,
  hasOrders: undefined,
  optedInEmail: undefined,
  optedInSms: undefined,
  sort: DEFAULT_CUSTOMER_SORT,
  page: 0,
  size: DEFAULT_CUSTOMERS_PAGE_SIZE,
}

/**
 * Strip empty/null/undefined values so the API call doesn't send
 * `?q=&minSpend=` (the backend would parse the empty string and 400).
 */
export const toCustomerSearchRequest = (
  values: Partial<CustomerSearchFormValues>
): AdminCustomerSearchRequest => {
  const out: AdminCustomerSearchRequest = {}
  if (values.q && values.q.trim()) out.q = values.q.trim()
  if (values.minSpend !== undefined) out.minSpend = values.minSpend
  if (values.maxSpend !== undefined) out.maxSpend = values.maxSpend
  if (values.hasOrders !== undefined) out.hasOrders = values.hasOrders
  if (values.optedInEmail !== undefined) out.optedInEmail = values.optedInEmail
  if (values.optedInSms !== undefined) out.optedInSms = values.optedInSms
  if (values.sort) out.sort = values.sort
  if (values.page !== undefined) out.page = values.page
  if (values.size !== undefined) out.size = values.size
  return out
}
