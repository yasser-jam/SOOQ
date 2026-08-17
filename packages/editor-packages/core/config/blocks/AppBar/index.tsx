"use client";

import React from "react";
import { Bell, Menu, ShoppingCart } from "lucide-react";
import { ComponentConfig } from "@/core/types";
import { colorField } from "../../fields/ColorField";
import {
  buildPersistedAppBarProps,
  type AppBarEditorProps,
} from "../../lib/app-bar";
import { isMobileEditorMetadata } from "../../lib/editor-mode";
import { emitMobileSidebar } from "../../lib/mobile-sidebar-preview";
import styles from "./styles.module.css";

export type AppBarProps = AppBarEditorProps;

const boolOptions = [
  { label: "نعم", value: true },
  { label: "لا", value: false },
];

/**
 * Mobile AppBar — fixed chrome for each page (not a drop zone).
 * Shown in the blocks palette only in the mobile editor.
 */
export const AppBar: ComponentConfig<AppBarProps> = {
  label: "شريط التطبيق",
  permissions: {
    // One per page via compose/save; still allow delete to clear → `{}`
    duplicate: false,
    // Not a nest target — no slot field either
  },
  fields: {
    title: {
      type: "text",
      label: "العنوان",
    },
    elevation: {
      type: "number",
      label: "الارتفاع (elevation)",
      min: 0,
      max: 24,
    },
    height: {
      type: "number",
      label: "ارتفاع الشريط",
      min: 40,
      max: 120,
    },
    showMenu: {
      type: "radio",
      label: "زر القائمة",
      options: boolOptions,
    },
    menuIcon: {
      type: "text",
      label: "أيقونة القائمة",
    },
    showNotifications: {
      type: "radio",
      label: "زر الإشعارات",
      options: boolOptions,
    },
    showCartIcon: {
      type: "radio",
      label: "زر السلة",
      options: boolOptions,
    },
    foregroundColor: colorField({
      label: "لون المقدمة",
      description: "لون النص والأيقونات.",
    }),
    backgroundColor: colorField({
      label: "لون الخلفية",
      description: "يُحفظ داخل style.background.",
    }),
  },
  defaultProps: {
    title: "SOOQ",
    elevation: 0,
    height: 56,
    showMenu: false,
    menuIcon: "menu",
    showNotifications: false,
    showCartIcon: false,
    foregroundColor: "#0F172A",
    backgroundColor: "#FFFFFF",
  },
  resolveFields: (data, { fields, metadata }) => {
    // Hide entirely from field editing context on desktop (block shouldn't appear)
    if (!isMobileEditorMetadata(metadata)) {
      return fields;
    }
    const next = { ...fields };
    if (!data.props.showMenu) {
      delete next.menuIcon;
    }
    return next;
  },
  resolveData: ({ props }) => {
    // Keep derived action fields in sync so JSON viewers / exporters see them
    // on the live Puck node as well as on page.appBar after save.
    const { props: persisted, style } = buildPersistedAppBarProps(props);
    return {
      props: {
        ...props,
        menuIcon: props.showMenu
          ? props.menuIcon || "menu"
          : props.menuIcon || "menu",
        // Mirror persisted extras onto the node for debugging (not shown as fields)
        ...(persisted.menuAction ? { menuAction: persisted.menuAction } : {}),
        ...(persisted.trailingIcon
          ? { trailingIcon: persisted.trailingIcon }
          : {}),
        ...(persisted.trailingAction
          ? { trailingAction: persisted.trailingAction }
          : {}),
        ...(persisted.showCartIcon
          ? {
              cartBadgePath: persisted.cartBadgePath,
              cartAction: persisted.cartAction,
            }
          : {}),
        ...(style ? { style } : {}),
      },
    };
  },
  render: ({
    title,
    elevation,
    height,
    showMenu,
    showNotifications,
    showCartIcon,
    foregroundColor,
    backgroundColor,
  }) => {
    const fg = foregroundColor || "#0F172A";
    const bg = backgroundColor || "#FFFFFF";
    const barHeight = typeof height === "number" && height > 0 ? height : 56;
    const shadow =
      typeof elevation === "number" && elevation > 0
        ? `0 ${Math.min(elevation, 8)}px ${elevation * 2}px rgba(15, 23, 42, 0.12)`
        : "none";

    return (
      <header
        className={styles.root}
        style={{
          height: barHeight,
          background: bg,
          color: fg,
          boxShadow: shadow,
        }}
        data-sooq-appbar=""
      >
        <div className={styles.leading}>
          {showMenu ? (
            // `menuAction: openDrawer` — mirror it in the canvas so the mobile
            // Sidebar drawer can be opened/closed from here too.
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="القائمة"
              onClick={() => emitMobileSidebar("toggle")}
            >
              <Menu size={20} strokeWidth={2} />
            </button>
          ) : (
            <span className={styles.iconSpacer} />
          )}
        </div>
        <div className={styles.title}>{title || "—"}</div>
        <div className={styles.trailing}>
          {showNotifications ? (
            <span className={styles.iconBtn} aria-label="الإشعارات">
              <Bell size={20} strokeWidth={2} />
            </span>
          ) : null}
          {showCartIcon ? (
            <span className={styles.iconBtn} aria-label="السلة">
              <ShoppingCart size={20} strokeWidth={2} />
            </span>
          ) : null}
          {!showNotifications && !showCartIcon ? (
            <span className={styles.iconSpacer} />
          ) : null}
        </div>
      </header>
    );
  },
};
