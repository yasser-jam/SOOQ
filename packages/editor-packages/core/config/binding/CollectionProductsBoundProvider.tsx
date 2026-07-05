"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  collectionPickerKeys,
  fetchCollectionProductsFromUrl,
  getCollectionProductsApiUrl,
  type CollectionProductRef,
} from "@/modules/product/collection/data-store";
import { mapCollectionProductToBoundData } from "./map-collection-product-to-bound-data";

type CollectionProductsBoundContextValue = {
  getBoundData: (productId: string) => Record<string, unknown> | null;
  isLoading: boolean;
};

const CollectionProductsBoundContext =
  createContext<CollectionProductsBoundContextValue | null>(null);

export function CollectionProductsBoundProvider({
  collectionSlug,
  children,
}: {
  collectionSlug: string;
  children: React.ReactNode;
}) {
  const apiUrl = getCollectionProductsApiUrl(collectionSlug);

  const { data: products = [], isLoading } = useQuery({
    queryKey: collectionPickerKeys.products(apiUrl),
    queryFn: () => fetchCollectionProductsFromUrl(apiUrl),
    staleTime: 60_000,
  });

  const value = useMemo(() => {
    const boundById = new Map<string, Record<string, unknown>>();

    for (const product of products) {
      boundById.set(product.id, mapCollectionProductToBoundData(product));
    }

    return {
      getBoundData: (productId: string) => boundById.get(productId) ?? null,
      isLoading,
    };
  }, [products, isLoading]);

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
