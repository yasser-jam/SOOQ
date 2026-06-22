/* eslint-disable @next/next/no-img-element */
import React, { CSSProperties } from "react";
import { ComponentConfig } from "@/core/types";
import { getClassNameFactory } from "@/core/lib";
import { withLayout, WithLayout } from "../../components/Layout";
import { products, type Product } from "../../data/products";
import { formatPrice } from "../../lib/format";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("Wishlist", styles);

// SRS DSN-005h — Wishlist (Bound block).
// Renders the authenticated customer's saved products. JSON carries display
// config only (columns, gap, currency, CTA label); product rows are resolved
// at render time by the consuming web/mobile renderer.

export type WishlistProps = WithLayout<{
  columns: 2 | 3 | 4;
  gap: "sm" | "md" | "lg";
  currency: string;
  showAddToCart: boolean;
  ctaLabel: string;
  emptyStateText: string;
}>;

const GAP_MAP: Record<WishlistProps["gap"], string> = {
  sm: "8px",
  md: "16px",
  lg: "24px",
};

function WishlistRender({
  columns,
  gap,
  currency,
  showAddToCart,
  ctaLabel,
  emptyStateText,
}: WishlistProps) {
  // Editor preview: take first 6 sample products as the "saved" wishlist.
  const items: Product[] = products.slice(0, 6);

  if (items.length === 0) {
    return (
      <div className={getClassName()}>
        <div className={getClassName("empty")}>{emptyStateText}</div>
      </div>
    );
  }

  const cssVars: CSSProperties = {
    "--wl-cols": String(columns),
    "--wl-gap": GAP_MAP[gap],
  } as CSSProperties;

  return (
    <div className={getClassName()} style={cssVars}>
      <div className={getClassName("grid")}>
        {items.map((p) => (
          <article key={p.id} className={getClassName("card")}>
            <div className={getClassName("imageWrap")}>
              {p.image && (
                <img
                  src={p.image}
                  alt={p.title}
                  className={getClassName("image")}
                />
              )}
              <button
                type="button"
                className={getClassName("removeBtn")}
                aria-label={`Remove ${p.title} from wishlist`}
              >
                ✕
              </button>
            </div>
            <div className={getClassName("body")}>
              <h4 className={getClassName("title")}>{p.title}</h4>
              <span className={getClassName("price")}>
                {formatPrice(p.price, currency)}
              </span>
              {showAddToCart && (
                <button type="button" className={getClassName("cta")}>
                  {ctaLabel}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

const WishlistInner: ComponentConfig<WishlistProps> = {
  label: "Wishlist",

  fields: {
    columns: {
      type: "radio",
      label: "الأعمدة",
      options: [
        { label: "2", value: 2 },
        { label: "3", value: 3 },
        { label: "4", value: 4 },
      ],
    },
    gap: {
      type: "radio",
      label: "الفجوة",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    currency: {
      type: "select",
      label: "العملة",
      options: [
        { label: "Syrian Pound (SYP)", value: "SYP" },
        { label: "US Dollar (USD)", value: "USD" },
        { label: "Euro (EUR)", value: "EUR" },
      ],
    },
    showAddToCart: {
      type: "radio",
      label: "إظهار زر الإضافة للسلة",
      options: [
        { label: "Show", value: true },
        { label: "Hide", value: false },
      ],
    },
    ctaLabel: {
      type: "text",
      label: "نص الدعوة للإجراء",
    },
    emptyStateText: {
      type: "text",
      label: "رسالة الحالة الفارغة",
    },
  },

  defaultProps: {
    columns: 3,
    gap: "md",
    currency: "SYP",
    showAddToCart: true,
    ctaLabel: "Add to cart",
    emptyStateText: "Your wishlist is empty.",
  },

  render: WishlistRender,
};

export const Wishlist = withLayout(WishlistInner);
