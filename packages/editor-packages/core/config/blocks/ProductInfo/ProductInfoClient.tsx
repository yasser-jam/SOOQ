"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchProductForCardFromUrl,
  productPickerKeys,
  type ProductPickerRef,
} from "@/modules/product/product/data-store";
import { useResolvedPublicProduct } from "../../binding/use-public-products";
import { getClassNameFactory } from "@/core/lib";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("ProductInfo", styles);

function formatPrice(amount: number, currencyCode: string): string {
  return `${amount.toLocaleString("en-US")} ${currencyCode}`;
}

type ProductInfoClientProps = {
  product?: ProductPickerRef | null;
  showTitle: boolean;
  showDescription: boolean;
  showCategories: boolean;
  showPrice: boolean;
  showStockBadge: boolean;
  titleSize: "s" | "m" | "l" | "xl";
  priceSize: "s" | "m" | "l";
  align: "left" | "center" | "right";
  padding: "none" | "sm" | "md" | "lg";
};

export function ProductInfoClient(props: ProductInfoClientProps) {
  const { product, showTitle, showDescription, showCategories, showPrice, showStockBadge, titleSize, priceSize, align, padding } = props;

  // `/public/products/{slug}` — never the admin card endpoint.
  const { apiUrl, isResolving } = useResolvedPublicProduct(product);

  const { data, isLoading } = useQuery({
    queryKey: productPickerKeys.detail(product?.id ?? "", apiUrl ?? ""),
    queryFn: () => fetchProductForCardFromUrl(apiUrl!),
    enabled: Boolean(apiUrl),
    staleTime: 60_000,
  });

  if (!product?.id) {
    return <div className={getClassName("empty")}>لم يتم اختيار منتج</div>;
  }

  if (isResolving || isLoading) {
    return <div className={getClassName("empty")}>جاري التحميل…</div>;
  }

  if (!data) {
    return <div className={getClassName("empty")}>المنتج غير متوفر</div>;
  }

  const hasDiscount = data.compareAtPrice > data.basePrice;
  const inStock = (data.variants[0]?.stockQty ?? 1) > 0;

  return (
    <div
      className={getClassName({
        [`--titleSize-${titleSize}`]: true,
        [`--priceSize-${priceSize}`]: true,
        [`--align-${align}`]: true,
        [`--padding-${padding}`]: true,
      })}
    >
      {showCategories && data.categories.length > 0 ? (
        <div className={getClassName("categories")}>
          {data.categories.map((category) => (
            <span key={category.id} className={getClassName("category")}>
              {category.name ?? category.id}
            </span>
          ))}
        </div>
      ) : null}

      {showTitle ? <h3 className={getClassName("title")}>{data.titleAr || data.titleEn}</h3> : null}

      {showDescription ? (
        <p className={getClassName("description")}>{data.descriptionAr || data.descriptionEn}</p>
      ) : null}

      {showPrice ? (
        <div className={getClassName("priceRow")}>
          <span className={getClassName("price")}>
            {formatPrice(data.basePrice, data.currencyCode)}
          </span>
          {hasDiscount ? (
            <span className={getClassName("originalPrice")}>
              {formatPrice(data.compareAtPrice, data.currencyCode)}
            </span>
          ) : null}
        </div>
      ) : null}

      {showStockBadge ? (
        <span
          className={`${getClassName("stockBadge")} ${getClassName(inStock ? "stockBadge--inStock" : "stockBadge--outOfStock")}`}
        >
          {inStock ? "متوفر" : "غير متوفر"}
        </span>
      ) : null}
    </div>
  );
}
