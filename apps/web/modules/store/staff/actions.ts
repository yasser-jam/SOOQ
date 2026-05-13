import type { QueryClient } from "@tanstack/react-query"
import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { ApiResponse, PagedApiResponse } from "@/lib/types"

import type {
  StaffCreateRequestDto,
  StaffListParams,
  StaffListResult,
  StaffResponseDto,
} from "./types"

export const staffKeys = {
  all: ["store", "staff"] as const,
  list: (params: StaffListParams) =>
    ["store", "staff", "list", params] as const,
  detail: (staffId: string) => ["store", "staff", "detail", staffId] as const,
}

const STAFF_PATH = "/admin/store/staff"

export const listStaff = async (
  params: StaffListParams = {}
): Promise<StaffListResult> => {
  const { page = 0, size = 20, sort = "createdAt,desc" } = params
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  })
  const response = await api<PagedApiResponse<StaffResponseDto>>(
    `${STAFF_PATH}?${query.toString()}`
  )
  return {
    items: response.data ?? [],
    meta: response.meta ?? {
      page,
      size,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  }
}

export const listStaffQueryOptions = (params: StaffListParams = {}) =>
  queryOptions({
    queryKey: staffKeys.list(params),
    queryFn: () => listStaff(params),
    staleTime: 30_000,
  })

export const getStaff = async (staffId: string): Promise<StaffResponseDto> => {
  const response = await api<ApiResponse<StaffResponseDto>>(
    `${STAFF_PATH}/${staffId}`
  )
  if (!response.data) {
    throw new Error("Empty staff response")
  }
  return response.data
}

export const getStaffQueryOptions = (staffId: string) =>
  queryOptions({
    queryKey: staffKeys.detail(staffId),
    queryFn: () => getStaff(staffId),
    staleTime: 30_000,
    enabled: Boolean(staffId),
  })

export const createStaff = async (
  input: StaffCreateRequestDto
): Promise<StaffResponseDto> => {
  const response = await api<ApiResponse<StaffResponseDto>>(STAFF_PATH, {
    method: "POST",
    body: input,
  })
  if (!response.data) {
    throw new Error("Empty create-staff response")
  }
  return response.data
}

export const deactivateStaff = async (
  staffId: string
): Promise<StaffResponseDto> => {
  const response = await api<ApiResponse<StaffResponseDto>>(
    `${STAFF_PATH}/${staffId}/deactivate`,
    { method: "POST" }
  )
  if (!response.data) {
    throw new Error("Empty deactivate response")
  }
  return response.data
}

export const reactivateStaff = async (
  staffId: string
): Promise<StaffResponseDto> => {
  const response = await api<ApiResponse<StaffResponseDto>>(
    `${STAFF_PATH}/${staffId}/reactivate`,
    { method: "POST" }
  )
  if (!response.data) {
    throw new Error("Empty reactivate response")
  }
  return response.data
}

export const deleteStaff = async (staffId: string): Promise<void> => {
  await api<ApiResponse<unknown>>(`${STAFF_PATH}/${staffId}`, {
    method: "DELETE",
  })
}

export const getCreateStaffMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: (staff: StaffResponseDto) => void
}) => ({
  mutationFn: createStaff,
  onSuccess: (staff: StaffResponseDto) => {
    queryClient.invalidateQueries({ queryKey: staffKeys.all })
    onSuccess?.(staff)
  },
})

export const getDeactivateStaffMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: (staff: StaffResponseDto) => void
}) => ({
  mutationFn: deactivateStaff,
  onSuccess: (staff: StaffResponseDto) => {
    queryClient.setQueryData(staffKeys.detail(staff.staffId), staff)
    queryClient.invalidateQueries({ queryKey: staffKeys.all })
    onSuccess?.(staff)
  },
})

export const getReactivateStaffMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: (staff: StaffResponseDto) => void
}) => ({
  mutationFn: reactivateStaff,
  onSuccess: (staff: StaffResponseDto) => {
    queryClient.setQueryData(staffKeys.detail(staff.staffId), staff)
    queryClient.invalidateQueries({ queryKey: staffKeys.all })
    onSuccess?.(staff)
  },
})

export const getDeleteStaffMutationOptions = ({
  queryClient,
  onSuccess,
}: {
  queryClient: QueryClient
  onSuccess?: (staffId: string) => void
}) => ({
  mutationFn: deleteStaff,
  onSuccess: (_: void, staffId: string) => {
    queryClient.removeQueries({ queryKey: staffKeys.detail(staffId) })
    queryClient.invalidateQueries({ queryKey: staffKeys.all })
    onSuccess?.(staffId)
  },
})
