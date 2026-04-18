import type { CreateProductTagInput, UpdateProductTagInput } from "./actions"

export const initTag = (
  id: string,
  data: CreateProductTagInput
): UpdateProductTagInput => ({
  id,
  data,
})
