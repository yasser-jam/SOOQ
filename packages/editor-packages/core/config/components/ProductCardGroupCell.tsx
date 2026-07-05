"use client";

import React, { useMemo } from "react";
import conf from "../index";
import { SlotRenderPure } from "@/core/components/SlotRender/server";
import { assignComponentIds } from "@/core/lib/assign-component-ids";
import { createProductCardBlock } from "../presets/products-grid";
import {
  buildPublicProductResourceMetadata,
  buildProductResourceMetadata,
} from "@/modules/product/product/data-store";
import type { CollectionProductRef } from "@/modules/product/collection/data-store";
import { BoundDataProvider } from "../binding";
import { mapCollectionProductToBoundData } from "../binding/map-collection-product-to-bound-data";

type ProductCardGroupCellProps = {
  product: CollectionProductRef;
  isEditing?: boolean;
};

export function ProductCardGroupCell({
  product,
  isEditing = false,
}: ProductCardGroupCellProps) {
  const boundData = useMemo(
    () => mapCollectionProductToBoundData(product),
    [product]
  );

  const metadata = useMemo(
    () =>
      product.slug
        ? buildPublicProductResourceMetadata(product.slug, product.id)
        : buildProductResourceMetadata(product.id),
    [product.id, product.slug]
  );

  const content = useMemo(() => {
    const card = createProductCardBlock({
      product: {
        id: product.id,
        titleAr: product.titleAr,
        titleEn: product.titleEn,
        slug: product.slug,
      },
      metadata,
      skipProductDetailFetch: true,
    });

    return [assignComponentIds(card, `product-card-${product.id}`)];
  }, [metadata, product.id, product.slug, product.titleAr, product.titleEn]);

  return (
    <BoundDataProvider
      value={{
        data: boundData,
        isLoading: false,
        isError: false,
        metadata,
        language: "ar",
        selectedVariantId: null,
        setSelectedVariantId: () => {},
      }}
    >
      <SlotRenderPure
        content={content}
        zone={`product-card-${product.id}`}
        config={conf}
        metadata={{
          puck: {
            dragRef: null,
            isEditing,
          },
        }}
      />
    </BoundDataProvider>
  );
}
