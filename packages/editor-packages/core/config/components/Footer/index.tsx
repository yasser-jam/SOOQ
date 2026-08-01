"use client";
import React, { ReactNode, createContext, useContext } from "react";
import classnames from "classnames";
import { Section } from "../Section";
import type { ShellVariant } from "../../theme";
import {
  resolveHrefLegacy,
  resolveLinkRel,
  resolveLinkTarget,
  type LinkValue,
} from "../../fields/LinkField";
import {
  shouldShowForCondition,
  type ShowCondition,
} from "../../lib/show-condition";
import { useStore } from "../../store-context";

import selectionStyles from "../../lib/zone-selection.module.css";
import responsiveStyles from "../../lib/zone-responsive.module.css";
import { useZonePreviewSelected } from "../../lib/use-zone-preview-selected";
import {
  pickLang,
  type BilingualString,
} from "../../fields/BilingualText";
import { useDisplayLanguage } from "../../locale/use-display-language";
import styles from "./styles.module.css";

const FooterVariantContext = createContext<ShellVariant>("commerce");

const FooterLink = ({
  children,
  link,
  href,
  editMode,
}: {
  children: string;
  link?: LinkValue;
  href?: string;
  editMode?: boolean;
}) => {
  const variant = useContext(FooterVariantContext);
  const resolvedHref = resolveHrefLegacy(link, href);
  const targetAttr = resolveLinkTarget(link);
  const relAttr = resolveLinkRel(link);
  const className =
    variant === "commerce" ? styles.linkCommerce : styles.linkDefault;

  if (!resolvedHref || editMode) {
    return (
      <li className={styles.listItem}>
        <span className={className}>{children}</span>
      </li>
    );
  }

  return (
    <li className={styles.listItem}>
      <a
        href={resolvedHref}
        target={targetAttr}
        rel={relAttr}
        className={className}
      >
        {children}
      </a>
    </li>
  );
};

const FooterList = ({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) => {
  const variant = useContext(FooterVariantContext);
  return (
    <div>
      <h3
        className={
          variant === "commerce"
            ? styles.listTitleCommerce
            : styles.listTitleDefault
        }
      >
        {title}
      </h3>
      <ul className={styles.list}>{children}</ul>
    </div>
  );
};

export type FooterLinkData = {
  label: BilingualString | string;
  /** @deprecated Collapsed into `label` by normalizeEditorData. */
  labelAr?: string;
  link?: LinkValue;
  /** Legacy field kept for older persisted JSON payloads. */
  href?: string;
  /** Auth visibility — persisted in Site JSON (`loggedIn` / `loggedOut` / `always`). */
  showCondition?: ShowCondition;
};

export type FooterColumn = {
  title: BilingualString | string;
  /** @deprecated Collapsed into `title` by normalizeEditorData. */
  titleAr?: string;
  links: FooterLinkData[];
};

export const DEFAULT_FOOTER_BOTTOM_LINKS: FooterLinkData[] = [
  {
    label: { ar: "الخصوصية", en: "Privacy" },
    link: { kind: "page", pageId: "/privacy" },
  },
  {
    label: { ar: "الشروط", en: "Terms" },
    link: { kind: "page", pageId: "/terms" },
  },
];

export const DEFAULT_FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: { ar: "المتجر", en: "Shop" },
    links: [
      {
        label: { ar: "الرئيسية", en: "Home" },
        link: { kind: "page", pageId: "/" },
      },
      {
        label: { ar: "المنتجات", en: "Products" },
        link: { kind: "page", pageId: "/products/example-product" },
      },
      {
        label: { ar: "السلة", en: "Cart" },
        link: { kind: "page", pageId: "/cart" },
      },
    ],
  },
  {
    title: { ar: "استكشف", en: "Explore" },
    links: [
      {
        label: { ar: "القوالب", en: "Themes" },
        link: { kind: "page", pageId: "/themes" },
      },
      {
        label: { ar: "الأسعار", en: "Pricing" },
        link: { kind: "page", pageId: "/pricing" },
      },
      {
        label: { ar: "من نحن", en: "About" },
        link: { kind: "page", pageId: "/about" },
      },
    ],
  },
  {
    title: { ar: "الدعم", en: "Support" },
    links: [
      {
        label: { ar: "الشحن", en: "Shipping" },
        link: { kind: "anchor", hash: "shipping" },
      },
      {
        label: { ar: "الإرجاع", en: "Returns" },
        link: { kind: "anchor", hash: "returns" },
      },
      {
        label: { ar: "اتصل بنا", en: "Contact" },
        link: { kind: "anchor", hash: "contact" },
      },
    ],
  },
];

export type FooterProps = {
  children?: ReactNode;
  variant?: ShellVariant;
  siteTitle?: BilingualString | string;
  columns?: FooterColumn[];
  bottomLinks?: FooterLinkData[];
  language?: "ar" | "en";
  editMode?: boolean;
  visible?: boolean;
  /** When true, footer is shown only on mobile viewports. */
  isMobileOnly?: boolean;
  showBottomBar?: boolean;
  bottomBarText?: BilingualString | string;
  /** @deprecated Collapsed into `bottomBarText`. */
  bottomBarTextAr?: string;
  tagline?: BilingualString | string;
  /** @deprecated Collapsed into `tagline`. */
  taglineAr?: string;
  /** Any valid CSS colour. Empty falls back to the theme. */
  backgroundColor?: string;
  textColor?: string;
  componentId?: string;
};

