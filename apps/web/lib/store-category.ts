/** Maps onboarding UI category ids to `storeCategory` values accepted by `POST /auth/stores`. */
const CATEGORY_ID_TO_API: Record<string, string> = {
  fashion: "FASHION",
  electronics: "ELECTRONICS",
  food: "FOOD",
  beauty: "BEAUTY",
  home: "HOME",
  sports: "SPORTS",
}

export function categoryIdToStoreCategory(categoryId: string | null): string {
  if (!categoryId) return "GENERAL"
  return CATEGORY_ID_TO_API[categoryId] ?? "GENERAL"
}
