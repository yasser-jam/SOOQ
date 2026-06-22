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
}: {
  label: string;
  link?: LinkValue;
  href: string;
  editMode: boolean;
  variant: ShellVariant;
}) => {
  const navPath =
    typeof window !== "undefined"
      ? normalizePath(window.location.pathname)
      : "/";

  const resolvedHref = resolveHrefLegacy(link, href);
  const target = resolvedHref
    ? resolvedHref.replace(/\/edit$/, "").replace(/\/$/, "") || "/"
    : "";
  const isActive = !!resolvedHref && navPath === target;
  const targetAttr = resolveLinkTarget(link);
  const relAttr = resolveLinkRel(link);

  if (!resolvedHref) {
    if (variant === "commerce") {
      return <span className={styles.navLinkCommerce}>{label}</span>;
    }

    return <span className={styles.navLink}>{label}</span>;
  }

  if (editMode) {
    if (variant === "commerce") {
      return (
        <span
          className={classnames(
            styles.navLinkCommerce,
            isActive && styles.navLinkCommerceActive
          )}
        >
          {label}
        </span>
      );
    }

    return (
      <span
        className={classnames(styles.navLink, isActive && styles.navLinkActive)}
      >
        {label}
      </span>
    );
  }

  if (variant === "commerce") {
    return (
      <a
        href={resolvedHref}
        target={targetAttr}
        rel={relAttr}
        className={classnames(
          styles.navLinkCommerce,
          isActive && styles.navLinkCommerceActive
        )}
      >
        {label}
      </a>
    );
  }

  return (
    <a
      href={resolvedHref}
      target={targetAttr}
      rel={relAttr}
      className={classnames(styles.navLink, isActive && styles.navLinkActive)}
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
  /** Optional brand href; defaults to "/". */
  brandHref?: string;
  /** CSS colour string (any valid CSS colour). Empty falls back to the theme. */
  backgroundColor?: string;
  textColor?: string;
  /**
   * When true, renders a hamburger/menu button on the start-edge of the
   * header. Clicking it toggles the site-wide drawer via its
   * `data-sooq-drawer-toggle` attribute — no JS wiring needed.
   */
  showDrawerButton?: boolean;
  drawerButtonIcon?: HeaderDrawerIcon;
  /** Which drawer name to toggle. Defaults to "site-drawer". */
  drawerName?: string;
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
  brandHref = "/",
  backgroundColor,
  textColor,
  showDrawerButton = false,
  drawerButtonIcon = "menu",
  drawerName = "site-drawer",
}: HeaderProps) => {
  if (!visible) return null;

  const resolvedLinks =
    Array.isArray(links) && links.length > 0 ? links : DEFAULT_HEADER_LINKS;

  // Inline-colour overrides. We only emit the style entry when a colour is
  // provided so that the themed defaults (CSS variables on :root) still take
  // effect when the merchant leaves the field empty.
  const rootStyle: CSSProperties = {};
  if (backgroundColor) rootStyle.background = backgroundColor;
  if (textColor) rootStyle.color = textColor;

  const DrawerIcon = DRAWER_ICON_MAP[drawerButtonIcon] ?? Menu;
  const drawerButton =
    showDrawerButton && DrawerIcon ? (
      <button
        type="button"
        className={styles.drawerToggle}
        data-sooq-drawer-toggle={drawerName}
        data-sooq-drawer-action="toggle"
        aria-label="Open menu"
      >
        <DrawerIcon size={20} />
      </button>
    ) : null;

  if (variant === "default") {
    return (
      <div className={styles.root} style={rootStyle}>
        <header className={styles.inner}>
          {drawerButton}
          {editMode ? (
            <span className={styles.logo}>{siteTitle}</span>
          ) : (
            <a href={brandHref || "/"} className={styles.logo}>
              {siteTitle}
            </a>
          )}
          <nav className={styles.items}>
            {resolvedLinks.map((l, i) => (
              <NavItem
                key={`${resolveHrefLegacy(l.link, l.href) ?? "none"}-${i}`}
                label={pickLabel(l, language)}
                link={l.link}
                href={l.href ?? ""}
                editMode={editMode}
                variant="default"
              />
            ))}
          </nav>
        </header>
      </div>
    );
  }

  return (
    <div className={styles.rootCommerce} style={rootStyle}>
      <header className={styles.innerCommerce}>
        {drawerButton}
        {editMode ? (
          <span className={styles.brand}>{siteTitle}</span>
        ) : (
          <a href={brandHref || "/"} className={styles.brand}>
            {siteTitle}
          </a>
        )}
        <nav className={styles.navCommerce}>
          {resolvedLinks.map((l, i) => (
            <NavItem
              key={`${resolveHrefLegacy(l.link, l.href) ?? "none"}-${i}`}
              label={pickLabel(l, language)}
              link={l.link}
              href={l.href ?? ""}
              editMode={editMode}
              variant="commerce"
            />
          ))}
        </nav>
      </header>
    </div>
  );
};

export { Header };
