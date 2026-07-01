"use client";

import React, { useMemo } from "react";
import conf from "../../index";
import { useSlots } from "@/core/lib/use-slots";
import { SlotRenderPure } from "@/core/components/SlotRender/server";
import { assignComponentIds } from "@/core/lib/assign-component-ids";
import { createProductCardGroup } from "../../presets/products-grid";
import {
  buildProductResourceMetadata,
  type ProductPickerRef,
} from "@/modules/product/product/data-store";

type ProductCardGroupCellProps = {
  product: ProductPickerRef;
  puck?: { isEditing?: boolean };
};

export function ProductCardGroupCell({ product, puck }: ProductCardGroupCellProps) {
  const item = useMemo(() => {
    const group = createProductCardGroup({
      product: {
        id: product.id,
        titleAr: product.titleAr,
        titleEn: product.titleEn,
      },
      metadata: buildProductResourceMetadata(product.id),
    });

    return assignComponentIds(group, `product-card-${product.id}`);
  }, [product.id, product.titleAr, product.titleEn]);

  const props = useSlots(conf, item, (slotProps) => (
    <SlotRenderPure {...slotProps} config={conf} metadata={{}} />
  ));

  const Group = conf.components.Group;

  return (
    <Group.render
      {...props}
      puck={props.puck}
    />
  );
}
