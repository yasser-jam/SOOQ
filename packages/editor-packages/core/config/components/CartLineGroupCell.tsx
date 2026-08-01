"use client";

import React, { useMemo } from "react";
import conf from "../index";
import { SlotRenderPure } from "@/core/components/SlotRender/server";
import { assignComponentIds } from "@/core/lib/assign-component-ids";
import { BoundDataProvider } from "../binding";
import { useActiveLanguage } from "../locale/LanguageContext";
import { mapCartLineToBoundData } from "../cart/map-cart-line-to-bound-data";
import type { StoreCartLine } from "../cart/store-cart";
import { createCartItemGroup } from "../presets/cart";

type CartLineGroupCellProps = {
  line: StoreCartLine;
  isEditing?: boolean;
};

/** Renders one cart line using the cart item Group preset + bound localStorage data. */
export function CartLineGroupCell({
  line,
  isEditing = false,
}: CartLineGroupCellProps) {
  const { language: activeLanguage } = useActiveLanguage();
  const boundData = useMemo(() => mapCartLineToBoundData(line), [line]);

  const content = useMemo(() => {
    const item = createCartItemGroup({ cartLineId: line.lineId });
    return [assignComponentIds(item, `cart-line-${line.lineId}`)];
  }, [line.lineId]);

  return (
    <BoundDataProvider
      value={{
        data: boundData,
        isLoading: false,
        isError: false,
        metadata: line.metadata ?? null,
        language: line.language ?? activeLanguage,
        selectedVariantId: line.selectedVariant?.variantId ?? null,
        setSelectedVariantId: () => {},
      }}
    >
      <SlotRenderPure
        content={content}
        zone={`cart-line-${line.lineId}`}
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
