"use client";
import React, { CSSProperties } from "react";
import classnames from "classnames";
import { Menu, Filter, ShoppingCart, User } from "lucide-react";

import type { ShellVariant } from "../../theme";
import {
  resolveHrefLegacy,
  resolveLinkRel,
  resolveLinkTarget,
  type LinkValue,
} from "../../fields/LinkField";
import { stripStoreBasePath, withStoreBasePath } from "../../lib/store-base-path";
import responsiveStyles from "../../lib/zone-responsive.module.css";
import {
  ZONE_ACTION_ATTR,
  ZONE_TOGGLE_ATTR,
} from "../../lib/zone-events";

import { useZonePreviewSelected } from "../../lib/use-zone-preview-selected";
import selectionStyles from "../../lib/zone-selection.module.css";
import { useStore } from "../../store-context";
import {
  shouldShowForCondition,
  type ShowCondition,
} from "../../lib/show-condition";

import styles from "./styles.module.css";

export type HeaderDrawerIcon = "menu" | "filter" | "cart" | "user" | "none";

const DRAWER_ICON_MAP: Record<
  HeaderDrawerIcon,
  React.ComponentType<{ size?: number }> | null
> = {
  menu: Menu,
  filter: Filter,
  cart: ShoppingCart,
  user: User,
  none: null,
};

const normalizePath = (pathname: string) =>
  pathname.replace(/\/edit$/, "").replace(/\/$/, "") || "/";

const NavItem = ({
  label,
  link,
  href,
  editMode,
  variant,
  navStyle = "pill",
}: {
  label: string;
  link?: LinkValue;
  href: string;
  editMode: boolean;
  variant: ShellVariant;
  navStyle?: "underline" | "pill";
}) => {
  const navPath =
    typeof window !== "undefined"
      ? normalizePath(stripStoreBasePath(window.location.pathname))
      : "/";

  const resolvedHref = resolveHrefLegacy(link, href);
  const target = resolvedHref
    ? resolvedHref.replace(/\/edit$/, "").replace(/\/$/, "") || "/"
    : "";
  const isActive = !!resolvedHref && navPath === target;
  const targetAttr = resolveLinkTarget(link);
  const relAttr = resolveLinkRel(link);
  const underline = navStyle === "underline";
  const linkClass = classnames(
    variant === "commerce" ? styles.navLinkCommerce : styles.navLink,
    underline && styles.navLinkUnderline,
    isActive &&
      (variant === "commerce"
        ? styles.navLinkCommerceActive
        : underline
          ? styles.navLinkUnderlineActive
          : styles.navLinkActive)
  );

  if (!resolvedHref) {
    return <span className={linkClass}>{label}</span>;
  }

  if (editMode) {
    return <span className={linkClass}>{label}</span>;
  }

  return (
    <a
      href={resolvedHref}
      target={targetAttr}
      rel={relAttr}
      className={linkClass}
    >
      {label}
    </a>
  );
};

// Merchants can rewrite the header nav from Root fields. The shape is the same
// as NavMenu so an AI agent can swap the two without touching this component.
export type HeaderLink = {
  label: string;
  labelAr?: string;
  link?: LinkValue;
  /** Legacy field kept for older persisted JSON payloads. */
  href?: string;
  /** Auth visibility — persisted in Site JSON (`loggedIn` / `loggedOut` / `always`). */
  showCondition?: ShowCondition;
};

// Sensible defaults that match the demo: any new store sees something
// recognisable before the merchant edits the fields.
export const DEFAULT_HEADER_LINKS: HeaderLink[] = [
  {
    label: "Home",
    labelAr: "الرئيسية",
    link: { kind: "page", pageId: "/" },
  },
  {
    label: "Shop",
    labelAr: "المتجر",
    link: { kind: "page", pageId: "/products/example-product" },
  },
  {
    label: "Cart",
    labelAr: "السلة",
    link: { kind: "page", pageId: "/cart" },
  },
  {
    label: "Themes",
    labelAr: "القوالب",
    link: { kind: "page", pageId: "/themes" },
  },
];

export type HeaderProps = {
  editMode: boolean;
  variant?: ShellVariant;
  siteTitle?: string;
  /** Bilingual — resolved by Header based on `language`. */
  links?: HeaderLink[];
  language?: "ar" | "en";
  /** When false, the entire header band is hidden. */
  visible?: boolean;
  /** When true, header is shown only on mobile viewports. */
  isMobileOnly?: boolean;
  /** Optional brand href; defaults to "/". */
  brandHref?: string;
  /** CSS colour string (any valid CSS colour). Empty falls back to the theme. */
  backgroundColor?: string;
  textColor?: string;
  layoutMode?: "centered" | "split";
  menuAlign?: "start" | "end";
  navStyle?: "underline" | "pill";
  /**
   * When true, renders a hamburger/menu button on the start-edge of the
   * header. Clicking it toggles the site-wide drawer via its
   * `data-sooq-drawer-toggle` attribute — no JS wiring needed.
   */
  showDrawerButton?: boolean;
  drawerButtonIcon?: HeaderDrawerIcon;
  /** Which drawer name to toggle. Defaults to "site-drawer". */
  drawerName?: string;
  /** Optional action items (CartIconButton …) rendered at the end of the header */
  rightSlot?: React.ReactNode;
  /** Puck block id — used for zone-plugin selection highlight */
  componentId?: string;
};

