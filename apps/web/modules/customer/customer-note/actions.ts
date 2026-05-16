import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import type {
  CreateCustomerNoteInput,
  CustomerNote,
  DeleteCustomerNoteInput,
  UpdateCustomerNoteInput,
} from "./types"

export const listCustomerNotes = async (
  customerId: string
): Promise<CustomerNote[]> => {
  const response = await api<ApiResponse<CustomerNote[]>>(
    `/admin/customers/${customerId}/notes`
  )
  return response.data ?? []
}

export const createCustomerNote = async ({
  customerId,
  data,
}: CreateCustomerNoteInput): Promise<CustomerNote> => {
  const response = await api<ApiResponse<CustomerNote>>(
    `/admin/customers/${customerId}/notes`,
    {
      method: "POST",
      body: data,
    }
  )
  return response.data as CustomerNote
}

export const updateCustomerNote = async ({
  customerId,
  noteId,
  data,
}: UpdateCustomerNoteInput): Promise<CustomerNote> => {
  const response = await api<ApiResponse<CustomerNote>>(
    `/admin/customers/${customerId}/notes/${noteId}`,
    {
      method: "PUT",
      body: data,
    }
  )
  return response.data as CustomerNote
}

export const deleteCustomerNote = async ({
  customerId,
  noteId,
}: DeleteCustomerNoteInput): Promise<void> => {
  await api<ApiResponse<unknown>>(
    `/admin/customers/${customerId}/notes/${noteId}`,
    { method: "DELETE" }
  )
}
