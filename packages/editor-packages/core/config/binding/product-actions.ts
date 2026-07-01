import type {
  ProductCardData,
  ProductResourceMetadata,
} from "@/modules/product/product/data-store";

export const PRODUCT_CARD_ACTION_KEYS = {
  addToCart: "add-product",
  addToFavourite: "add-product-to-favourite",
} as const;

export type ProductCardActionEventDetail = {
  product: ProductCardData;
  selectedVariant: ProductCardData["variants"][number] | null;
  selectedAttributes: Record<string, string>;
  pricing: {
    price: number;
    compareAt: number | null;
    discountPercent: number;
    hasDiscount: boolean;
  };
  stockStatus: "in_stock" | "low_stock" | "out_of_stock" | "unknown";
  language: "ar" | "en";
  metadata?: ProductResourceMetadata | null;
};

export function dispatchProductCardEvent(
  eventName: "add-product" | "add-product-to-favourite",
  detail: ProductCardActionEventDetail
) {
  window.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true }));
}
