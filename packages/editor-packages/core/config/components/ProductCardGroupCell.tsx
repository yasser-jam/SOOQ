"use client";

import React, { useMemo } from "react";
import conf from "../index";
import { SlotRenderPure } from "@/core/components/SlotRender/server";
import { assignComponentIds } from "@/core/lib/assign-component-ids";
import { createProductCardBlock } from "../presets/products-grid";
import {
  buildProductResourceMetadata,
  type ProductPickerRef,
} from "@/modules/product/product/data-store";

type ProductCardGroupCellProps = {
  product: ProductPickerRef;
  isEditing?: boolean;
};

export function ProductCardGroupCell({
  product,
  isEditing = false,
}: ProductCardGroupCellProps) {
  const content = useMemo(() => {
    const card = createProductCardBlock({
      product: {
        id: product.id,
        titleAr: product.titleAr,
        titleEn: product.titleEn,
      },
      metadata: buildProductResourceMetadata(product.id),
    });

    return [assignComponentIds(card, `product-card-${product.id}`)];
  }, [product.id, product.titleAr, product.titleEn]);

  return (
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
  );
}
