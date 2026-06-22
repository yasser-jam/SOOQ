"use client";
import React, { ReactNode, createContext, useContext } from "react";
import { Section } from "../Section";
import type { ShellVariant } from "../../theme";
import {
  resolveHrefLegacy,
  resolveLinkRel,
  resolveLinkTarget,
  type LinkValue,
} from "../../fields/LinkField";

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
  label: string;
  labelAr?: string;
  link?: LinkValue;
  /** Legacy field kept for older persisted JSON payloads. */
  href?: string;
};

export type FooterColumn = {
  title: string;
  titleAr?: string;
  links: FooterLinkData[];
};

export const DEFAULT_FOOTER_BOTTOM_LINKS: FooterLinkData[] = [
  {
    label: "Privacy",
    labelAr: "الخصوصية",
    link: { kind: "page", pageId: "/privacy" },
  },
  {
    label: "Terms",
    labelAr: "الشروط",
    link: { kind: "page", pageId: "/terms" },
  },
];

export const DEFAULT_FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Shop",
    titleAr: "المتجر",
    links: [
      {
        label: "Home",
        labelAr: "الرئيسية",
        link: { kind: "page", pageId: "/" },
      },
      {
        label: "Products",
        labelAr: "المنتجات",
        link: { kind: "page", pageId: "/products/example-product" },
      },
      {
        label: "Cart",
        labelAr: "السلة",
        link: { kind: "page", pageId: "/cart" },
      },
    ],
  },
  {
    title: "Explore",
    titleAr: "استكشف",
    links: [
      {
        label: "Themes",
        labelAr: "القوالب",
        link: { kind: "page", pageId: "/themes" },
      },
      {
        label: "Pricing",
        labelAr: "الأسعار",
        link: { kind: "page", pageId: "/pricing" },
      },
      {
        label: "About",
        labelAr: "من نحن",
        link: { kind: "page", pageId: "/about" },
      },
    ],
  },
  {
    title: "Support",
    titleAr: "الدعم",
    links: [
      {
        label: "Shipping",
        labelAr: "الشحن",
        link: { kind: "anchor", hash: "shipping" },
      },
      {
        label: "Returns",
        labelAr: "الإرجاع",
        link: { kind: "anchor", hash: "returns" },
      },
      {
        label: "Contact",
        labelAr: "اتصل بنا",
        link: { kind: "anchor", hash: "contact" },
      },
    ],
  },
];

export type FooterProps = {
  children?: ReactNode;
  variant?: ShellVariant;
  siteTitle?: string;
  columns?: FooterColumn[];
  bottomLinks?: FooterLinkData[];
  language?: "ar" | "en";
  editMode?: boolean;
  visible?: boolean;
  showBottomBar?: boolean;
  bottomBarText?: string;
  bottomBarTextAr?: string;
  tagline?: string;
  taglineAr?: string;
  /** Any valid CSS colour. Empty falls back to the theme. */
  backgroundColor?: string;
  textColor?: string;
};

const pickText = (
  en: string | undefined,
  ar: string | undefined,
  language: "ar" | "en"
): string => {
  if (language === "ar" && ar && ar.trim()) return ar;
  return en || "";
};

const Footer = ({
  children,
  variant = "commerce",
  siteTitle = "Meridian",
  columns,
  bottomLinks,
  language = "ar",
  editMode = false,
  visible = true,
  showBottomBar = true,
  bottomBarText,
  bottomBarTextAr,
  tagline,
  taglineAr,
  backgroundColor,
  textColor,
}: FooterProps) => {
  if (!visible) return null;

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
      ? resolvedColumns.map((col, ci) => (
          <FooterList
            key={`${col.title}-${ci}`}
            title={pickText(col.title, col.titleAr, language) || col.title}
          >
            {col.links.map((lnk, li) => (
              <FooterLink
                key={`${resolveHrefLegacy(lnk.link, lnk.href) ?? "none"}-${li}`}
                link={lnk.link}
                href={lnk.href}
                editMode={editMode}
              >
                {pickText(lnk.label, lnk.labelAr, language) || lnk.label}
              </FooterLink>
            ))}
          </FooterList>
        ))
      : null);

  const resolvedTagline =
    pickText(tagline, taglineAr, language) ||
    (language === "ar"
      ? "سلع مختارة بعناية — منسّقة وفق القوالب والإعدادات."
      : "Curated goods — styled with your theme tokens and shell layout from Settings.");
  if (variant === "default") {
    return (
      <FooterVariantContext.Provider value="default">
        <footer className={styles.rootDefault} style={rootStyle}>
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
      <footer className={styles.rootCommerce} style={rootStyle}>
        <div className={styles.innerCommerce}>
          <div className={styles.gridCommerce}>
            <div className={styles.brandCol}>
              <span className={styles.brandName}>{siteTitle}</span>
              <p className={styles.brandTagline}>{resolvedTagline}</p>
            </div>
            {renderedChildren}
          </div>
        </div>
        {showBottomBar && (
          <div className={styles.bottomBarCommerce}>
            <span>
              {pickText(bottomBarText, bottomBarTextAr, language) ||
                `© ${new Date().getFullYear()} ${siteTitle}`}
            </span>
            <span className={styles.bottomSep}>·</span>
            {resolvedBottomLinks.map((item, index) => {
              const label =
                pickText(item.label, item.labelAr, language) || item.label;
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
