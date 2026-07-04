"use client";

import React, { CSSProperties, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Slot } from "@/core/types";
import {
  fetchProductDetailPayloadFromUrl,
  getProductCardApiUrl,
  productPickerKeys,
  type ProductPickerRef,
  type ProductResourceMetadata,
} from "@/modules/product/product/data-store";
import { BoundDataProvider, useBoundData } from "../../binding";
import {
  createDemoCartLine,
  mapCartLineToBoundData,
} from "../../cart/map-cart-line-to-bound-data";
import { useStoreCart } from "../../cart/use-store-cart";
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
  cartLineId?: string | null;
  isEditing?: boolean;
};

export function GroupClient({
  content: Content,
  surfaceStyle,
  contentStyle,
  product,
  metadata,
  language = "ar",
  cartLineId,
  isEditing = false,
}: GroupClientProps) {
  const parentBound = useBoundData();
  const { cart } = useStoreCart();
  const productId = product?.id;
  const productApiUrl =
    metadata?.apiUrl ?? (productId ? getProductCardApiUrl(productId) : null);

  const [selectedVariantId, setSelectedVariantId] = React.useState<string | null>(
    null
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: productPickerKeys.detail(productId ?? "", productApiUrl ?? ""),
    queryFn: () => fetchProductDetailPayloadFromUrl(productApiUrl!),
    enabled: Boolean(productApiUrl) && !cartLineId,
    staleTime: 60_000,
  });

  React.useEffect(() => {
    setSelectedVariantId(null);
  }, [productId, cartLineId]);

  const cartLine = useMemo(() => {
    if (!cartLineId) return null;
    return cart.items.find((item) => item.lineId === cartLineId) ?? null;
  }, [cart.items, cartLineId]);

  const boundData = React.useMemo(() => {
    if (cartLineId) {
      if (cartLine) return mapCartLineToBoundData(cartLine);
      if (isEditing) return mapCartLineToBoundData(createDemoCartLine());
      return null;
    }

    if (data) return data;
    if (!product?.id) return parentBound.data;

    return {
      product: {
        productId: product.id,
        titleAr: product.titleAr ?? "",
        titleEn: product.titleEn ?? "",
      },
      images: [],
    };
  }, [cartLine, cartLineId, data, isEditing, product, parentBound.data]);

  if (cartLineId && !boundData) {
    return null;
  }

  const boundProviderValue = {
    data: boundData,
    isLoading: cartLineId ? false : isLoading,
    isError: cartLineId ? false : isError,
    metadata: cartLine?.metadata ?? metadata ?? parentBound.metadata ?? null,
    language: cartLine?.language ?? language,
    selectedVariantId:
      cartLine?.selectedVariant?.variantId ?? selectedVariantId,
    setSelectedVariantId,
  };

  const showLoading = Boolean(productApiUrl) && !cartLineId && isLoading;
  const showError = Boolean(productApiUrl) && !cartLineId && isError;

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
