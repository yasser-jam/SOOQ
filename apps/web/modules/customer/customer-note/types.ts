import z from "zod"

import { createCustomerNoteSchema, updateCustomerNoteSchema } from "./schema"

export interface CustomerNote {
  noteId: string
  authorUserId: string
  noteText: string
  isPrivate: boolean
  createdAt: string
  updatedAt: string | null
}

export type CreateCustomerNotePayload = z.infer<
  typeof createCustomerNoteSchema
>

export type UpdateCustomerNotePayload = z.infer<
  typeof updateCustomerNoteSchema
>

export interface CreateCustomerNoteInput {
  customerId: string
  data: CreateCustomerNotePayload
}

export interface UpdateCustomerNoteInput {
  customerId: string
  noteId: string
  data: UpdateCustomerNotePayload
}

export interface DeleteCustomerNoteInput {
  customerId: string
  noteId: string
}
