"use client";
/* eslint-disable @next/next/no-img-element */
import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getProductForCard,
  productPickerKeys,
  type ProductPickerRef,
} from "@/modules/product/product/data-store";
import { getClassNameFactory } from "@/core/lib";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("ProductImage", styles);

type ProductImageClientProps = {
  product?: ProductPickerRef | null;
  aspectRatio: "square" | "landscape" | "portrait";
  width: "auto" | "120px" | "160px" | "200px" | "240px" | "280px" | "320px" | "400px";
  borderRadius: "none" | "sm" | "md" | "lg";
  showBadges: boolean;
};

export function ProductImageClient({
  product,
  aspectRatio,
  width,
  borderRadius,
  showBadges,
}: ProductImageClientProps) {
  const { data, isLoading } = useQuery({
    queryKey: productPickerKeys.detail(product?.id ?? ""),
    queryFn: () => getProductForCard(product!.id),
    enabled: Boolean(product?.id),
    staleTime: 60_000,
  });

  if (!product?.id) {
    return <div className={getClassName("empty")}>لم يتم اختيار منتج</div>;
  }

  if (isLoading) {
    return <div className={getClassName("empty")}>جاري التحميل…</div>;
  }

  if (!data) {
    return <div className={getClassName("empty")}>المنتج غير متوفر</div>;
  }

  const imageUrl = data.mediaUrls[0] ?? "";
  const hasDiscount = data.compareAtPrice > data.basePrice;
  const discountPercent = hasDiscount
    ? Math.round(((data.compareAtPrice - data.basePrice) / data.compareAtPrice) * 100)
    : 0;
  const inStock = (data.variants[0]?.stockQty ?? 1) > 0;

  return (
    <div
      className={getClassName({
        [`--${aspectRatio}`]: true,
        [`--radius-${borderRadius}`]: true,
      })}
      style={width !== "auto" ? { width, flexShrink: 0 } : undefined}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={data.titleAr || data.titleEn} />
      ) : (
        <div className={getClassName("placeholder")}>لا توجد صورة</div>
      )}

      {showBadges ? (
        <div className={getClassName("badges")}>
          {hasDiscount ? (
            <span className={`${getClassName("badge")} ${getClassName("badge--discount")}`}>
              −{discountPercent}%
            </span>
          ) : null}
          <span
            className={`${getClassName("badge")} ${getClassName(inStock ? "badge--inStock" : "badge--outOfStock")}`}
          >
            {inStock ? "متوفر" : "غير متوفر"}
          </span>
        </div>
      ) : null}
    </div>
  );
}
