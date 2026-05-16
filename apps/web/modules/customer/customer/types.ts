import z from "zod"

import type { CustomerNote } from "@/modules/customer/customer-note/types"

import { customerSearchSchema } from "./schema"

export interface CustomerAddress {
  addressId: string
  label: string | null
  recipientName: string | null
  recipientPhone: string | null
  governorate: string
  city: string | null
  streetAddress: string | null
  notes: string | null
  latitude: number | null
  longitude: number | null
  isDefault: boolean
  createdAt: string
  updatedAt: string | null
}

export interface CustomerPreferences {
  emailOptIn: boolean
  smsOptIn: boolean
  emailConsentedAt: string | null
  smsConsentedAt: string | null
}

export interface AdminCustomerSummary {
  customerId: string
  fullName: string
  phone: string
  orderCount: number
  totalSpendSyp: number
  lastOrderAt: string | null
  createdAt: string
}

export interface AdminCustomerDetail extends AdminCustomerSummary {
  addresses: CustomerAddress[]
  notes: CustomerNote[]
  preferences: CustomerPreferences
}

export type CustomerSortField =
  | "createdAt"
  | "orderCount"
  | "totalSpendSyp"
  | "lastOrderAt"
  | "fullName"

export type SortDirection = "asc" | "desc"

export type CustomerSearchFormValues = z.infer<typeof customerSearchSchema>

export interface AdminCustomerSearchRequest {
  q?: string
  minSpend?: number
  maxSpend?: number
  hasOrders?: boolean
  optedInEmail?: boolean
  optedInSms?: boolean
  page?: number
  size?: number
  sort?: string
}
