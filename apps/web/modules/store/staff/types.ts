import type * as z from "zod"

import type { createStaffSchema } from "./schema"

export type StaffCreateRequestDto = z.infer<typeof createStaffSchema>

export type StaffResponseDto = {
  staffId: string
  userId: string
  fullName: string
  phone: string
  isActive: boolean
  lastLoginAt?: string | null
  createdAt: string
  updatedAt: string
}

export type StaffListParams = {
  page?: number
  size?: number
  sort?: string
}

export type StaffListResult = {
  items: StaffResponseDto[]
  meta: {
    page: number
    size: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}
