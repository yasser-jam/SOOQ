"use client";

import React from "react";
import { getClassNameFactory } from "@/core/lib";
import { resolveValueContext } from "../../binding";
import { useBoundData } from "../../binding/BoundDataContext";
import { setLineQuantity } from "../../cart/store-cart";
import { useStoreCart } from "../../cart/use-store-cart";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("CartQuantity", styles);

type CartQuantityClientProps = {
  align: "left" | "center" | "right";
  isEditing?: boolean;
};

export function CartQuantityClient({
  align,
  isEditing = false,
}: CartQuantityClientProps) {
  const { data } = useBoundData();
  const { cart } = useStoreCart();
  const lineId =
    typeof data?.lineId === "string" ? data.lineId : undefined;
  const quantityValue = resolveValueContext("quantity", data);
  const boundQuantity =
    typeof quantityValue === "number"
      ? quantityValue
      : Number(quantityValue) || 1;
  const liveLine = lineId
    ? cart.items.find((item) => item.lineId === lineId)
    : undefined;
  const quantity = liveLine?.quantity ?? boundQuantity;

  const onBump = (delta: number) => {
    if (isEditing || !lineId || lineId === "demo-line") return;
    setLineQuantity(lineId, quantity + delta);
  };

  const justifyContent =
    align === "left"
      ? "flex-start"
      : align === "right"
        ? "flex-end"
        : "center";

  return (
    <div style={{ display: "flex", width: "100%", justifyContent }} dir="rtl">
      <div className={getClassName()}>
        <button
          type="button"
          className={getClassName("stepBtn")}
          aria-label="تقليل الكمية"
          onClick={() => onBump(-1)}
        >
          −
        </button>
        <span className={getClassName("qty")} aria-live="polite">
          {quantity}
        </span>
        <button
          type="button"
          className={getClassName("stepBtn")}
          aria-label="زيادة الكمية"
          onClick={() => onBump(1)}
        >
          +
        </button>
      </div>
    </div>
  );
}
