"use client";
/* eslint-disable @next/next/no-img-element */
import React, { CSSProperties, MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { getClassNameFactory } from "@/core/lib";
import {
  fetchProductForCardFromUrl,
  getProductCardApiUrl,
  productPickerKeys,
} from "@/modules/product/product/data-store";
import { resolveColor } from "../../content/color-fields";
import { resolveRadius } from "../../content/typography-fields";
import { buttonSizeVars, ButtonSizeStep } from "../../theme";
import { ImageCarousel } from "./ImageCarousel";
import { useProductVariants } from "./useProductVariants";
import type { ProductCardDisplayProps } from "./types";
import type { ProductCardData, ProductResourceMetadata } from "./types";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("ProductCard", styles);

type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "unknown";

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
  stockStatus: StockStatus;
  language: ProductCardDisplayProps["language"];
  metadata?: ProductResourceMetadata | null;
};

function dispatchProductCardEvent(
  eventName: "add-product" | "add-product-to-favourite",
  detail: ProductCardActionEventDetail
) {
  window.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true }));
}

const SHOW_HIDE_OPTIONS = [
  { label: "إظهار", value: true },
  { label: "إخفاء", value: false },
] as const;

export { SHOW_HIDE_OPTIONS };

function formatPrice(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("ar-SY", {
      style: "currency",
      currency: currencyCode || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("en-US")} ${currencyCode}`;
  }
}

function getVariantColors(variant: "primary" | "secondary" | "error") {
  return {
    bg: `var(--theme-button-variant-${variant}-bg)`,
    fg: `var(--theme-button-variant-${variant}-fg)`,
    radius: `var(--theme-button-variant-${variant}-radius)`,
  };
}

function resolveActionButtonStyle(
  mode: ProductCardDisplayProps["actionButtonVariantMode"],
  variant: ProductCardDisplayProps["actionButtonVariant"],
  variantSize: ProductCardDisplayProps["actionButtonVariantSize"],
  radiusVal: string,
  bgColor: string,
  textColor: string
): CSSProperties {
  if (mode === "variant") {
    const colors = getVariantColors(variant);
    const size = buttonSizeVars(variantSize as ButtonSizeStep);
    return {
      background: colors.bg,
      color: colors.fg,
      borderRadius: colors.radius,
      minHeight: size.height,
      paddingLeft: size.paddingLeft,
      paddingRight: size.paddingRight,
      paddingTop: size.paddingTop,
      paddingBottom: size.paddingBottom,
      fontSize: size.fontSize,
    };
  }

  const size = buttonSizeVars("md");
  return {
    background: resolveColor(bgColor || "theme-primary"),
    color: resolveColor(textColor || "theme-surface"),
    borderRadius: resolveRadius(radiusVal || "theme-md"),
    minHeight: size.height,
    paddingLeft: size.paddingLeft,
    paddingRight: size.paddingRight,
    paddingTop: size.paddingTop,
    paddingBottom: size.paddingBottom,
    fontSize: size.fontSize,
  };
}

function resolveStockStatus(
  product: ProductCardData,
  selectedVariant: ProductCardData["variants"][number] | null
): StockStatus {
  if (!selectedVariant) return "unknown";

  const qty = selectedVariant.stockQty;
  if (qty === null || qty === undefined) {
    return product.allowOversell ? "in_stock" : "unknown";
  }
  if (qty <= 0) return product.allowOversell ? "in_stock" : "out_of_stock";
  if (
    selectedVariant.lowStockThreshold != null &&
    qty <= selectedVariant.lowStockThreshold
  ) {
    return "low_stock";
  }
  return "in_stock";
}

const STOCK_LABELS: Record<StockStatus, string> = {
  in_stock: "متوفر",
  low_stock: "مخزون منخفض",
  out_of_stock: "غير متوفر",
  unknown: "متوفر",
};

function resolveDisplayPrice(
  product: ProductCardData,
  selectedVariant: ProductCardData["variants"][number] | null
) {
  const price = selectedVariant?.price ?? product.basePrice;
  const compareAt =
    selectedVariant?.compareAtPrice ?? product.compareAtPrice ?? null;
  const hasDiscount =
    compareAt != null && compareAt > 0 && compareAt > (price ?? 0);
  const discountPercent = hasDiscount
    ? Math.round(((compareAt - (price ?? 0)) / compareAt) * 100)
    : 0;

  return {
    price: price ?? 0,
    compareAt: hasDiscount ? compareAt : null,
    discountPercent,
    hasDiscount,
  };
}

type ProductCardViewProps = ProductCardDisplayProps & {
  isEditing?: boolean;
  /** When provided, skips API fetch (used by ProductsGrid mock adapter). */
  productData?: ProductCardData | null;
};

export function ProductCardView({
  product,
  variant,
  radius,
  showTags,
  showVariants,
  showDescription,
  showCategories,
  showActionButtons,
  actionButtonsFirst,
  showAddToCart,
  showViewDetails,
  showFavoriteButton,
  actionButtonVariantMode,
  actionButtonVariant,
  actionButtonVariantSize,
  actionRadius,
  actionBgColor,
  actionTextColor,
  titleColor,
  descriptionColor,
  language,
  isEditing = false,
  productData,
  metadata,
}: ProductCardViewProps) {
  const productId = product?.id;
  const productApiUrl =
    metadata?.apiUrl ?? (productId ? getProductCardApiUrl(productId) : null);

  const { data: fetchedProduct, isLoading, isError } = useQuery({
    queryKey: productPickerKeys.detail(productId ?? "", productApiUrl ?? ""),
    queryFn: () => fetchProductForCardFromUrl(productApiUrl!),
    enabled: Boolean(productApiUrl) && !productData,
    staleTime: 60_000,
  });

  const resolvedProduct = productData ?? fetchedProduct ?? null;

  const {
    selectedVariant,
    selectedAttributes,
    attributeGroups,
    selectAttribute,
    isCombinationAvailable,
  } = useProductVariants(resolvedProduct?.variants);

  if (!product?.id) {
    return (
      <div className={getClassName("empty")}>
        لم يتم اختيار منتج — اختر منتجاً من لوحة الحقول.
      </div>
    );
  }

  if (!productData && isLoading) {
    return <div className={getClassName("empty")}>جاري تحميل المنتج…</div>;
  }

  if (!productData && isError) {
    return <div className={getClassName("empty")}>تعذّر تحميل المنتج.</div>;
  }

  if (!resolvedProduct) {
    return <div className={getClassName("empty")}>المنتج غير متوفر.</div>;
  }

  const title =
    language === "en"
      ? resolvedProduct.titleEn || resolvedProduct.titleAr
      : resolvedProduct.titleAr || resolvedProduct.titleEn;
  const secondaryTitle =
    language === "en" ? resolvedProduct.titleAr : resolvedProduct.titleEn;
  const description =
    language === "en"
      ? resolvedProduct.descriptionEn || resolvedProduct.descriptionAr
      : resolvedProduct.descriptionAr || resolvedProduct.descriptionEn;

  const pricing = resolveDisplayPrice(resolvedProduct, selectedVariant);
  const stockStatus = resolveStockStatus(resolvedProduct, selectedVariant);

  const cssVars: CSSProperties = {
    "--pc-radius": resolveRadius(radius || "theme-md"),
    "--pc-title-color": resolveColor(titleColor || "theme-text"),
    "--pc-desc-color": resolveColor(descriptionColor || "theme-neutral"),
  } as CSSProperties;

  const actionStyle = resolveActionButtonStyle(
    actionButtonVariantMode,
    actionButtonVariant,
    actionButtonVariantSize,
    actionRadius,
    actionBgColor,
    actionTextColor
  );

  const buildActionEventDetail = (): ProductCardActionEventDetail => ({
    product: resolvedProduct,
    selectedVariant,
    selectedAttributes,
    pricing,
    stockStatus,
    language,
    metadata: metadata ?? null,
  });

  const onAddToCartClick = (event: MouseEvent) => {
    event.preventDefault();
    if (isEditing) return;
    dispatchProductCardEvent("add-product", buildActionEventDetail());
  };

  const onAddToFavouriteClick = (event: MouseEvent) => {
    event.preventDefault();
    if (isEditing) return;
    dispatchProductCardEvent("add-product-to-favourite", buildActionEventDetail());
  };

  const onViewDetailsClick = (event: MouseEvent) => {
    event.preventDefault();
    if (isEditing) return;
    window.alert("عرض التفاصيل");
  };

  const actionButtons =
    showActionButtons && (showAddToCart || showViewDetails) ? (
      <div className={getClassName("actions")}>
        {showAddToCart ? (
          <button
            type="button"
            data-action-key={PRODUCT_CARD_ACTION_KEYS.addToCart}
            className={getClassName("actionBtn")}
            style={actionStyle}
            onClick={onAddToCartClick}
          >
            إضافة إلى السلة
          </button>
        ) : null}
        {showViewDetails ? (
          <button
            type="button"
            className={getClassName("actionBtn")}
            style={actionStyle}
            onClick={onViewDetailsClick}
          >
            عرض التفاصيل
          </button>
        ) : null}
      </div>
    ) : null;

  const variantSelectors =
    showVariants && attributeGroups.length > 0 ? (
      <div className={getClassName("variantGroups")}>
        {attributeGroups.map((group) => (
          <div key={group.name} className={getClassName("variantGroup")}>
            <span className={getClassName("variantLabel")}>{group.name}</span>
            <div className={getClassName("variantOptions")}>
              {group.values.map((value) => {
                const selected = selectedAttributes[group.name] === value;
                return (
                  <button
                    key={value}
                    type="button"
                    className={`${getClassName("variantOption")}${
                      selected ? ` ${getClassName("variantOption--selected")}` : ""
                    }`}
                    onClick={() => selectAttribute(group.name, value)}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {!isCombinationAvailable ? (
          <p className={getClassName("variantUnavailable")}>التركيبة غير متوفرة</p>
        ) : null}
      </div>
    ) : null;

  const bodyContent = (
    <>
      {showCategories && resolvedProduct.categories.length > 0 ? (
        <div className={getClassName("categories")}>
          {resolvedProduct.categories.map((category) => (
            <span key={category.id} className={getClassName("category")}>
              {category.name ?? category.id}
            </span>
          ))}
        </div>
      ) : null}

      {showTags && resolvedProduct.tags.length > 0 ? (
        <div className={getClassName("tags")}>
          {resolvedProduct.tags.map((tag) => (
            <span key={tag.id} className={getClassName("tag")}>
              {tag.name ?? tag.id}
            </span>
          ))}
        </div>
      ) : null}

      <h3 className={getClassName("title")}>
        {title}
        {secondaryTitle && secondaryTitle !== title ? (
          <span className={getClassName("titleSecondary")}>{secondaryTitle}</span>
        ) : null}
      </h3>

      {showDescription && description ? (
        <p className={getClassName("description")}>{description}</p>
      ) : null}

      {actionButtonsFirst ? actionButtons : null}
      {variantSelectors}

      <div className={getClassName("priceRow")}>
        <span className={getClassName("price")}>
          {formatPrice(pricing.price, resolvedProduct.currencyCode)}
        </span>
        {pricing.hasDiscount && pricing.compareAt != null ? (
          <>
            <span className={getClassName("originalPrice")}>
              {formatPrice(pricing.compareAt, resolvedProduct.currencyCode)}
            </span>
            <span className={getClassName("discountLabel")}>
              −{pricing.discountPercent}%
            </span>
          </>
        ) : null}
      </div>

      <span
        className={`${getClassName("badge")} ${getClassName(
          stockStatus === "out_of_stock"
            ? "badge--outOfStock"
            : stockStatus === "low_stock"
              ? "badge--lowStock"
              : "badge--inStock"
        )}`}
      >
        {STOCK_LABELS[stockStatus]}
      </span>

      {!actionButtonsFirst ? actionButtons : null}
    </>
  );

  const useBackgroundImage = variant === "featured";

  return (
    <div
      className={[
        getClassName({ [`layout-${variant}`]: true }),
      ]
        .filter(Boolean)
        .join(" ")}
      style={cssVars}
    >
      <div className={getClassName("inner")}>
        <div className={getClassName("imageWrapper")}>
          <ImageCarousel
            urls={resolvedProduct.mediaUrls}
            alt={title}
            asBackground={useBackgroundImage}
          />

          <div className={getClassName("badges")}>
            {pricing.hasDiscount ? (
              <span
                className={`${getClassName("badge")} ${getClassName("badge--discount")}`}
              >
                −{pricing.discountPercent}%
              </span>
            ) : null}
          </div>

          {showFavoriteButton ? (
            <button
              type="button"
              data-action-key={PRODUCT_CARD_ACTION_KEYS.addToFavourite}
              className={getClassName("favoriteBtn")}
              aria-label="إضافة إلى المفضلة"
              onClick={onAddToFavouriteClick}
            >
              <Heart size={18} />
            </button>
          ) : null}
        </div>

        <div className={getClassName("body")}>{bodyContent}</div>
      </div>
    </div>
  );
}

export function mockProductToCardData(product: {
  id: string;
  title: string;
  description: string;
  price: number;
  inStock: boolean;
  categories: string[];
  image: string;
  discount?: number;
}): ProductCardData {
  const compareAt =
    typeof product.discount === "number" && product.discount > 0
      ? product.price
      : product.price;
  const basePrice =
    typeof product.discount === "number" && product.discount > 0
      ? product.price * (1 - product.discount / 100)
      : product.price;

  return {
    id: product.id,
    titleAr: product.title,
    titleEn: product.title,
    descriptionAr: product.description,
    descriptionEn: product.description,
    slug: product.id,
    basePrice,
    compareAtPrice: compareAt,
    currencyCode: "USD",
    status: "ACTIVE",
    allowOversell: false,
    categories: product.categories.map((name) => ({ id: name, name })),
    tags: [],
    mediaUrls: product.image ? [product.image] : [],
    options: [],
    variants: product.inStock
      ? [
          {
            attributes: {},
            price: basePrice,
            compareAtPrice: compareAt,
            stockQty: 10,
            isActive: true,
          },
        ]
      : [
          {
            attributes: {},
            price: basePrice,
            compareAtPrice: compareAt,
            stockQty: 0,
            isActive: true,
          },
        ],
  };
}
