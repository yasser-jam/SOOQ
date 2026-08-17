"use client";

import React, { createContext, useContext, useMemo } from "react";
import {
  pickSampleCollectionProduct,
  type CollectionProductRef,
} from "../data-adapter";
import { mapCollectionProductToBoundData } from "./map-collection-product-to-bound-data";
import { useListingProducts } from "./use-public-products";

type CollectionProductsBoundContextValue = {
  getBoundData: (productId: string) => Record<string, unknown> | null;
  isLoading: boolean;
};

const CollectionProductsBoundContext =
  createContext<CollectionProductsBoundContextValue | null>(null);

export function CollectionProductsBoundProvider({
  collectionSlug,
  isEditing = false,
  children,
}: {
  /** Empty/null lists the whole public catalogue instead of a collection. */
  collectionSlug?: string | null;
  /** Edit canvas renders instant sample data — no network (C2-5). */
  isEditing?: boolean;
  children: React.ReactNode;
}) {
  // Same query as the listing block above it, so this shares its cache entry
  // rather than issuing a second request.
  const { products, isLoading, sampleMode } = useListingProducts({
    collectionSlug,
    isEditing,
  });

  const value = useMemo(() => {
    const boundById = new Map<string, Record<string, unknown>>();

    for (const product of products) {
      boundById.set(product.id, mapCollectionProductToBoundData(product));
    }

    const getBoundData = (productId: string) => {
      const exact = boundById.get(productId);
      if (exact) return exact;

      // Sample mode: saved cards reference REAL product ids that don't exist
      // in the sample catalog — deterministically assign each one a sample
      // product so the canvas still shows varied, realistic cards.
      if (sampleMode) {
        return mapCollectionProductToBoundData({
          ...pickSampleCollectionProduct(productId),
          id: productId,
        });
      }

      return null;
    };

    return {
      getBoundData,
      isLoading: sampleMode ? false : isLoading,
    };
  }, [products, isLoading, sampleMode]);

  return (
    <CollectionProductsBoundContext.Provider value={value}>
      {children}
    </CollectionProductsBoundContext.Provider>
  );
}

export function useCollectionProductBoundData(
  productId?: string | null
): Record<string, unknown> | null {
  const context = useContext(CollectionProductsBoundContext);
  if (!context || !productId) return null;
  return context.getBoundData(productId);
}

export function useCollectionProductsBoundLoading(): boolean {
  return useContext(CollectionProductsBoundContext)?.isLoading ?? false;
}

export type { CollectionProductRef };
