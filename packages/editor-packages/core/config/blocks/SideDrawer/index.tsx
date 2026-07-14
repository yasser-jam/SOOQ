"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Menu,
  X,
  Filter,
  ShoppingCart,
  User,
  PanelRightOpen,
  PanelLeftOpen,
} from "lucide-react";
import { ComponentConfig, Slot } from "@/core/types";
import { getClassNameFactory } from "@/core/lib";
import { WithLayout, withLayout } from "../../components/Layout";
import {
  bilingualTextField,
  pickLang,
  type BilingualString,
} from "../../fields/BilingualText";
import {
  linkField,
  resolveLinkHref,
  resolveLinkTarget,
  resolveLinkRel,
  EMPTY_LINK,
  type LinkValue,
} from "../../fields/LinkField";
import { createStarterTextBlock } from "../Section/starter-data";
import { applyMobileEditorFieldGroups } from "../../lib/mobile-field-groups";
import styles from "./styles.module.css";
const getClassName = getClassNameFactory("SideDrawer", styles);

/**
 * DSN-004n — SideDrawer
 *
 * A header-like shell, but for the sides of the page. Slides in from the
 * left or right edge with an animation, can be dismissed, hidden, and
 * carries a dedicated list of navigation buttons plus a free-form slot.
 *
 * Use cases this covers without a new block per use-case:
 *   - Mobile hamburger menu          (side: "left",  trigger: "button")
 *   - Filter / facets panel          (side: "right", trigger: "button")
 *   - Announcement side panel        (side: "right", trigger: "auto")
 *   - Mini-cart peek                 (side: "right", trigger: "external")
 *
 * External control: other blocks (e.g. a Header hamburger button) can call
 * `window.sooqDrawers.toggle("<name>")` or dispatch a `sooq:drawer:toggle`
 * CustomEvent with `detail.name`. Any element carrying
 * `data-sooq-drawer-toggle="<name>"` also toggles the drawer on click.
 *
 * JSON shape (abbreviated):
 *   {
 *     type: "SideDrawer",
 *     props: {
 *       name: "main-menu",
 *       title: { ar, en },
 *       side: "left" | "right",
 *       width: "narrow" | "medium" | "wide" | "fullscreen",
 *       animation: "slide" | "fade" | "scale" | "none",
 *       animationDuration: 260,
 *       trigger: "button" | "floating" | "auto" | "external",
 *       triggerLabel: { ar, en },
 *       triggerIcon: "menu" | "filter" | "cart" | "user" | "panel" | "none",
 *       overlay: true,
 *       overlayOpacity: 50,
 *       closeOnOverlayClick: true,
 *       closeOnEsc: true,
 *       showCloseButton: true,
 *       startOpen: false,
 *       visible: true,
 *       showOnMobile: true,
 *       showOnDesktop: true,
 *       links: [{ label, link }],
 *       items: Slot[],
 *     }
 *   }
 */

type DrawerLink = {
  label: BilingualString;
  link: LinkValue;
};

export type SideDrawerProps = WithLayout<{
  /** Stable identifier used for external toggles. */
  name: string;
  title: BilingualString;
  showTitle: boolean;

  side: "left" | "right";
  width: "narrow" | "medium" | "wide" | "fullscreen";

  animation: "slide" | "fade" | "scale" | "none";
  /** Animation duration in ms. */
  animationDuration: number;

  trigger: "button" | "floating" | "auto" | "external";
  triggerLabel: BilingualString;
  triggerIcon: "menu" | "filter" | "cart" | "user" | "panel" | "none";

  overlay: boolean;
  /** 0–100. Only used when `overlay` is true. */
  overlayOpacity: number;
  closeOnOverlayClick: boolean;
  closeOnEsc: boolean;
  showCloseButton: boolean;

  /** Whether the drawer is open on first mount (announcements / mobile-first nav). */
  startOpen: boolean;
  /** Master kill switch — hide the drawer & its trigger entirely. */
  visible: boolean;
  showOnMobile: boolean;
  showOnDesktop: boolean;

  links: DrawerLink[];
  items: Slot;
}>;

const WIDTH_PX: Record<SideDrawerProps["width"], string> = {
  narrow: "260px",
  medium: "320px",
  wide: "420px",
  fullscreen: "100vw",
};

const ICON_MAP: Record<
  SideDrawerProps["triggerIcon"],
  React.ComponentType<{ size?: number }> | null
> = {
  menu: Menu,
  filter: Filter,
  cart: ShoppingCart,
  user: User,
  panel: PanelRightOpen,
  none: null,
};