const pickLabel = (link: HeaderLink, language: "ar" | "en"): string => {
  if (language === "ar" && link.labelAr && link.labelAr.trim())
    return link.labelAr;
  return link.label || "";
};

const Header = ({
  editMode,
  variant = "commerce",
  siteTitle = "Meridian",
  links,
  language = "ar",
  visible = true,
  isMobileOnly = false,
  brandHref = "/",
  backgroundColor,
  textColor,
  layoutMode = "split",
  menuAlign = "end",
  navStyle = "pill",
  showDrawerButton = false,
  drawerButtonIcon = "menu",
  drawerName = "site-drawer",
  rightSlot,
  componentId,
}: HeaderProps) => {
  const previewSelected = useZonePreviewSelected(componentId);
  const { auth } = useStore();
  if (!visible && !previewSelected) return null;

  const deviceClass = isMobileOnly ? responsiveStyles.hideOnDesktop : "";
  const resolvedLinks =
    Array.isArray(links) && links.length > 0 ? links : DEFAULT_HEADER_LINKS;
  const visibleLinks = resolvedLinks.filter((l) =>
    shouldShowForCondition(l.showCondition, auth.isLoggedIn, editMode)
  );

  const isTransparent =
    typeof backgroundColor === "string" &&
    backgroundColor.trim().toLowerCase() === "transparent";

  const rootStyle: CSSProperties = {};
  if (backgroundColor) rootStyle.background = backgroundColor;
  if (textColor) rootStyle.color = textColor;

  const DrawerIcon = DRAWER_ICON_MAP[drawerButtonIcon] ?? Menu;
  const drawerButton =
    showDrawerButton && DrawerIcon ? (
      <button
        type="button"
        className={styles.drawerToggle}
        {...{
          [ZONE_TOGGLE_ATTR]: drawerName,
          [ZONE_ACTION_ATTR]: "toggle",
        }}
        data-sooq-drawer-toggle={drawerName}
        data-sooq-drawer-action="toggle"
        aria-label="Open menu"
      >
        <DrawerIcon size={20} />
      </button>
    ) : null;

  const brandNode = editMode ? (
    <span className={styles.logo}>{siteTitle}</span>
  ) : (
    <a href={withStoreBasePath(brandHref || "/") ?? "/"} className={styles.logo}>
      {siteTitle}
    </a>
  );

  const navNode = (
    <nav
      className={classnames(
        styles.items,
        layoutMode === "centered" && styles.itemsCentered,
        layoutMode === "split" &&
          menuAlign === "start" &&
          styles.itemsAlignStart
      )}
    >
      {visibleLinks.map((l, i) => (
        <NavItem
          key={`${resolveHrefLegacy(l.link, l.href) ?? "none"}-${i}`}
          label={pickLabel(l, language)}
          link={l.link}
          href={l.href ?? ""}
          editMode={editMode}
          variant="default"
          navStyle={navStyle}
        />
      ))}
    </nav>
  );

  const rightActions = rightSlot ? (
    <div className={styles.rightActions}>{rightSlot}</div>
  ) : null;

  const chromeClass = previewSelected ? selectionStyles.selected : "";

  if (variant === "default") {
    return (
      <div
        className={classnames(
          styles.root,
          isTransparent && styles.rootTransparent,
          layoutMode === "centered" && styles.rootFixed,
          deviceClass,
          chromeClass
        )}
        style={rootStyle}
        data-zone-mobile-only={isMobileOnly || undefined}
      >
        <header
          className={classnames(
            styles.inner,
            layoutMode === "centered" && styles.innerCentered,
            layoutMode === "split" &&
              menuAlign === "start" &&
              styles.innerNavStart
          )}
        >
          {drawerButton}
          {layoutMode === "centered" ? (
            <>
              <div className={styles.brandSlot}>{brandNode}</div>
              {navNode}
              {rightActions}
            </>
          ) : menuAlign === "start" ? (
            <>
              {navNode}
              <div className={styles.brandSlotEnd}>{brandNode}</div>
              {rightActions}
            </>
          ) : (
            <>
              {brandNode}
              {navNode}
              {rightActions}
            </>
          )}
        </header>
      </div>
    );
  }

  return (
    <div
      className={classnames(styles.rootCommerce, deviceClass, chromeClass)}
      style={rootStyle}
      data-zone-mobile-only={isMobileOnly || undefined}
    >
      <header className={styles.innerCommerce}>
        {drawerButton}
        {editMode ? (
          <span className={styles.brand}>{siteTitle}</span>
        ) : (
          <a href={withStoreBasePath(brandHref || "/") ?? "/"} className={styles.brand}>
            {siteTitle}
          </a>
        )}
        <nav className={styles.navCommerce}>
          {visibleLinks.map((l, i) => (
            <NavItem
              key={`${resolveHrefLegacy(l.link, l.href) ?? "none"}-${i}`}
              label={pickLabel(l, language)}
              link={l.link}
              href={l.href ?? ""}
              editMode={editMode}
              variant="commerce"
              navStyle={navStyle}
            />
          ))}
        </nav>
        {rightActions}
      </header>
    </div>
  );
};

export { Header };
