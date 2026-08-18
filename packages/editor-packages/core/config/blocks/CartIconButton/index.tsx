"use client";

import React, { CSSProperties, useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import type { ComponentConfig } from "@/core/types";
import {
  readStoreCart,
  STORE_CART_UPDATED_EVENT,
} from "../../cart/store-cart";
import { withStoreBasePath } from "../../lib/store-base-path";
import { SmartLink } from "../../../components/SmartLink";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CartIconButtonProps = {
  href: string;
  iconSize: number;
  /** Badge background colour — CSS colour string */
  badgeColor: string;
  /** Badge text colour */
  badgeTextColor: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useCartCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const read = () =>
      setCount(readStoreCart().items.reduce((s, l) => s + l.quantity, 0));

    read();

    window.addEventListener(STORE_CART_UPDATED_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(STORE_CART_UPDATED_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  return count;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CartIconButton: ComponentConfig<CartIconButtonProps> = {
  label: "زر السلة",

  fields: {
    href: {
      type: "text",
      label: "رابط السلة",
    },
    iconSize: {
      type: "number",
      label: "حجم الأيقونة (بكسل)",
      min: 14,
      max: 48,
    },
    badgeColor: {
      type: "text",
      label: "لون الشارة",
    },
    badgeTextColor: {
      type: "text",
      label: "لون نص الشارة",
    },
  },

  defaultProps: {
    href: "/cart",
    iconSize: 22,
    badgeColor: "#ef4444",
    badgeTextColor: "#ffffff",
  },

  render: ({ href, iconSize, badgeColor, badgeTextColor, puck }) => {
    const count = useCartCount();

    const btnStyle: CSSProperties = {
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "8px",
      background: "transparent",
      border: "none",
      borderRadius: "50%",
      cursor: puck.isEditing ? "default" : "pointer",
      color: "inherit",
      textDecoration: "none",
      lineHeight: 1,
    };

    const badgeStyle: CSSProperties = {
      position: "absolute",
      top: "1px",
      insetInlineEnd: "1px",
      minWidth: "18px",
      height: "18px",
      padding: "0 4px",
      borderRadius: "999px",
      background: badgeColor,
      color: badgeTextColor,
      fontSize: "10px",
      fontWeight: 700,
      display: count > 0 ? "flex" : "none",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 1,
      boxSizing: "border-box",
      pointerEvents: "none",
    };

    const inner = (
      <>
        <ShoppingCart size={iconSize} strokeWidth={2} />
        <span style={badgeStyle} aria-label={`${count} عناصر في السلة`}>
          {count > 99 ? "99+" : count}
        </span>
      </>
    );

    if (puck.isEditing) {
      return <span style={btnStyle}>{inner}</span>;
    }

    return (
      <SmartLink
        href={withStoreBasePath(href || "/cart") ?? "/cart"}
        style={btnStyle}
        aria-label="عرض السلة"
      >
        {inner}
      </SmartLink>
    );
  },
};
