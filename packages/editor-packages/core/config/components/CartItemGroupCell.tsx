"use client";

import React, { useMemo } from "react";
import conf from "../index";
import { SlotRenderPure } from "@/core/components/SlotRender/server";
import { assignComponentIds } from "@/core/lib/assign-component-ids";
import { BoundDataProvider } from "../binding";
import { mapCartLineToBoundData } from "../cart/map-cart-line-to-bound-data";
import type { StoreCartLine } from "../cart/store-cart";
import { createCartItemBlock } from "../presets/cart";

type CartItemGroupCellProps = {
  line: StoreCartLine;
  isEditing?: boolean;
};

export function CartItemGroupCell({
  line,
  isEditing = false,
}: CartItemGroupCellProps) {
  const boundData = useMemo(() => mapCartLineToBoundData(line), [line]);

  const content = useMemo(() => {
    const item = createCartItemBlock();
    return [assignComponentIds(item, `cart-item-${line.lineId}`)];
  }, [line.lineId]);

  return (
    <BoundDataProvider
      value={{
        data: boundData,
        isLoading: false,
        isError: false,
        metadata: line.metadata ?? null,
        language: line.language ?? "ar",
        selectedVariantId: line.selectedVariant?.variantId ?? null,
        setSelectedVariantId: () => {},
      }}
    >
      <SlotRenderPure
        content={content}
        zone={`cart-item-${line.lineId}`}
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
