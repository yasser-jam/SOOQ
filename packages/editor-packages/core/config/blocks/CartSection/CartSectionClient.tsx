"use client";
import React, { CSSProperties, useCallback, useMemo, useState } from "react";
import {
  cloneMockCartItems,
  resolveItemsToLines,
  mockCartSubtotal,
  formatMoney,
  type MockCartLine,
} from "../../data/cart";
import { getClassNameFactory } from "@/core/lib";
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
}: CartSectionProps) {
  const [items, setItems] = useState<MockCartLine[]>(cloneMockCartItems);

  const lines = useMemo(() => resolveItemsToLines(items), [items]);
  const subtotal = useMemo(() => mockCartSubtotal(lines), [lines]);
  const gapPx = GAP_MAP[gap] ?? GAP_MAP.md;
  const listStyle: CSSProperties = { gap: gapPx };

  const bumpQty = useCallback((lineId: string, delta: number) => {
    setItems((prev) =>
      prev.flatMap((l) => {
        if (l.lineId !== lineId) return [l];
        const q = l.quantity + delta;
        if (q < 1) return [];
        return [{ ...l, quantity: q }];
      })
    );
  }, []);

  const removeLine = useCallback((lineId: string) => {
    setItems((prev) => prev.filter((l) => l.lineId !== lineId));
  }, []);

  const onCheckout = useCallback(() => {
    window.alert(
      "Checkout is not connected — this is a demo cart. Subtotal: " +
        formatMoney(subtotal)
    );
  }, [subtotal]);

  if (lines.length === 0) {
    return (
      <div className={getClassName()}>
        <h2 className={getClassName("heading")}>Shopping cart</h2>
        <div className={getClassName("empty")}>
          Your cart is empty. Reload the page to restore demo items from{" "}
          <code>config/data/cart.ts</code>.
        </div>
      </div>
    );
  }

  const listClass = [
    getClassName("list"),
    layoutStyle === "rows" ? getClassName("list--rows") : getClassName("list--cards"),
    showDividerLines ? getClassName("list--divider") : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={getClassName()}>
      <h2 className={getClassName("heading")}>Shopping cart</h2>

      <div className={listClass} style={listStyle}>
        {lines.map(({ line, product, unitPrice, lineTotal }) => {
          const itemClass =
            layoutStyle === "rows"
              ? getClassName("itemRow")
              : getClassName("itemCard");

          return (
            <article key={line.lineId} className={itemClass}>
              {product.image ? (
                <img
                  className={getClassName("image")}
                  src={product.image}
                  alt=""
                />
              ) : (
                <div
                  className={getClassName("image")}
                  role="img"
                  aria-label={product.title}
                />
              )}
              <div className={getClassName("body")}>
                <div className={getClassName("row")}>
                  <div className={getClassName("titleBlock")}>
                    <h3 className={getClassName("title")}>{product.title}</h3>
                    <p className={getClassName("meta")}>
                      {formatMoney(unitPrice)} each
                      {typeof product.discount === "number" &&
                        product.discount > 0 && (
                          <span> ({product.discount}% off list)</span>
                        )}
                    </p>
                  </div>
                  <span className={getClassName("lineTotal")}>
                    {formatMoney(lineTotal)}
                  </span>
                </div>

                <div className={getClassName("controls")}>
                  <div className={getClassName("stepper")}>
                    <button
                      type="button"
                      className={getClassName("stepBtn")}
                      aria-label="Decrease quantity"
                      onClick={() => bumpQty(line.lineId, -1)}
                    >
                      −
                    </button>
                    <span className={getClassName("qty")} aria-live="polite">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      className={getClassName("stepBtn")}
                      aria-label="Increase quantity"
                      onClick={() => bumpQty(line.lineId, 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className={getClassName("removeBtn")}
                    onClick={() => removeLine(line.lineId)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className={getClassName("footer")}>
        <div className={getClassName("footerRow")}>
          <span>Subtotal</span>
          <span>{formatMoney(subtotal)}</span>
        </div>
        <button
          type="button"
          className={getClassName("checkout")}
          onClick={onCheckout}
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
