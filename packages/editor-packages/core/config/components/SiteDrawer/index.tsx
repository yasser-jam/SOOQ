"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAppStore } from "@/core/store";
import {
  Menu,
  X,
  Filter,
  ShoppingCart,
  User,
  PanelRightOpen,
} from "lucide-react";
import {
  resolveHrefLegacy,
  resolveLinkRel,
  resolveLinkTarget,
  type LinkValue,
} from "../../fields/LinkField";

import styles from "./styles.module.css";

/**
 * SiteDrawer — the site-wide navigation drawer.
 *
 * This is NOT a Puck block: it's part of the site shell, driven entirely by
 * root.props and rendered directly from `root.tsx`. The merchant (or an AI
 * agent) configures it once in Settings and it applies to every page, which
 * is exactly how Shopify's side rail, a mobile hamburger menu, or an admin
 * nav panel behaves.
 *
 * Why a component, not a block:
 *   - Drawers are chrome, not content — they shouldn't live inside the
 *     page's DropZone and shouldn't be repositioned per-page.
 *   - Rendering from root escapes every Puck/dnd-kit wrapper that could
 *     establish a CSS containing block and trap `position: fixed`
 *     descendants mid-canvas (the original "drops in the center" bug).
 *   - Portalling to `ownerDocument.body` doubly guarantees the overlay +
 *     panel anchor to the iframe viewport in the editor and to the real
 *     viewport on the live site.
 */

export type SiteDrawerLink = {
  label: string;
  labelAr?: string;
  link?: LinkValue;
  /** Legacy field kept for older persisted JSON payloads. */
  href?: string;
};

export type SiteDrawerSide = "left" | "right";
export type SiteDrawerAnimation = "slide" | "fade" | "scale" | "none";
export type SiteDrawerIcon =
  | "menu"
  | "filter"
  | "cart"
  | "user"
  | "panel"
  | "none";
export type SiteDrawerTrigger = "floating" | "auto" | "external" | "none";

export type SiteDrawerProps = {
  id?: string;
  /** Unique name so external elements can open it with `data-sooq-drawer-toggle`. */
  name?: string;
  enabled?: boolean;
  side?: SiteDrawerSide;
  widthPx?: number;
  animation?: SiteDrawerAnimation;
  animationDurationMs?: number;

  /** How the drawer is opened on the live site. In the editor it's always
   *  forced open so the merchant can visualise their configuration. */
  trigger?: SiteDrawerTrigger;

  /** Displayed on the floating trigger button (if any). */
  triggerLabel?: string;
  triggerLabelAr?: string;
  triggerIcon?: SiteDrawerIcon;

  title?: string;
  titleAr?: string;
  showTitle?: boolean;

  /** Bilingual nav buttons — the drawer's main affordance. */
  links?: SiteDrawerLink[];

  /** Colours are plain CSS strings so the merchant can pick any value. */
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  triggerBackgroundColor?: string;
  triggerTextColor?: string;

  overlay?: boolean;
  overlayOpacityPercent?: number;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;

  startOpen?: boolean;
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
  /** Reveal drawer when the pointer reaches the screen edge. */
  openOnEdgeHover?: boolean;

  language?: "ar" | "en";
  /** When true, drawer runs in editor mode (non-navigating links, editor hints). */
  editMode?: boolean;
};

const ICON_MAP: Record<
  SiteDrawerIcon,
  React.ComponentType<{ size?: number }> | null
> = {
  menu: Menu,
  filter: Filter,
  cart: ShoppingCart,
  user: User,
  panel: PanelRightOpen,
  none: null,
};

const pickText = (
  en: string | undefined,
  ar: string | undefined,
  language: "ar" | "en"
): string => {
  if (language === "ar" && ar && ar.trim()) return ar;
  return en || "";
};

