/**
 * Tanstack Query keys for the variant module.
 * Hierarchy lets us invalidate per-product or per-variant precisely.
 */
export const variantQueryKeys = {
  all: ["variants"] as const,
  matrix: (productId: string) =>
    [...variantQueryKeys.all, "matrix", productId] as const,
  variant: (productId: string, variantId: string) =>
    [...variantQueryKeys.all, "single", productId, variantId] as const,
}
