"use client";

import React, { CSSProperties, useEffect, useState } from "react";
import { User } from "lucide-react";
import type { ComponentConfig } from "@/core/types";

export const LOGIN_EVENT = "login" as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export type LoginButtonProps = {
  /** Cookie name that holds the logged-in user's display name */
  userNameCookie: string;
  /** Label shown when no user cookie is found */
  guestLabel: string;
  /** Show/hide the user icon */
  showIcon: boolean;
  /** CSS colour — defaults to inherit from parent */
  textColor: string;
};

// ─── Cookie helper ────────────────────────────────────────────────────────────

function readCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function useUserName(cookieName: string): string | null {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    setName(readCookieValue(cookieName) ?? null);
  }, [cookieName]);

  return name;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const LoginButton: ComponentConfig<LoginButtonProps> = {
  label: "زر تسجيل الدخول",

  fields: {
    userNameCookie: {
      type: "text",
      label: "اسم الكوكي",
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
  },

  defaultProps: {
    userNameCookie: "sooq-user-name",
    guestLabel: "تسجيل الدخول",
    showIcon: true,
    textColor: "inherit",
  },

  render: ({ userNameCookie, guestLabel, showIcon, textColor, puck }) => {
    const userName = useUserName(userNameCookie);
    const label = userName ?? guestLabel;

    const btnStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "8px 14px",
      background: "transparent",
      border: "none",
      borderRadius: "999px",
      cursor: puck.isEditing ? "default" : "pointer",
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

    if (puck.isEditing) {
      return <span style={btnStyle}>{inner}</span>;
    }

    return (
      <button
        type="button"
        style={btnStyle}
        onClick={() => window.dispatchEvent(new CustomEvent(LOGIN_EVENT))}
      >
        {inner}
      </button>
    );
  },
};
