"use client";

import React, { CSSProperties, useEffect, useState } from "react";
import { User } from "lucide-react";
import type { ComponentConfig } from "@/core/types";
import { dispatchZoneEvent } from "../../lib/zone-events";

export { LOGIN_EVENT } from "../../lib/login-events";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LoginButtonProps = {
  /** Cookie name that indicates an authenticated session (e.g. tenant id) */
  tenantIdCookie: string;
  /** Cookie name that holds the logged-in user's display name */
  userNameCookie: string;
  /** Label shown when no session cookie is found */
  guestLabel: string;
  /** Show/hide the user icon */
  showIcon: boolean;
  /** CSS colour — defaults to inherit from parent */
  textColor: string;
  /** Zone key opened when the guest clicks (e.g. login popup) */
  zoneKey: string;
};

// ─── Cookie helper ────────────────────────────────────────────────────────────

function readCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

type LoginButtonState = {
  isLoggedIn: boolean;
  label: string;
};

function useLoginButtonState(
  tenantIdCookie: string,
  userNameCookie: string,
  guestLabel: string
): LoginButtonState {
  const [state, setState] = useState<LoginButtonState>({
    isLoggedIn: false,
    label: guestLabel,
  });

  useEffect(() => {
    const refresh = () => {
      const tenantId = readCookieValue(tenantIdCookie);
      const isLoggedIn = Boolean(tenantId);
      const userName = isLoggedIn ? readCookieValue(userNameCookie) : null;

      setState({
        isLoggedIn,
        label: isLoggedIn ? userName ?? guestLabel : guestLabel,
      });
    };

    if (typeof window === "undefined") return;

    refresh();
    window.addEventListener("login", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener("login", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [tenantIdCookie, userNameCookie, guestLabel]);

  return state;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const LoginButton: ComponentConfig<LoginButtonProps> = {
  label: "زر تسجيل الدخول",

  fields: {
    tenantIdCookie: {
      type: "text",
      label: "كوكي معرف المتجر",
    },
    userNameCookie: {
      type: "text",
      label: "كوكي اسم المستخدم",
    },
    guestLabel: {
      type: "text",
      label: "نص الزائر",
    },
    showIcon: {
      type: "radio",
      label: "إظهار الأيقونة",
      options: [
        { label: "نعم", value: true },
        { label: "لا", value: false },
      ],
    },
    textColor: {
      type: "text",
      label: "لون النص",
    },
    zoneKey: {
      type: "text",
      label: "مفتاح النافذة",
    },
  },

  defaultProps: {
    tenantIdCookie: "sooq-tenant-id",
    userNameCookie: "sooq-user-name",
    guestLabel: "تسجيل الدخول",
    showIcon: true,
    textColor: "inherit",
    zoneKey: "login",
  },

  render: ({
    tenantIdCookie,
    userNameCookie,
    guestLabel,
    showIcon,
    textColor,
    zoneKey,
    puck,
  }) => {
    const { isLoggedIn, label } = useLoginButtonState(
      tenantIdCookie,
      userNameCookie,
      guestLabel
    );

    const btnStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "8px 14px",
      background: "transparent",
      border: "none",
      borderRadius: "999px",
      cursor: puck.isEditing || isLoggedIn ? "default" : "pointer",
      color: textColor || "inherit",
      fontSize: "0.88rem",
      fontWeight: 600,
      lineHeight: 1,
      whiteSpace: "nowrap",
      transition: "background 120ms ease",
      fontFamily: "inherit",
    };

    const inner = (
      <>
        {showIcon && <User size={16} strokeWidth={2} />}
        <span>{label}</span>
      </>
    );

    if (puck.isEditing || isLoggedIn) {
      return <span style={btnStyle}>{inner}</span>;
    }

    return (
      <button
        type="button"
        style={btnStyle}
        onClick={() => dispatchZoneEvent(zoneKey || "login", "open")}
      >
        {inner}
      </button>
    );
  },
};
