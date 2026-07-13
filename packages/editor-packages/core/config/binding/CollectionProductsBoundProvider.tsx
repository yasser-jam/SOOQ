"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BOUND_QUERY_POLICY,
  boundQueryKeys,
  getEditorDataAdapter,
  pickSampleCollectionProduct,
  useSampleDataInEditor,
  type CollectionProductRef,
} from "../data-adapter";
import { mapCollectionProductToBoundData } from "./map-collection-product-to-bound-data";

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
  collectionSlug: string;
  /** Edit canvas renders instant sample data — no network (C2-5). */
  isEditing?: boolean;
  children: React.ReactNode;
}) {
  const adapter = getEditorDataAdapter();
  const sampleMode = isEditing && useSampleDataInEditor();
  const apiUrl = adapter.getCollectionProductsApiUrl(collectionSlug);

  const { data: fetched = [], isLoading } = useQuery({
    queryKey: boundQueryKeys.collectionProducts(apiUrl),
    queryFn: () => adapter.fetchCollectionProducts(apiUrl),
    enabled: !sampleMode,
    ...BOUND_QUERY_POLICY,
  });

  const products = sampleMode ? adapter.getSampleCollectionProducts() : fetched;

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
