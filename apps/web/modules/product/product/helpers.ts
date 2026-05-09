import { ProductOption } from "./types";

export const normalizeOptionSortOrder = (options: ProductOption[]) =>
  options.map((option, optionIndex) => ({
    ...option,
    sortOrder: optionIndex,
    values: option.values.map((value, valueIndex) => ({
      ...value,
      sortOrder: valueIndex,
    })),
  }))
