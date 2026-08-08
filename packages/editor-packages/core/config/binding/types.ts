import type { ProductResourceMetadata } from "../data-adapter/types";

export type ValueContextFormat = "money" | "date" | "datetime" | "number";

/** Path-based binding for a block field value. */
export type ValueContext = {
  /** Dot/bracket path into the bound resource, e.g. `product.title`, `images[0].url` */
  path: string;
  /** When true (default), use the static prop when the path resolves empty. */
  fallbackToStatic?: boolean;
  format?: ValueContextFormat;
  /** Path to the ISO currency code for `format:"money"`, e.g. `order.currencyCode`. */
  currencyPath?: string;
};

export type BoundDataContextValue = {
  data: Record<string, unknown> | null;
  isLoading: boolean;
  isError: boolean;
  metadata: ProductResourceMetadata | null;
  language: "ar" | "en";
  selectedVariantId: string | null;
  setSelectedVariantId: (id: string | null) => void;
};
