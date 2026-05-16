import type {
  CreateCustomerNotePayload,
  UpdateCustomerNotePayload,
} from "./types"

export const defaultCreateNoteValues: CreateCustomerNotePayload = {
  noteText: "",
  isPrivate: false,
}

export const initUpdateNoteValues = (
  text: string,
  isPrivate: boolean
): UpdateCustomerNotePayload => ({
  noteText: text,
  isPrivate,
})
