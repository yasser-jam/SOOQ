"use client";
import React from "react";
import { ComponentConfig, Slot } from "@/core/types";
import { getClassNameFactory } from "@/core/lib";
import { WithLayout, withLayout } from "../../components/Layout";
import {
  bilingualTextField,
  pickLang,
  type BilingualString,
} from "../../fields/BilingualText";
import { createSidebarStarterContent } from "../Section/starter-data";
import { applyMobileEditorFieldGroups } from "../../lib/mobile-field-groups";
import { useDisplayLanguage } from "../../locale/use-display-language";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("Sidebar", styles);

/**
 * DSN-004g — Sidebar
 *
 * Generic vertical container that can live in one of two modes:
 *   - `dock: "inline"` (default): renders as a column inside whatever parent
 *     it's dropped into (e.g. a two-column Section). This is the classic
 *     sidebar-next-to-content layout.
 *   - `dock: "left" | "right"`: renders as a page-level rail anchored to the
 *     viewport edge with `position: fixed`. Use this when the Sidebar is the
 *     primary app navigation (Shopify-admin style — nav Dashboard / Inventory /
 *     Customers / Marketing / Store Builder, etc.).
 *
 * Slot-based so any block — NavMenu, filters, testimonials, promos — can
 * drop inside. The container only describes layout/chrome; it does NOT
 * assume what it contains. AI agents can rewire children without touching
 * the wrapper.
 *
 * JSON shape (abbreviated):
 *   {
 *     type: "Sidebar",
 *     props: {
 *       title: { ar, en },
 *       dock: "inline" | "left" | "right",
 *       dockOffsetTop: "64px",
 *       width: "narrow" | "medium" | "wide",
 *       stickyTop: "0px",
 *       borderStyle: "none" | "card" | "bordered" | "divider",
 *       backgroundColor: "surface" | "muted" | "transparent",
 *       showOnMobile: "collapse" | "hidden" | "always",
 *       items: Slot[],
 *     }
 *   }
 */
export type SidebarProps = WithLayout<{
  title: BilingualString;
  showTitle: boolean;
  /**
   * Where the sidebar lives:
   * - "inline" flows in normal document order (today's behaviour)
   * - "left"/"right" fix it to the viewport edge like a global app rail
   */
  dock: "inline" | "left" | "right";
  /** Top offset used only when docked — typically the site header height. */
  dockOffsetTop: string;
  width: "narrow" | "medium" | "wide";
  /** Distance from the viewport top when `sticky` is on. Empty = not sticky. */
  stickyTop: string;
  borderStyle: "none" | "bordered" | "card" | "divider";
  backgroundColor: "transparent" | "surface" | "muted";
  /** How the sidebar behaves below the 640px breakpoint. */
  showOnMobile: "collapse" | "hidden" | "always";
  items: Slot;
}>;

const WIDTH_PX: Record<SidebarProps["width"], string> = {
  narrow: "220px",
  medium: "280px",
  wide: "340px",
};

const BG_VAR: Record<SidebarProps["backgroundColor"], string | undefined> = {
  transparent: undefined,
  surface: "var(--theme-color-surface, #ffffff)",
  muted: "var(--theme-color-muted, #f9fafb)",
};

