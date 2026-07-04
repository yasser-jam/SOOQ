"use client";

import React, { CSSProperties, useEffect, useMemo } from "react";
import type { ComponentDataOptionalId } from "@/core/types";
import conf from "../../index";
import { SlotRenderPure } from "@/core/components/SlotRender/server";
import { assignComponentIds } from "@/core/lib/assign-component-ids";
import {
  buildCartItemGroupsFromLines,
  buildCartSectionShellContent,
  extractCartShellBlocks,
  mergeCartShellWithLineGroups,
} from "./cart-section";
import { createParagraph } from "../../presets/shared";
import {
  createDemoCartLine,
  mapCartLineToBoundData,
} from "../../cart/map-cart-line-to-bound-data";
import {
  registerAddProductCartListener,
  useStoreCart,
} from "../../cart/use-store-cart";

type CartSectionStorefrontProps = {
  cartSlotItems: ComponentDataOptionalId[];
  gridClassName: string;
  gridStyle: CSSProperties;
};

export function CartSectionStorefront({
  cartSlotItems,
  gridClassName,
  gridStyle,
}: CartSectionStorefrontProps) {
  const { cart } = useStoreCart();

  useEffect(() => {
    registerAddProductCartListener();
  }, []);

  const content = useMemo(() => {
    const shell =
      cartSlotItems.length > 0
        ? extractCartShellBlocks(cartSlotItems)
        : buildCartSectionShellContent();
    const lineGroups = buildCartItemGroupsFromLines(cart.items);
    const merged = mergeCartShellWithLineGroups(shell, lineGroups);
    return merged.map((item, index) =>
      assignComponentIds(item, `cart-section-live-${index}`)
    );
  }, [cart.items, cartSlotItems]);

  if (cart.items.length === 0) {
    const shellOnly =
      cartSlotItems.length > 0
        ? extractCartShellBlocks(cartSlotItems)
        : buildCartSectionShellContent();
    const emptyMessage = createParagraph(
      "سلتك فارغة. تصفّح المنتجات وأضف ما يعجبك إلى السلة.",
      {
        textAlign: "right",
        fontSize: "theme-sm",
        color: "theme-neutral",
      }
    );
    const shellWithEmpty = [
      ...shellOnly.slice(0, 2),
      emptyMessage,
      ...shellOnly.slice(2),
    ];
    const emptyContent = shellWithEmpty.map((item, index) =>
      assignComponentIds(item, `cart-section-empty-${index}`)
    );

    return (
      <SlotRenderPure
        content={emptyContent}
        zone="cart-section-empty"
        config={conf}
        metadata={{ puck: { dragRef: null, isEditing: false } }}
        className={gridClassName}
        style={gridStyle}
      />
    );
  }

  return (
    <SlotRenderPure
      content={content}
      zone="cart-section-live"
      config={conf}
      metadata={{ puck: { dragRef: null, isEditing: false } }}
      className={gridClassName}
      style={gridStyle}
    />
  );
}

export function getDemoCartBoundData() {
  return mapCartLineToBoundData(createDemoCartLine());
}