const linksField = {
  type: "array" as const,
  label: "أزرار التنقل",
  arrayFields: {
    label: bilingualTextField({ label: "Label" }),
    link: linkField({ label: "الوجهة" }),
  },
  defaultItemProps: {
    label: { ar: "عنصر", en: "Item" } as BilingualString,
    link: EMPTY_LINK as LinkValue,
  },
  getItemSummary: (item: DrawerLink) => pickLang(item.label) || "Item",
};

const SideDrawerInternal: ComponentConfig<SideDrawerProps> = {
  label: "درج جانبي",
  fields: {
    name: {
      type: "text",
      label: "اسم القائمة (للتبديل الخارجي)",
      placeholder: "e.g. main-menu",
    },
    title: bilingualTextField({ label: "Title" }),
    showTitle: {
      type: "radio",
      label: "إظهار العنوان",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    side: {
      type: "radio",
      label: "الجهة",
      options: [
        { label: "Left", value: "left" },
        { label: "Right", value: "right" },
      ],
    },
    width: {
      type: "select",
      label: "العرض",
      options: [
        { label: "Narrow (260px)", value: "narrow" },
        { label: "Medium (320px)", value: "medium" },
        { label: "Wide (420px)", value: "wide" },
        { label: "Full screen", value: "fullscreen" },
      ],
    },
    animation: {
      type: "select",
      label: "الحركة",
      options: [
        { label: "Slide (from side)", value: "slide" },
        { label: "Fade", value: "fade" },
        { label: "Scale", value: "scale" },
        { label: "None", value: "none" },
      ],
    },
    animationDuration: {
      type: "number",
      label: "مدة الحركة (مللي ثانية)",
      min: 0,
      max: 2000,
    },
    trigger: {
      type: "select",
      label: "كيفية الفتح",
      options: [
        { label: "Inline button in page flow", value: "button" },
        { label: "Floating button (fixed to edge)", value: "floating" },
        { label: "Auto-open on page load", value: "auto" },
        { label: "Controlled by another element", value: "external" },
      ],
    },
    triggerLabel: bilingualTextField({ label: "Trigger button label" }),
    triggerIcon: {
      type: "select",
      label: "أيقونة التشغيل",
      options: [
        { label: "Menu (hamburger)", value: "menu" },
        { label: "Filter", value: "filter" },
        { label: "Cart", value: "cart" },
        { label: "User", value: "user" },
        { label: "Panel", value: "panel" },
        { label: "None", value: "none" },
      ],
    },
    overlay: {
      type: "radio",
      label: "تعتيم الخلفية عند الفتح",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    overlayOpacity: {
      type: "number",
      label: "شفافية الطبقة (%)",
      min: 0,
      max: 100,
    },
    closeOnOverlayClick: {
      type: "radio",
      label: "إغلاق عند النقر على الطبقة",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    closeOnEsc: {
      type: "radio",
      label: "إغلاق عند ضغط ESC",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    showCloseButton: {
      type: "radio",
      label: "إظهار زر الإغلاق",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    startOpen: {
      type: "radio",
      label: "مفتوح عند تحميل الصفحة",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    visible: {
      type: "radio",
      label: "مرئي",
      options: [
        { label: "Yes", value: true },
        { label: "Hidden", value: false },
      ],
    },
    showOnMobile: {
      type: "radio",
      label: "إظهار على الجوال",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    showOnDesktop: {
      type: "radio",
      label: "إظهار على سطح المكتب",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    links: linksField,
    items: { type: "slot" },
  },
  defaultProps: {
    name: "main-menu",
    title: { ar: "القائمة", en: "Menu" },
    showTitle: true,
    side: "left",
    width: "medium",
    animation: "slide",
    animationDuration: 260,
    trigger: "button",
    triggerLabel: { ar: "القائمة", en: "Menu" },
    triggerIcon: "menu",
    overlay: true,
    overlayOpacity: 50,
    closeOnOverlayClick: true,
    closeOnEsc: true,
    showCloseButton: true,
    startOpen: false,
    visible: true,
    showOnMobile: true,
    showOnDesktop: true,
    layout: {
      // The drawer is a fixed overlay, not a document-flow band.
      grow: false,
    },
    links: [
      {
        label: { ar: "الرئيسية", en: "Home" },
        link: { kind: "page", pageId: "/" } as LinkValue,
      },
      {
        label: { ar: "المتجر", en: "Shop" },
        link: {
          kind: "page",
          pageId: "/products/example-product",
        } as LinkValue,
      },
      {
        label: { ar: "السلة", en: "Cart" },
        link: { kind: "page", pageId: "/cart" } as LinkValue,
      },
    ],
    items: [
      createStarterTextBlock(
        "Add menu links, a short promotion, or account actions inside this drawer."
      ),
    ],
  },
  resolveFields: (_data, params) =>
    applyMobileEditorFieldGroups(params.fields, params.metadata),
  render: ({
    name,
    title,
    showTitle,
    side,
    width,
    animation,
    animationDuration,
    trigger,
    triggerLabel,
    triggerIcon,
    overlay,
    overlayOpacity,
    closeOnOverlayClick,
    closeOnEsc,
    showCloseButton,
    startOpen,
    visible,
    showOnMobile,
    showOnDesktop,
    links,
    items: Items,
    puck,
  }) => {
    const isEditing = !!(puck as { isEditing?: boolean } | undefined)
      ?.isEditing;
    const drawerName = (name && name.trim()) || "drawer";
    const resolvedTitle = pickLang(title);
    const resolvedTriggerLabel = pickLang(triggerLabel);
    const IconCmp = ICON_MAP[triggerIcon ?? "menu"];

    // In the editor we force the drawer open so merchants can design its
    // contents visually. At runtime we honor startOpen. If hidden, render
    // nothing (except in the editor, where we still show an empty hint so
    // the block is not invisible).
    const [isOpen, setIsOpen] = useState<boolean>(
      isEditing ? true : !!startOpen
    );

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen((v) => !v), []);

    // Auto-open on first render when configured — only at runtime.
    useEffect(() => {
      if (!isEditing && trigger === "auto") open();
    }, [isEditing, trigger, open]);

    // ESC handling.
    useEffect(() => {
      if (!closeOnEsc || !isOpen || isEditing) return;
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") close();
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [closeOnEsc, isOpen, isEditing, close]);

    // Expose a tiny global API + DOM event + `data-sooq-drawer-toggle`
    // attribute so external elements (e.g. a hamburger button in the Header)
    // can open/close this drawer without any direct React wiring.
    const apiRef = useRef({ open, close, toggle });
    apiRef.current = { open, close, toggle };

    useEffect(() => {
      if (isEditing || typeof window === "undefined") return;

      const g = window as typeof window & {
        sooqDrawers?: Record<
          string,
          { open: () => void; close: () => void; toggle: () => void }
        >;
      };
      g.sooqDrawers = g.sooqDrawers || {};
      g.sooqDrawers[drawerName] = apiRef.current;

      const onEvent = (e: Event) => {
        const detail = (e as CustomEvent<{ name?: string; action?: string }>)
          .detail;
        if (!detail || detail.name !== drawerName) return;
        const action = detail.action || "toggle";
        if (action === "open") apiRef.current.open();
        else if (action === "close") apiRef.current.close();
        else apiRef.current.toggle();
      };
      document.addEventListener("sooq:drawer", onEvent as EventListener);

      const onClick = (e: MouseEvent) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const el = target.closest<HTMLElement>("[data-sooq-drawer-toggle]");
        if (!el) return;
        if (el.dataset.sooqDrawerToggle !== drawerName) return;
        e.preventDefault();
        const act = el.dataset.sooqDrawerAction || "toggle";
        if (act === "open") apiRef.current.open();
        else if (act === "close") apiRef.current.close();
        else apiRef.current.toggle();
      };
      document.addEventListener("click", onClick);

      return () => {
        document.removeEventListener("sooq:drawer", onEvent as EventListener);
        document.removeEventListener("click", onClick);
        if (g.sooqDrawers) delete g.sooqDrawers[drawerName];
      };
    }, [drawerName, isEditing]);

    // Visibility kill switch. In editor we still render so the merchant can
    // see the block; at runtime `visible: false` removes it entirely.
    if (!visible && !isEditing) return <></>;

    const deviceClass = [
      !showOnMobile ? getClassName("hideMobile") : "",
      !showOnDesktop ? getClassName("hideDesktop") : "",
    ]
      .filter(Boolean)
      .join(" ");

    const resolvedWidth = WIDTH_PX[width];
    const durationMs = Math.max(0, animationDuration ?? 260);

    const panelAnimClass =
      animation === "fade"
        ? getClassName("anim-fade")
        : animation === "scale"
        ? getClassName("anim-scale")
        : animation === "none"
        ? getClassName("anim-none")
        : getClassName("anim-slide");

    // Slide direction depends on which side the drawer lives on.
    const panelSideClass =
      side === "right" ? getClassName("side-right") : getClassName("side-left");

    const renderTrigger = () => {
      if (trigger !== "button" && trigger !== "floating") return null;
      const isFloating = trigger === "floating";
      const triggerClass = [
        getClassName("trigger"),
        isFloating ? getClassName("trigger--floating") : "",
        isFloating
          ? side === "right"
            ? getClassName("trigger--floating-right")
            : getClassName("trigger--floating-left")
          : "",
      ]
        .filter(Boolean)
        .join(" ");

      return (
        <button
          type="button"
          className={triggerClass}
          onClick={toggle}
          aria-expanded={isOpen}
          aria-controls={`sooq-drawer-${drawerName}`}
          aria-label={resolvedTriggerLabel || "Open menu"}
        >
          {IconCmp ? <IconCmp size={18} /> : null}
          {resolvedTriggerLabel && (
            <span className={getClassName("triggerLabel")}>
              {resolvedTriggerLabel}
            </span>
          )}
        </button>
      );
    };

    // Build the panel's inline style using the duration + width so merchants
    // get live preview updates without needing a stylesheet rebuild.
    const panelStyle: React.CSSProperties = {
      width: resolvedWidth,
      maxWidth: "100vw",
      transitionDuration: `${durationMs}ms`,
    };

    const overlayStyle: React.CSSProperties = {
      transitionDuration: `${durationMs}ms`,
      backgroundColor: `rgba(0, 0, 0, ${
        Math.min(100, Math.max(0, overlayOpacity ?? 50)) / 100
      })`,
    };

    // The overlay and panel MUST escape their React parent because every
    // ancestor Puck wrapper (DraggableComponent, dnd-kit sortable, zoom
    // transform on the canvas, etc.) can establish a CSS containing block
    // that hijacks `position: fixed`. Without a portal the panel ends up
    // pinned to its parent component rather than to the viewport/iframe
    // edge, which is exactly the "drops in the center" bug. Portalling to
    // the owning document's body fixes this for both the live site and the
    // editor iframe.
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
    const anchorRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
      const doc = anchorRef.current?.ownerDocument;
      if (doc?.body) setPortalTarget(doc.body);
    }, []);

    const panelContent = (
      <>
        {overlay && (
          <div
            className={`${getClassName("overlay")} ${
              isOpen ? getClassName("overlay--open") : ""
            }`}
            style={overlayStyle}
            onClick={() => {
              if (closeOnOverlayClick) close();
            }}
            data-sooq-drawer-overlay={drawerName}
            aria-hidden
          />
        )}

        <aside
          id={`sooq-drawer-${drawerName}`}
          className={`${getClassName(
            "panel"
          )} ${panelSideClass} ${panelAnimClass} ${
            isOpen ? getClassName("panel--open") : ""
          }`}
          style={panelStyle}
          data-sooq-drawer-panel={drawerName}
          role="dialog"
          aria-modal={isOpen ? "true" : "false"}
          aria-hidden={!isOpen}
        >
          <header className={getClassName("header")}>
            {showTitle && resolvedTitle ? (
              <h3 className={getClassName("title")}>{resolvedTitle}</h3>
            ) : (
              <span />
            )}
            {showCloseButton && (
              <button
                type="button"
                className={getClassName("close")}
                onClick={close}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            )}
          </header>

          {links && links.length > 0 && (
            <nav className={getClassName("nav")} aria-label={resolvedTitle}>
              {links.map((item, idx) => {
                const href = resolveLinkHref(item.link);
                const target = resolveLinkTarget(item.link);
                const rel = resolveLinkRel(item.link);
                const label = pickLang(item.label) || "—";

                if (!href) {
                  return (
                    <span key={idx} className={getClassName("navItem")}>
                      {label}
                    </span>
                  );
                }

                return (
                  <a
                    key={idx}
                    href={href}
                    target={target}
                    rel={rel}
                    className={getClassName("navItem")}
                    onClick={() => {
                      if (!isEditing) close();
                    }}
                  >
                    {label}
                  </a>
                );
              })}
            </nav>
          )}

          <div className={getClassName("body")}>
            <Items />
            {isEditing && (
              <div className={getClassName("emptyHint")} aria-hidden>
                Drop blocks here — custom content below the nav buttons…
              </div>
            )}
          </div>
        </aside>
      </>
    );

    return (
      <div
        ref={anchorRef}
        className={`${getClassName()} ${deviceClass}`.trim()}
        data-drawer-name={drawerName}
        data-drawer-side={side}
        data-drawer-open={isOpen ? "true" : "false"}
      >
        {renderTrigger()}

        {/* Editor-only helper so the merchant can still interact with the
            block when the drawer is closed. Not rendered at runtime. */}
        {isEditing && !isOpen && (
          <button
            type="button"
            className={getClassName("editorReopen")}
            onClick={open}
          >
            {side === "right" ? (
              <PanelRightOpen size={14} />
            ) : (
              <PanelLeftOpen size={14} />
            )}
            Reopen drawer
          </button>
        )}

        {/* Portal the overlay + panel to the document body so they anchor
            to the viewport, not to any transformed ancestor. */}
        {portalTarget ? createPortal(panelContent, portalTarget) : null}
      </div>
    );
  },
};

export const SideDrawer = withLayout(SideDrawerInternal);