const SidebarInternal: ComponentConfig<SidebarProps> = {
  label: "الشريط الجانبي",
  fields: {
    title: bilingualTextField({ label: "Title" }),
    showTitle: {
      type: "radio",
      label: "إظهار العنوان",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    dock: {
      type: "radio",
      label: "موضع الإرساء",
      options: [
        { label: "Inline (inside a section)", value: "inline" },
        { label: "Left edge of page", value: "left" },
        { label: "Right edge of page", value: "right" },
      ],
    },
    dockOffsetTop: {
      type: "text",
      label: "إزاحة الإرساء العلوية (عادة ارتفاع الرأس)",
      placeholder: "e.g. 64px",
    },
    width: {
      type: "radio",
      label: "العرض",
      options: [
        { label: "Narrow", value: "narrow" },
        { label: "Medium", value: "medium" },
        { label: "Wide", value: "wide" },
      ],
    },
    stickyTop: {
      type: "text",
      label: "إزاحة التثبيت العلوية (فارغ = غير مثبت)",
      placeholder: "e.g. 16px",
    },
    borderStyle: {
      type: "select",
      label: "الحدود",
      options: [
        { label: "None", value: "none" },
        { label: "Bordered", value: "bordered" },
        { label: "Card (border + shadow)", value: "card" },
        { label: "Divider (trailing edge only)", value: "divider" },
      ],
    },
    backgroundColor: {
      type: "select",
      label: "الخلفية",
      options: [
        { label: "Transparent", value: "transparent" },
        { label: "Surface", value: "surface" },
        { label: "Muted", value: "muted" },
      ],
    },
    showOnMobile: {
      type: "select",
      label: "سلوك الجوال",
      options: [
        { label: "Collapse to horizontal strip", value: "collapse" },
        { label: "Hide on mobile", value: "hidden" },
        { label: "Always show (stacked)", value: "always" },
      ],
    },
    items: { type: "slot" },
  },
  defaultProps: {
    title: { ar: "القائمة الجانبية", en: "Sidebar" },
    showTitle: true,
    dock: "inline",
    dockOffsetTop: "64px",
    width: "medium",
    stickyTop: "16px",
    borderStyle: "card",
    backgroundColor: "surface",
    showOnMobile: "collapse",
    layout: {
      // The sidebar is a column, not a full-width band.
      grow: false,
    },
    items: createSidebarStarterContent(),
  },
  resolveFields: (_data, params) =>
    applyMobileEditorFieldGroups(params.fields, params.metadata),
  render: ({
    title,
    showTitle,
    dock,
    dockOffsetTop,
    width,
    stickyTop,
    borderStyle,
    backgroundColor,
    showOnMobile,
    items: Items,
    puck,
  }) => {
    const language = useDisplayLanguage();
    const resolvedTitle = pickLang(title, language);
    const resolvedDock = dock ?? "inline";
    const isDocked = resolvedDock !== "inline";
    // When docked, the whole sidebar IS the sticky/fixed anchor — its inner
    // `stickyTop` no longer makes sense, so we ignore it.
    const isSticky = !isDocked && (stickyTop ?? "").trim().length > 0;
    const collapseAttr =
      showOnMobile === "hidden"
        ? "hidden"
        : showOnMobile === "collapse"
        ? "true"
        : "false";

    const modifierClass =
      borderStyle === "bordered"
        ? getClassName("bordered")
        : borderStyle === "card"
        ? getClassName("card")
        : borderStyle === "divider"
        ? getClassName("divider")
        : "";

    const dockClass = isDocked
      ? resolvedDock === "left"
        ? getClassName("dockLeft")
        : getClassName("dockRight")
      : "";

    // Detect emptiness from Puck's node index via the slot render. We look at
    // the items render prop function name / arity isn't useful — easier: peek
    // at the DOM after mount. But cheaper is a simple puck.isEditing hint.
    const isEditing = !!(puck as { isEditing?: boolean } | undefined)?.isEditing;

    const offsetTop = (dockOffsetTop ?? "").trim() || "0px";

    // Base styles applied in both modes — width caps and background.
    const baseStyle: React.CSSProperties = {
      width: "100%",
      maxWidth: WIDTH_PX[width],
      minWidth: 0,
      background: BG_VAR[backgroundColor],
    };

    const dockedStyle: React.CSSProperties = isDocked
      ? {
          position: "fixed",
          top: offsetTop,
          [resolvedDock]: 0,
          bottom: 0,
          width: WIDTH_PX[width],
          maxWidth: WIDTH_PX[width],
          height: `calc(100vh - ${offsetTop})`,
          overflowY: "auto",
          zIndex: 40,
        }
      : {};

    const stickyStyle: React.CSSProperties = isSticky
      ? {
          position: "sticky",
          top: stickyTop,
          alignSelf: "flex-start",
        }
      : {};

    return (
      <aside
        className={`${getClassName()} ${modifierClass} ${dockClass}`
          .replace(/\s+/g, " ")
          .trim()}
        data-dock={resolvedDock}
        data-collapse-on-mobile={collapseAttr}
        style={{ ...baseStyle, ...dockedStyle, ...stickyStyle }}
      >
        {showTitle && resolvedTitle && (
          <div className={getClassName("header")}>
            <h3 className={getClassName("title")}>{resolvedTitle}</h3>
          </div>
        )}

        <div className={getClassName("body")}>
          <Items />
          {isEditing && (
            <div className={getClassName("emptyHint")} aria-hidden>
              Drop blocks here — nav, filters, promos…
            </div>
          )}
        </div>
      </aside>
    );
  },
};

export const Sidebar = withLayout(SidebarInternal);