export const SiteDrawer = ({
  id,
  name = "site-drawer",
  enabled = true,
  side = "left",
  widthPx = 320,
  animation = "slide",
  animationDurationMs = 260,
  trigger = "external",
  triggerLabel = "Menu",
  triggerLabelAr = "القائمة",
  triggerIcon = "menu",
  title = "Menu",
  titleAr = "القائمة",
  showTitle = true,
  links = [],
  backgroundColor = "#ffffff",
  textColor = "#111827",
  accentColor = "#2563eb",
  triggerBackgroundColor = "#ffffff",
  triggerTextColor = "#111827",
  overlay = true,
  overlayOpacityPercent = 50,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  startOpen = false,
  showOnMobile = true,
  showOnDesktop = true,
  openOnEdgeHover = true,
  language = "ar",
  editMode = false,
}: SiteDrawerProps) => {
  const dispatch = useAppStore((s) => s.dispatch);
  const selectorKey = useAppStore((s) => {
    if (!editMode || typeof id !== "string" || !id) return "";

    const node = s.state.indexes.nodes[id];
    if (!node?.parentId || !node.zone) return "";

    const zoneCompound = `${node.parentId}:${node.zone}`;
    const zone = s.state.indexes.zones[zoneCompound];
    if (!zone) return "";

    const index = zone.contentIds.indexOf(id);
    if (index < 0) return "";

    return `${zoneCompound}|${index}`;
  });

  const selectDrawerInEditor = useCallback(() => {
    if (!editMode || !selectorKey) return;

    const separator = selectorKey.lastIndexOf("|");
    if (separator <= 0) return;

    const zone = selectorKey.slice(0, separator);
    const index = Number(selectorKey.slice(separator + 1));
    if (!zone || !Number.isFinite(index) || index < 0) return;

    dispatch({
      type: "setUi",
      ui: {
        itemSelector: { zone, index },
        plugin: { current: "fields" },
        leftSideBarVisible: true,
        rightSideBarVisible: false,
      },
    });
  }, [dispatch, editMode, selectorKey]);

  const handleEditorClickCapture = useCallback(
    (event: React.MouseEvent) => {
      if (!editMode) return;
      event.stopPropagation();
      selectDrawerInEditor();
    },
    [editMode, selectDrawerInEditor]
  );

  const [isOpen, setIsOpen] = useState<boolean>(!!startOpen);
  const closeTimerRef = useRef<number | null>(null);
  const edgeOpenedRef = useRef(false);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current == null) return;
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }, []);

  const open = useCallback((source: "edge" | "manual" = "manual") => {
    edgeOpenedRef.current = source === "edge";
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    clearCloseTimer();
    edgeOpenedRef.current = false;
    setIsOpen(false);
  }, [clearCloseTimer]);

  const toggle = useCallback(() => {
    clearCloseTimer();
    edgeOpenedRef.current = false;
    setIsOpen((v) => !v);
  }, [clearCloseTimer]);

  const scheduleCloseFromHover = useCallback(() => {
    if (editMode) return;
    if (!openOnEdgeHover || !edgeOpenedRef.current) return;
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      edgeOpenedRef.current = false;
      closeTimerRef.current = null;
    }, 420);
  }, [editMode, openOnEdgeHover, clearCloseTimer]);

  const openFromEdgeHover = useCallback(() => {
    if (!editMode && !openOnEdgeHover) return;
    clearCloseTimer();
    open("edge");
  }, [editMode, openOnEdgeHover, clearCloseTimer, open]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  const apiRef = useRef({ open, close, toggle });
  apiRef.current = { open, close, toggle };

  // ── External control surface ────────────────────────────────────────────
  // Headers, buttons, AI agents and anything else that wants to open/close
  // the drawer can do so without a React import:
  //   window.sooqDrawers.toggle("site-drawer")
  //   document.dispatchEvent(new CustomEvent("sooq:drawer",
  //     { detail: { name: "site-drawer", action: "open" } }))
  //   <button data-sooq-drawer-toggle="site-drawer">Menu</button>
  useEffect(() => {
    if (editMode || typeof window === "undefined") return;

    const g = window as typeof window & {
      sooqDrawers?: Record<
        string,
        { open: () => void; close: () => void; toggle: () => void }
      >;
    };
    g.sooqDrawers = g.sooqDrawers || {};
    g.sooqDrawers[name] = apiRef.current;

    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ name?: string; action?: string }>)
        .detail;
      if (!detail || detail.name !== name) return;
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
      if (el.dataset.sooqDrawerToggle !== name) return;
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
      if (g.sooqDrawers) delete g.sooqDrawers[name];
    };
  }, [name, editMode]);

  // ESC handling at runtime.
  useEffect(() => {
    if (!closeOnEsc || !isOpen || editMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [closeOnEsc, isOpen, editMode, close]);

  // Auto-open on load.
  useEffect(() => {
    if (!editMode && trigger === "auto") open();
  }, [editMode, trigger, open]);

  // Portal target — the OWNING document's body (iframe body in editor,
  // real document body on the live site). This is the fix for the
  // "drawer appears in the middle of the page" bug: position:fixed is
  // trapped by any ancestor with a transform (which Puck + dnd-kit
  // heavily rely on), so we escape to the document root.
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (typeof document === "undefined") return;
    // Prefer the anchor's owner document so we land inside the iframe in
    // the editor, not the outer window.
    const doc = anchorRef.current?.ownerDocument ?? document;
    if (doc.body) setPortalTarget(doc.body);
  }, []);

  const disabledInEditor = !enabled && editMode;

  if (!enabled && !editMode) return null;

  const resolvedTitle = pickText(title, titleAr, language);
  const resolvedTriggerLabel = pickText(triggerLabel, triggerLabelAr, language);
  const IconCmp = ICON_MAP[triggerIcon] ?? Menu;

  const deviceClass = [
    !showOnMobile ? styles.hideMobile : "",
    !showOnDesktop ? styles.hideDesktop : "",
  ]
    .filter(Boolean)
    .join(" ");

  const durationMs = Math.max(0, animationDurationMs);
  const sideClass = side === "right" ? styles.sideRight : styles.sideLeft;
  const panelIsOpen = isOpen;

  const animClass =
    animation === "fade"
      ? styles.animFade
      : animation === "scale"
      ? styles.animScale
      : animation === "none"
      ? styles.animNone
      : styles.animSlide;

  const panelStyle: React.CSSProperties = {
    width: `${Math.max(200, widthPx)}px`,
    maxWidth: "100vw",
    transitionDuration: `${durationMs}ms`,
    backgroundColor,
    color: textColor,
    // Expose accent as a CSS var so hover/active states can use it without
    // another prop drill.
    ["--sooq-drawer-accent" as any]: accentColor,
  };

  const overlayStyle: React.CSSProperties = {
    transitionDuration: `${durationMs}ms`,
    backgroundColor: `rgba(0, 0, 0, ${
      Math.min(100, Math.max(0, overlayOpacityPercent)) / 100
    })`,
  };

  const renderFloatingTrigger = () => {
    if (trigger !== "floating" || editMode) return null;
    const btnStyle: React.CSSProperties = {
      backgroundColor: triggerBackgroundColor,
      color: triggerTextColor,
    };
    const triggerClass = [
      styles.floatingTrigger,
      side === "right" ? styles.floatingRight : styles.floatingLeft,
      deviceClass,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <button
        type="button"
        className={triggerClass}
        style={btnStyle}
        onClick={toggle}
        aria-expanded={panelIsOpen}
        aria-controls={`sooq-drawer-${name}`}
        aria-label={resolvedTriggerLabel || "Open menu"}
      >
        {IconCmp ? <IconCmp size={18} /> : null}
        {resolvedTriggerLabel && (
          <span className={styles.floatingLabel}>{resolvedTriggerLabel}</span>
        )}
      </button>
    );
  };

  const edgeSensor = openOnEdgeHover || editMode ? (
    <div
      className={`${styles.edgeSensor} ${
        side === "right" ? styles.edgeRight : styles.edgeLeft
      } ${deviceClass}`}
      onMouseEnter={openFromEdgeHover}
      aria-hidden
    />
  ) : null;

  const panelContent = disabledInEditor ? (
    <div
      className={`${styles.root} ${deviceClass}`.trim()}
      data-drawer-name={name}
      onClickCapture={editMode ? handleEditorClickCapture : undefined}
    >
      {edgeSensor}
      <aside
        className={`${styles.disabledPanel} ${sideClass}`}
        style={{
          width: `${Math.max(200, widthPx)}px`,
          maxWidth: "100vw",
          backgroundColor,
          color: textColor,
        }}
      >
        <span className={styles.disabledTitle}>Side drawer is disabled222</span>
        <span className={styles.disabledHint}>Enable it from this component settings</span>
      </aside>
    </div>
  ) : (
    <div
      className={`${styles.root} ${deviceClass}`.trim()}
      data-drawer-name={name}
      onClickCapture={editMode ? handleEditorClickCapture : undefined}
    >
      {edgeSensor}
      {renderFloatingTrigger()}

      {overlay && !editMode && (
        <div
          className={`${styles.overlay} ${panelIsOpen ? styles.overlayOpen : ""}`}
          style={overlayStyle}
          onClick={() => {
            if (closeOnOverlayClick) close();
          }}
          data-sooq-drawer-overlay={name}
          aria-hidden
        />
      )}

      <aside
        id={`sooq-drawer-${name}`}
        className={`${styles.panel} ${sideClass} ${animClass} ${
          panelIsOpen ? styles.panelOpen : ""
        }`}
        style={panelStyle}
        onMouseEnter={clearCloseTimer}
        onMouseLeave={scheduleCloseFromHover}
        data-sooq-drawer-panel={name}
        role="dialog"
        aria-modal={panelIsOpen ? "true" : "false"}
        aria-hidden={!panelIsOpen}
      >
        {editMode && (
          <div className={styles.editorBadge} aria-hidden>
            <span className={styles.editorDot} />
            Live drawer preview — configure in Settings →
          </div>
        )}

        <header
          className={styles.header}
          style={{ borderColor: `${textColor}22` }}
        >
          {showTitle && resolvedTitle ? (
            <h3 className={styles.title}>{resolvedTitle}</h3>
          ) : (
            <span />
          )}
          {showCloseButton && (
            <button
              type="button"
              className={styles.close}
              onClick={close}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </header>

        {links && links.length > 0 && (
          <nav className={styles.nav} aria-label={resolvedTitle}>
            {links.map((item, idx) => {
              const label = pickText(item.label, item.labelAr, language) || "—";
              const href = resolveHrefLegacy(item.link, item.href);
              const targetAttr = resolveLinkTarget(item.link);
              const relAttr = resolveLinkRel(item.link);
              if (!href) {
                return (
                  <span key={idx} className={styles.navItem}>
                    {label}
                  </span>
                );
              }
              return (
                <a
                  key={idx}
                  href={editMode ? undefined : href}
                  target={targetAttr}
                  rel={relAttr}
                  className={styles.navItem}
                  onClick={(e) => {
                    if (editMode) {
                      e.preventDefault();
                      return;
                    }
                    close();
                  }}
                >
                  {label}
                </a>
              );
            })}
          </nav>
        )}
      </aside>
    </div>
  );

  return (
    <div ref={anchorRef} aria-hidden style={{ display: "contents" }}>
      {portalTarget ? createPortal(panelContent, portalTarget) : null}
    </div>
  );
};

// Sensible defaults shared with root.tsx so both the field panel and the
// render path agree on initial values.
export const DEFAULT_DRAWER_LINKS: SiteDrawerLink[] = [
  { label: "Home", labelAr: "الرئيسية", link: { kind: "page", pageId: "/" } },
  {
    label: "Shop",
    labelAr: "المتجر",
    link: { kind: "page", pageId: "/products/example-product" },
  },
  { label: "Cart", labelAr: "السلة", link: { kind: "page", pageId: "/cart" } },
];
