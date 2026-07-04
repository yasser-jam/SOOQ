"use client";

import React, { CSSProperties, useCallback, useEffect, useMemo } from "react";
import { getClassNameFactory } from "@/core/lib";
import {
  formatCartMoney,
  getCartSubtotal,
} from "../../cart/store-cart";
import {
  registerAddProductCartListener,
  useStoreCart,
} from "../../cart/use-store-cart";
import { useStore } from "../../store-context";
import { CartRowGroupUI } from "./CartRowGroupUI";
import styles from "./styles.module.css";
import type { CartSectionProps } from "./types";

const getClassName = getClassNameFactory("CartSection", styles);

const GAP_MAP: Record<string, string> = {
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
};

export function CartSectionClient({
  layoutStyle,
  gap,
  showDividerLines,
  orderButtonLabel,
  puck,
}: CartSectionProps & { puck?: { isEditing?: boolean } }) {
  const { cart, bumpQuantity, removeCartLine } = useStoreCart();
  const isEditing = puck?.isEditing === true;
  const { actions, loading } = useStore();

  useEffect(() => {
    registerAddProductCartListener();
  }, []);

  const subtotal = useMemo(() => getCartSubtotal(cart), [cart]);
  const gapPx = GAP_MAP[gap] ?? GAP_MAP.md;
  const listStyle: CSSProperties = { gap: gapPx };
  const currency =
    cart.items[0]?.product.currencyCode ?? "SYP";

  const onMakeOrder = useCallback(async () => {
    try {
      await actions.makeOrder();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "حدث خطأ أثناء تقديم الطلب.");
    }
  }, [actions]);

  if (cart.items.length === 0) {
    return (
      <div className={getClassName()}>
        <h2 className={getClassName("heading")}>سلة التسوق</h2>
        <div className={getClassName("empty")}>
          سلتك فارغة. تصفّح المنتجات وأضف ما يعجبك إلى السلة.
        </div>
      </div>
    );
  }

  const listClass = [
    getClassName("list"),
    layoutStyle === "rows"
      ? getClassName("list--rows")
      : getClassName("list--cards"),
    showDividerLines ? getClassName("list--divider") : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={getClassName()}>
      <h2 className={getClassName("heading")}>سلة التسوق</h2>

      <div className={listClass} style={listStyle}>
        {cart.items.map((line) => (
          <CartRowGroupUI
            key={line.lineId}
            line={line}
            layoutStyle={layoutStyle}
            showDividerLines={showDividerLines}
            isEditing={isEditing}
            onBumpQuantity={bumpQuantity}
            onRemove={removeCartLine}
          />
        ))}
      </div>

      <div className={getClassName("footer")}>
        <div className={getClassName("footerRow")}>
          <span>المجموع الفرعي</span>
          <span>{formatCartMoney(subtotal, currency)}</span>
        </div>
        <button
          type="button"
          className={getClassName("checkout")}
          onClick={onMakeOrder}
          disabled={loading.makeOrder}
          style={{ opacity: loading.makeOrder ? 0.65 : 1 }}
        >
          {loading.makeOrder ? "جاري تقديم الطلب..." : orderButtonLabel || "إتمام الطلب"}
        </button>
      </div>
    </div>
  );
}
