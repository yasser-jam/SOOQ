import { CreateProductTagInput, UpdateProductTagInput } from "./types"

export const initTag = (
  id: string,
  data: CreateProductTagInput
): UpdateProductTagInput => ({
  id,
  data,
})