/** Resolve bilingual or legacy en/ar sibling pair. */
const pickText = (
  value: BilingualString | string | undefined,
  legacyAr: string | undefined,
  language: "ar" | "en"
): string => {
  if (value && typeof value === "object") {
    return pickLang(value, language);
  }
  if (language === "ar" && legacyAr && legacyAr.trim()) return legacyAr;
  return typeof value === "string" ? value : "";
};

const Footer = ({
  children,
  variant = "commerce",
  siteTitle = "Meridian",
  columns,
  bottomLinks,
  language: languageProp = "ar",
  editMode = false,
  visible = true,
  isMobileOnly = false,
  showBottomBar = true,
  bottomBarText,
  bottomBarTextAr,
  tagline,
  taglineAr,
  backgroundColor,
  textColor,
  componentId,
}: FooterProps) => {
  const previewSelected = useZonePreviewSelected(componentId);
  const { auth } = useStore();
  const language = useDisplayLanguage(languageProp);
  if (!visible && !previewSelected) return null;

  const deviceClass = isMobileOnly ? responsiveStyles.hideOnDesktop : "";

  // Inline colour overrides. Only emit entries when the merchant provided a
  // value, so the themed defaults still apply when the fields are empty.
  const rootStyle: React.CSSProperties = {};
  if (backgroundColor) rootStyle.background = backgroundColor;
  if (textColor) rootStyle.color = textColor;

  const resolvedColumns =
    children == null
      ? Array.isArray(columns) && columns.length > 0
        ? columns
        : DEFAULT_FOOTER_COLUMNS
      : null;

  const resolvedBottomLinks =
    Array.isArray(bottomLinks) && bottomLinks.length > 0
      ? bottomLinks
      : DEFAULT_FOOTER_BOTTOM_LINKS;

  const renderedChildren =
    children ??
    (resolvedColumns
      ? resolvedColumns.map((col, ci) => {
          const visibleLinks = (col.links ?? []).filter((lnk) =>
            shouldShowForCondition(lnk.showCondition, auth.isLoggedIn, editMode)
          );
          if (visibleLinks.length === 0) return null;
          return (
            <FooterList
              key={`col-${ci}`}
              title={pickText(col.title, col.titleAr, language)}
            >
              {visibleLinks.map((lnk, li) => (
                <FooterLink
                  key={`${resolveHrefLegacy(lnk.link, lnk.href) ?? "none"}-${li}`}
                  link={lnk.link}
                  href={lnk.href}
                  editMode={editMode}
                >
                  {pickText(lnk.label, lnk.labelAr, language)}
                </FooterLink>
              ))}
            </FooterList>
          );
        })
      : null);

  const resolvedTagline =
    pickText(tagline, taglineAr, language) ||
    (language === "ar"
      ? "سلع مختارة بعناية — منسّقة وفق القوالب والإعدادات."
      : "Curated goods — styled with your theme tokens and shell layout from Settings.");
  const chromeClass = previewSelected ? selectionStyles.selected : "";
  if (variant === "default") {
    return (
      <FooterVariantContext.Provider value="default">
        <footer
          className={classnames(styles.rootDefault, deviceClass, chromeClass)}
          style={rootStyle}
          data-zone-mobile-only={isMobileOnly || undefined}
        >
          <h2 className={styles.visuallyHidden}>Footer</h2>
          <div className={styles.innerPadDefault}>
            <Section>
              <div className={styles.gridDefault}>{renderedChildren}</div>
            </Section>
          </div>
          <div className={styles.bottomBarDefault}>
            Made with{" "}
            <a
              href="https://github.com/puckeditor/puck"
              target="_blank"
              rel="noreferrer"
              className={styles.bottomLinkDefault}
            >
              Puck
            </a>
          </div>
        </footer>
      </FooterVariantContext.Provider>
    );
  }

  return (
    <FooterVariantContext.Provider value="commerce">
      <footer
        className={classnames(styles.rootCommerce, deviceClass, chromeClass)}
        style={rootStyle}
        data-zone-mobile-only={isMobileOnly || undefined}
      >
        <div className={styles.innerCommerce}>
          <div className={styles.gridCommerce}>
            <div className={styles.brandCol}>
              <span className={styles.brandName}>
                {pickLang(siteTitle, language) || "Meridian"}
              </span>
              <p className={styles.brandTagline}>{resolvedTagline}</p>
            </div>
            {renderedChildren}
          </div>
        </div>
        {showBottomBar && (
          <div className={styles.bottomBarCommerce}>
            <span>
              {pickText(bottomBarText, bottomBarTextAr, language) ||
                `© ${new Date().getFullYear()} ${pickLang(siteTitle, language) || "Meridian"}`}
            </span>
            <span className={styles.bottomSep}>·</span>
            {resolvedBottomLinks.map((item, index) => {
              const label = pickText(item.label, item.labelAr, language);
              const href = resolveHrefLegacy(item.link, item.href);
              const targetAttr = resolveLinkTarget(item.link);
              const relAttr = resolveLinkRel(item.link);

              if (editMode || !href) {
                return (
                  <span
                    key={`footer-bottom-${index}`}
                    className={styles.bottomLinkCommerce}
                  >
                    {label}
                  </span>
                );
              }

              return (
                <a
                  key={`footer-bottom-${index}`}
                  href={href}
                  target={targetAttr}
                  rel={relAttr}
                  className={styles.bottomLinkCommerce}
                >
                  {label}
                </a>
              );
            })}
          </div>
        )}
      </footer>
    </FooterVariantContext.Provider>
  );
};

Footer.List = FooterList;
Footer.Link = FooterLink;

export { Footer };
