"use client";

import React, { CSSProperties, useSyncExternalStore } from "react";
import { ReceiptText } from "lucide-react";
import type { ComponentConfig } from "@/core/types";
import { withStoreBasePath } from "../../lib/store-base-path";
import { SmartLink } from "../../../components/SmartLink";

// Entry point for the customer order history. `/orders` is a real route in
// apps/store (app/store/[tenantId]/orders), not a Site JSON page — a static
// segment that shadows the storefront catch-all — so this links to it directly
// instead of going through the page registry / pages menu.

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrdersIconButtonProps = {
  href: string;
  /** Text shown next to the icon. Empty = icon only. */
  label: string;
  iconSize: number;
  /** Hide the button entirely until the customer is signed in. */
  onlyWhenSignedIn: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACCESS_TOKEN_COOKIE = "sooq-store-access-token";

function hasCustomerSession(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((entry) => entry.trim().startsWith(`${ACCESS_TOKEN_COOKIE}=`));
}

// Cookies are invisible during SSR, so the server snapshot reports "signed
// out" and the client corrects it on hydration.
const subscribeToSession = () => () => {};
const getSessionServerSnapshot = () => false;

function useCustomerSignedIn(): boolean {
  return useSyncExternalStore(
    subscribeToSession,
    hasCustomerSession,
    getSessionServerSnapshot
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export const OrdersIconButton: ComponentConfig<OrdersIconButtonProps> = {
  label: "زر طلباتي",

  fields: {
    href: {
      type: "text",
      label: "رابط الطلبات",
    },
    label: {
      type: "text",
      label: "النص (اتركه فارغًا للأيقونة فقط)",
    },
    iconSize: {
      type: "number",
      label: "حجم الأيقونة (بكسل)",
      min: 14,
      max: 48,
    },
    onlyWhenSignedIn: {
      type: "radio",
      label: "إظهاره للمسجّلين فقط",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
  },

  defaultProps: {
    href: "/orders",
    label: "طلباتي",
    iconSize: 20,
    onlyWhenSignedIn: true,
  },

  render: ({ href, label, iconSize, onlyWhenSignedIn, showCondition, puck }: any) => {
    const signedIn = useCustomerSignedIn();

    // Prefer the shared Site JSON `showCondition` when set; fall back to the
    // legacy `onlyWhenSignedIn` flag for older payloads.
    const condition =
      showCondition ?? (onlyWhenSignedIn ? "loggedIn" : "always");

    // In the editor the button always shows — a merchant has to be able to
    // select and style it regardless of their own session. `PuckComponent`
    // must return an element, so hiding means rendering an empty fragment.
    // (withShowCondition also gates this; keep the legacy path for safety.)
    if (
      !puck.isEditing &&
      condition === "loggedIn" &&
      !signedIn
    ) {
      return <></>;
    }
    if (!puck.isEditing && condition === "loggedOut" && signedIn) {
      return <></>;
    }

    const btnStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: label ? "6px" : 0,
      padding: "8px",
      background: "transparent",
      border: "none",
      borderRadius: label ? "8px" : "50%",
      cursor: puck.isEditing ? "default" : "pointer",
      color: "inherit",
      textDecoration: "none",
      fontSize: "14px",
      lineHeight: 1,
      whiteSpace: "nowrap",
    };

    const inner = (
      <>
        <ReceiptText size={iconSize} strokeWidth={2} />
        {label ? <span>{label}</span> : null}
      </>
    );

    if (puck.isEditing) {
      return <span style={btnStyle}>{inner}</span>;
    }

    return (
      <SmartLink
        href={withStoreBasePath(href || "/orders") ?? "/orders"}
        style={btnStyle}
        aria-label={label || "طلباتي"}
      >
        {inner}
      </SmartLink>
    );
  },
};
