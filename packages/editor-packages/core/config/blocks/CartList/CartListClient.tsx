"use client";

import React, { CSSProperties, useEffect } from "react";
import { getClassNameFactory } from "@/core/lib";
import { CartLineGroupCell } from "../../components/CartLineGroupCell";
import {
  createDemoCartLine,
  mapCartLineToBoundData,
} from "../../cart/map-cart-line-to-bound-data";
import {
  registerAddProductCartListener,
  useStoreCart,
} from "../../cart/use-store-cart";
import type { CartListProps } from "./types";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("CartList", styles);

const GAP_MAP: Record<string, string> = {
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
};

export function CartListClient({
  gap,
  showDividerLines,
  puck,
}: CartListProps & { puck?: { isEditing?: boolean } }) {
  const { cart } = useStoreCart();
  const isEditing = puck?.isEditing === true;

  useEffect(() => {
    registerAddProductCartListener();
  }, []);

  const gapPx = GAP_MAP[gap] ?? GAP_MAP.md;
  const listStyle: CSSProperties = { gap: gapPx };
  const lines =
    cart.items.length > 0
      ? cart.items
      : isEditing
        ? [createDemoCartLine()]
        : [];

  if (lines.length === 0) {
    return (
      <div className={getClassName()}>
        <div className={getClassName("empty")}>
          سلتك فارغة. تصفّح المنتجات وأضف ما يعجبك إلى السلة.
        </div>
      </div>
    );
  }

  const listClass = [
    getClassName("list"),
    showDividerLines ? getClassName("list--divider") : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={getClassName()}>
      <div className={listClass} style={listStyle}>
        {lines.map((line) => (
          <div key={line.lineId} className={getClassName("item")}>
            <CartLineGroupCell line={line} isEditing={isEditing} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Used by editor previews when binding paths need sample data. */
export function getDemoCartBoundData() {
  return mapCartLineToBoundData(createDemoCartLine());
}
