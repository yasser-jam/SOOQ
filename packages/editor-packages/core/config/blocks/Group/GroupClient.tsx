"use client";

import React, { CSSProperties, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Slot } from "@/core/types";
import {
  BOUND_QUERY_POLICY,
  boundQueryKeys,
  getEditorDataAdapter,
  useSampleDataInEditor,
  type ProductPickerRef,
  type ProductResourceMetadata,
} from "../../data-adapter";
import { BoundDataProvider, useBoundData } from "../../binding";
import { useResolvedPublicProduct } from "../../binding/use-public-products";
import { applyVariantPricing } from "../../binding/apply-variant-pricing";
import { getBoundProductId } from "../../binding/map-collection-product-to-bound-data";
import {
  useCollectionProductBoundData,
  useCollectionProductsBoundLoading,
} from "../../binding/CollectionProductsBoundProvider";
import {
  createDemoCartLine,
  mapCartLineToBoundData,
} from "../../cart/map-cart-line-to-bound-data";
import { useStoreCart } from "../../cart/use-store-cart";
import { useActiveLanguage } from "../../locale/LanguageContext";
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
  skipProductDetailFetch?: boolean;
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
  skipProductDetailFetch = false,
  isEditing = false,
}: GroupClientProps) {
  const { language: activeLanguage } = useActiveLanguage();
  const parentBound = useBoundData();
  const { cart } = useStoreCart();
  const adapter = getEditorDataAdapter();
  const sampleMode = isEditing && useSampleDataInEditor();
  const productId = product?.id;

  // Cards inside a listing repeater are fed by their provider, cart lines read
  // the cart, and the edit canvas uses sample payloads — none of them resolve
  // a product URL.
  const wantsOwnProduct =
    Boolean(productId) && !cartLineId && !skipProductDetailFetch && !sampleMode;

  // Public detail endpoint only. Refs saved without a slug are resolved
  // through the public listing rather than the admin card endpoint.
  const { apiUrl: resolvedApiUrl, isResolving } = useResolvedPublicProduct(
    product,
    { isEditing, enabled: wantsOwnProduct && !metadata?.apiUrl }
  );
  const productApiUrl = metadata?.apiUrl ?? resolvedApiUrl;

  const parentBoundProductId = getBoundProductId(
    parentBound.data as Record<string, unknown> | null
  );
  const hasParentProductData = Boolean(
    parentBound.data && productId && parentBoundProductId === productId
  );
  const collectionBoundData = useCollectionProductBoundData(
    skipProductDetailFetch ? productId : null
  );
  const collectionLoading = useCollectionProductsBoundLoading();

  const prefetchedBoundData = hasParentProductData
    ? (parentBound.data as Record<string, unknown>)
    : collectionBoundData;

  // Edit canvas never hits the product API — sample data renders instantly
  // (C2-5); preview and the published storefront fetch live.
  const shouldFetchProductDetail = wantsOwnProduct && Boolean(productApiUrl);

  // Own a local variant selection only when this Group binds its own product
  // (or cart line). Layout Groups with `product: null` must inherit from the
  // parent BoundDataProvider (e.g. UrlBoundProductProvider) so variant chips,
  // price, and add-to-cart share one selection — and so pricing clones at
  // nested Groups don't fight each other.
  const ownsVariantState = Boolean(cartLineId || product?.id);

  const [localSelectedVariantId, setLocalSelectedVariantId] = React.useState<
    string | null
  >(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: boundQueryKeys.productDetail(productId ?? "", productApiUrl ?? ""),
    queryFn: () => adapter.fetchProductDetailPayload(productApiUrl!),
    enabled: shouldFetchProductDetail,
    ...BOUND_QUERY_POLICY,
  });

  React.useEffect(() => {
    if (ownsVariantState) {
      setLocalSelectedVariantId(null);
    }
  }, [productId, cartLineId, ownsVariantState]);

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

    if (prefetchedBoundData) return prefetchedBoundData;
    // Edit canvas: sample payload keeps the picked product's identity but
    // fills pricing/images without a network call (C2-5).
    if (sampleMode && product?.id) {
      return adapter.getSampleProductPayload(product);
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
  }, [
    cartLine,
    cartLineId,
    data,
    isEditing,
    sampleMode,
    adapter,
    parentBound.data,
    prefetchedBoundData,
    product,
  ]);

  if (cartLineId && !boundData) {
    return null;
  }

  const setSelectedVariantId = ownsVariantState
    ? setLocalSelectedVariantId
    : parentBound.setSelectedVariantId;

  const effectiveVariantId =
    cartLine?.selectedVariant?.variantId ??
    (ownsVariantState
      ? localSelectedVariantId
      : parentBound.selectedVariantId);

  const effectiveBoundData = React.useMemo(() => {
    if (!boundData || cartLineId) return boundData;
    // Parent provider (URL / owning Group) already applied variant pricing —
    // re-cloning here would change `data` identity on every nested Group and
    // make variant UI flicker/reset.
    if (!ownsVariantState) return boundData;
    return applyVariantPricing(
      boundData as Record<string, unknown>,
      effectiveVariantId
    );
  }, [boundData, cartLineId, effectiveVariantId, ownsVariantState]);

  const boundProviderValue = {
    data: effectiveBoundData,
    isLoading: cartLineId
      ? false
      : skipProductDetailFetch
        ? collectionLoading && !prefetchedBoundData
        : isLoading || (wantsOwnProduct && isResolving),
    isError: cartLineId ? false : skipProductDetailFetch ? false : isError,
    metadata: cartLine?.metadata ?? metadata ?? parentBound.metadata ?? null,
    // Follow the live language toggle — Group/cart `language` props are frozen
    // at authoring time (usually "ar") and must not override the storefront UI.
    language: activeLanguage || language || "ar",
    selectedVariantId: effectiveVariantId,
    setSelectedVariantId,
  };

  const showLoading =
    skipProductDetailFetch
      ? collectionLoading && !prefetchedBoundData
      : (wantsOwnProduct && isResolving) ||
        (shouldFetchProductDetail && isLoading);
  const showError = shouldFetchProductDetail && isError;

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
