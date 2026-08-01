"use client";

import React, { CSSProperties, lazy, Suspense, useMemo } from "react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { ComponentConfig, Fields } from "@/core/types";
import { WithLayout, withLayout } from "../../components/Layout";
import { resolveColor, colorField } from "../../content/color-fields";
import { TEXT_SIZE_OPTIONS, resolveFontSize } from "../../content/typography-fields";
import { themeFixedSelectField } from "../../fields/ThemeFixedSelect";
import {
  linkField,
  resolveLinkHref,
  resolveLinkRel,
  resolveLinkTarget,
  EMPTY_LINK,
  type LinkValue,
} from "../../fields/LinkField";
import { useBoundData } from "../../binding";
import { getClassNameFactory } from "@/core/lib";
import styles from "./styles.module.css";
import { createAlignField } from "../../fields/AlignField";
import {
  bilingualTextField,
  pickLang,
  type BilingualString,
} from "../../fields/BilingualText";
import { useActiveLanguage } from "../../locale/LanguageContext";

const getClassName = getClassNameFactory("ContentLink", styles);

export const LINK_ICON_PRESETS = [
  { label: "بدون", value: "none" },
  { label: "رابط", value: "link" },
  { label: "رابط خارجي", value: "external-link" },
  { label: "سهم يمين", value: "arrow-right" },
  { label: "سهم يسار", value: "arrow-left" },
  { label: "شيفرون يمين", value: "chevron-right" },
  { label: "شيفرون يسار", value: "chevron-left" },
  { label: "بريد", value: "mail" },
  { label: "هاتف", value: "phone" },
  { label: "موقع", value: "map-pin" },
  { label: "سلة", value: "shopping-bag" },
  { label: "مفضلة", value: "heart" },
  { label: "نجمة", value: "star" },
  { label: "رئيسية", value: "home" },
  { label: "مستخدم", value: "user" },
] as const;

const iconComponents = Object.keys(dynamicIconImports).reduce<
  Record<string, React.LazyExoticComponent<React.ComponentType<{ size?: number }>>>
>((acc, iconName) => {
  acc[iconName] = lazy((dynamicIconImports as Record<string, () => Promise<{ default: React.ComponentType<{ size?: number }> }>>)[iconName]);
  return acc;
}, {});

const FALLBACK_ICON = "link";

function resolveIconComponent(icon: string | undefined) {
  if (!icon || icon === "none") return null;
  return (
    iconComponents[icon] ??
    iconComponents[FALLBACK_ICON] ??
    null
  );
}

export type LinkHoverEffect = "none" | "underline" | "border" | "color" | "both";

export type ContentLinkProps = WithLayout<{
  title: BilingualString | string;
  link: LinkValue;
  align: "left" | "center" | "right";
  color: string;
  hoverColor: string;
  hoverEffect: LinkHoverEffect;
  fontSize: string;
  icon: string;
  iconPosition: "start" | "end";
}>;

const alignField = createAlignField({ defaultValue: "right" });

const HOVER_EFFECT_OPTIONS = [
  { label: "بدون", value: "none" },
  { label: "تسطير", value: "underline" },
  { label: "حد سفلي", value: "border" },
  { label: "تغيير اللون", value: "color" },
  { label: "تسطير + لون", value: "both" },
] as const;

const ContentLinkInner: ComponentConfig<ContentLinkProps> = {
  label: "رابط",
  fields: {
    title: bilingualTextField({ label: "العنوان", contentEditable: true }),
    link: linkField({ label: "الرابط" }),
    align: alignField,
    color: colorField,
    hoverEffect: {
      type: "select",
      label: "تأثير التمرير",
      options: [...HOVER_EFFECT_OPTIONS],
    },
    hoverColor: colorField,
    fontSize: themeFixedSelectField({
      label: "حجم الخط",
      themeOptions: TEXT_SIZE_OPTIONS,
      type: "number",
      placeholder: "القيمة بالبكسل",
    }),
    icon: {
      type: "select",
      label: "أيقونة",
      options: [...LINK_ICON_PRESETS],
    },
    iconPosition: {
      type: "radio",
      label: "موضع الأيقونة",
      options: [
        { label: "قبل النص", value: "start" },
        { label: "بعد النص", value: "end" },
      ],
    },
  },
  defaultProps: {
    title: { ar: "رابط", en: "Link" },
    link: EMPTY_LINK,
    align: "right",
    color: "theme-primary",
    hoverColor: "theme-text",
    hoverEffect: "underline",
    fontSize: "theme-md",
    icon: "none",
    iconPosition: "end",
  },
  resolveFields: (data, { fields }) => {
    const hoverEffect = data.props.hoverEffect ?? "underline";
    const icon = data.props.icon ?? "none";
    const showHoverColor = hoverEffect === "color" || hoverEffect === "both";
    const showIconPosition = icon !== "none";

    const result: Record<string, unknown> = { ...fields };
    if (!showHoverColor) delete result.hoverColor;
    if (!showIconPosition) delete result.iconPosition;
    return result as Fields<ContentLinkProps>;
  },
  render: ({
    title,
    link,
    align,
    color,
    hoverColor,
    hoverEffect,
    fontSize,
    icon,
    iconPosition,
    puck,
  }) => {
    const { language } = useActiveLanguage();
    const displayTitle = pickLang(title, language);
    const { data: boundData } = useBoundData();
    const resolvedHref = resolveLinkHref(link, { boundData, locale: language }) ?? "#";
    const target = resolveLinkTarget(link);
    const rel = resolveLinkRel(link);
    const isEditing = puck?.isEditing === true;

    const anchorStyle = useMemo(() => {
      const style: CSSProperties & Record<string, string> = {
        "--content-link-color": resolveColor(color ?? "theme-primary"),
        "--content-link-font-size": resolveFontSize(fontSize ?? "theme-md"),
      };

      if (hoverEffect === "color" || hoverEffect === "both" || hoverEffect === "border") {
        style["--content-link-hover-color"] = resolveColor(
          hoverColor ?? "theme-text"
        );
      }

      return style;
    }, [color, fontSize, hoverColor, hoverEffect]);

    const IconComponent = resolveIconComponent(icon);
    const iconSize =
      fontSize && !fontSize.startsWith("theme-")
        ? Math.max(12, Math.min(28, parseInt(fontSize, 10) || 16))
        : 16;

    const iconNode =
      IconComponent && icon !== "none" ? (
        <span className={getClassName("icon")} aria-hidden>
          <Suspense fallback={null}>
            <IconComponent size={iconSize} />
          </Suspense>
        </span>
      ) : null;

    return (
      <div className={getClassName()}>
        <div
          className={[
            getClassName("inner"),
            getClassName(`inner--align-${align ?? "right"}`),
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <a
            href={isEditing ? "#" : resolvedHref}
            target={isEditing ? undefined : target}
            rel={isEditing ? undefined : rel}
            onClick={isEditing ? (e) => e.preventDefault() : undefined}
            className={[
              getClassName("anchor"),
              hoverEffect && hoverEffect !== "none"
                ? getClassName(`anchor--hover-${hoverEffect}`)
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={anchorStyle}
          >
            {iconPosition === "start" ? iconNode : null}
            <span className={getClassName("label")}>{displayTitle}</span>
            {iconPosition === "end" ? iconNode : null}
          </a>
        </div>
      </div>
    );
  },
};

export const ContentLink = withLayout(ContentLinkInner);
