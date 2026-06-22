import React from "react";
import { ComponentConfig } from "@/core/types";
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
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("NavMenu", styles);

/**
 * DSN-004h — NavMenu
 *
 * Generic repeating list of navigation items. Designed to power:
 *   - site headers ("Shop", "About", "Contact")
 *   - footer link columns
 *   - breadcrumbs (variant="pill")
 *   - in-page quick nav (variant="plain")
 *
 * Each item is a bilingual label + a `LinkValue` (the same primitive used by
 * Button/ContentButton), so AI agents can rewrite menu destinations without
 * touching visual styling.
 *
 * JSON shape:
 *   {
 *     type: "NavMenu",
 *     props: {
 *       orientation: "horizontal" | "vertical",
 *       variant: "plain" | "pill" | "button",
 *       activePath: "/cart",   // optional — highlights the current page
 *       items: [
 *         { label: { ar, en }, link: LinkValue }
 *       ]
 *     }
 *   }
 */
export type NavMenuItem = {
  label: BilingualString;
  link: LinkValue;
};

export type NavMenuProps = WithLayout<{
  orientation: "horizontal" | "vertical";
  variant: "plain" | "pill" | "button";
  /**
   * Optional — when set, items whose resolved href matches this value get the
   * `active` styling. Page-kind links compare against their `pageId` so the
   * renderer can highlight the current page without extra plumbing.
   */
  activePath: string;
  items: NavMenuItem[];
}>;

const itemField = {
  type: "array" as const,
  label: "العناصر",
  arrayFields: {
    label: bilingualTextField({ label: "Label" }),
    link: linkField({ label: "الوجهة" }),
  },
  defaultItemProps: {
    label: { ar: "عنصر", en: "Item" } as BilingualString,
    link: EMPTY_LINK as LinkValue,
  },
  getItemSummary: (item: NavMenuItem) => pickLang(item.label) || "Item",
};

const NavMenuInternal: ComponentConfig<NavMenuProps> = {
  label: "قائمة التنقل",
  fields: {
    orientation: {
      type: "radio",
      label: "الاتجاه",
      options: [
        { label: "Horizontal", value: "horizontal" },
        { label: "Vertical", value: "vertical" },
      ],
    },
    variant: {
      type: "radio",
      label: "النمط",
      options: [
        { label: "Plain", value: "plain" },
        { label: "Pill", value: "pill" },
        { label: "Button", value: "button" },
      ],
    },
    activePath: {
      type: "text",
      label: "المسار النشط (اختياري)",
      placeholder: "e.g. /cart",
    },
    items: itemField,
  },
  defaultProps: {
    orientation: "horizontal",
    variant: "plain",
    activePath: "",
    items: [
      {
        label: { ar: "الرئيسية", en: "Home" },
        link: { kind: "page", pageId: "/" },
      },
      {
        label: { ar: "السلة", en: "Cart" },
        link: { kind: "page", pageId: "/cart" },
      },
    ],
  },
  render: ({ orientation, variant, activePath, items }) => {
    const isVertical = orientation === "vertical";

    return (
      <nav
        className={`${getClassName()} ${
          isVertical
            ? getClassName("vertical")
            : getClassName("horizontal")
        }`}
      >
        {items?.map((item, idx) => {
          const href = resolveLinkHref(item.link);
          const target = resolveLinkTarget(item.link);
          const rel = resolveLinkRel(item.link);
          const label = pickLang(item.label) || "—";
          const isActive =
            !!activePath &&
            !!href &&
            (href === activePath || item.link?.kind === "page" &&
              (item.link as { pageId?: string }).pageId === activePath);

          const itemClass = [
            getClassName("item"),
            variant === "pill" ? getClassName("item--pill") : "",
            variant === "button" ? getClassName("item--button") : "",
            isActive ? getClassName("item--active") : "",
          ]
            .filter(Boolean)
            .join(" ");

          if (!href) {
            // No destination — render as plain text, still clickable-looking.
            return (
              <span key={idx} className={itemClass}>
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
              className={itemClass}
              aria-current={isActive ? "page" : undefined}
            >
              {label}
            </a>
          );
        })}
      </nav>
    );
  },
};

export const NavMenu = withLayout(NavMenuInternal);
