"use client";

import React, { CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { Slot } from "@/core/types";
import {
  fetchProductDetailPayloadFromUrl,
  getProductCardApiUrl,
  productPickerKeys,
  type ProductPickerRef,
  type ProductResourceMetadata,
} from "@/modules/product/product/data-store";
import { BoundDataProvider } from "../../binding";
import { getClassNameFactory } from "@/core/lib";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("Group", styles);

export type GroupClientProps = {
  direction: "row" | "column";
  gap: number;
  alignItems: "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
  justifyContent:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around"
    | "space-evenly";
  wrap: "wrap" | "nowrap";
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundOverlayColor?: string;
  padding?: string;
  borderRadius?: string;
  boxShadow?: string;
  content: Slot;
  surfaceStyle: CSSProperties;
  contentStyle: CSSProperties;
  product?: ProductPickerRef | null;
  metadata?: ProductResourceMetadata | null;
  language?: "ar" | "en";
};

export function GroupClient({
  content: Content,
  surfaceStyle,
  contentStyle,
  product,
  metadata,
  language = "ar",
}: GroupClientProps) {
  const productId = product?.id;
  const productApiUrl =
    metadata?.apiUrl ?? (productId ? getProductCardApiUrl(productId) : null);

  const [selectedVariantId, setSelectedVariantId] = React.useState<string | null>(
    null
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: productPickerKeys.detail(productId ?? "", productApiUrl ?? ""),
    queryFn: () => fetchProductDetailPayloadFromUrl(productApiUrl!),
    enabled: Boolean(productApiUrl),
    staleTime: 60_000,
  });

  React.useEffect(() => {
    setSelectedVariantId(null);
  }, [productId]);

  const boundData = React.useMemo(() => {
    if (data) return data;
    if (!product?.id) return null;

    return {
      product: {
        productId: product.id,
        titleAr: product.titleAr ?? "",
        titleEn: product.titleEn ?? "",
      },
      images: [],
    };
  }, [data, product]);

  const boundProviderValue = {
    data: boundData,
    isLoading,
    isError,
    metadata: metadata ?? null,
    language,
    selectedVariantId,
    setSelectedVariantId,
  };

  const showLoading = Boolean(productApiUrl) && isLoading;
  const showError = Boolean(productApiUrl) && isError;

  return (
    <div className={getClassName()} style={surfaceStyle}>
      {showLoading ? (
        <div className={getClassName("empty")}>جاري تحميل المنتج…</div>
      ) : null}
      {showError ? (
        <div className={getClassName("empty")}>تعذّر تحميل المنتج.</div>
      ) : null}
      <BoundDataProvider value={boundProviderValue}>
        <Content style={contentStyle} />
      </BoundDataProvider>
    </div>
  );
}
