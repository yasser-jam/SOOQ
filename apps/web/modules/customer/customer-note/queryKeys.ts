export const customerNoteQueryKeys = {
  all: ["customer-notes"] as const,
  list: (customerId: string) =>
    [...customerNoteQueryKeys.all, "list", customerId] as const,
}
