import type { ProductCardData, ProductPickerRef } from "@/modules/product/product/data-store";

export type { ProductCardData, ProductPickerRef };

export type Variant = ProductCardData["variants"][number];

export type ProductCardLayout = "vertical" | "horizontal" | "compact" | "featured";

export type ProductCardDisplayProps = {
  product: ProductPickerRef | null;
  variant: ProductCardLayout;
  radius: string;
  showTags: boolean;
  showVariants: boolean;
  showDescription: boolean;
  showCategories: boolean;
  showActionButtons: boolean;
  actionButtonsFirst: boolean;
  showAddToCart: boolean;
  showViewDetails: boolean;
  showFavoriteButton: boolean;
  actionButtonVariantMode: "variant" | "fixed";
  actionButtonVariant: "primary" | "secondary" | "error";
  actionButtonVariantSize: "sm" | "md" | "lg";
  actionRadius: string;
  actionBgColor: string;
  actionTextColor: string;
  titleColor: string;
  descriptionColor: string;
  language: "ar" | "en";
};
