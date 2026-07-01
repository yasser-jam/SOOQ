"use client";
import React, { CSSProperties, MouseEvent } from "react";
import { ComponentConfig, Fields } from "@/core/types";
import { WithLayout, withLayout, hideLayoutBorder } from "../../components/Layout";
import { buttonSizeVars, ButtonSizeStep } from "../../theme";
import { RADIUS_OPTIONS, resolveRadius } from "../../content/typography-fields";
import { resolveColor, colorField } from "../../content/color-fields";
import {
  type ButtonAction,
  BUTTON_FUNCTIONAL_ACTION_OPTIONS,
  buttonActionLabel,
} from "../../content/button-actions";
import {
  linkField,
  resolveLinkHref,
  resolveLinkTarget,
  resolveLinkRel,
  EMPTY_LINK,
  type LinkValue,
} from "../../fields/LinkField";
import { themeFixedSelectField } from "../../fields/ThemeFixedSelect";
import type { ValueContext } from "../../binding";
import {
  buildProductActionDetail,
  dispatchProductCardEvent,
  useBoundData,
  useBoundValue,
} from "../../binding";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";

export type ContentButtonProps = WithLayout<{
  label: string;
  labelValueContext?: ValueContext | null;
  align: "left" | "center" | "right";
  destinationType: "link" | "action";
  buttonAction: ButtonAction;
  link: LinkValue;
  buttonVariantMode: "variant" | "fixed";
  buttonVariant: "primary" | "secondary" | "error";
  buttonVariantSize: "sm" | "md" | "lg";
  radius: string;
  bgColor: string;
  textColor: string;
  buttonSize: string;
}>;

const buttonSizeThemeOptions = [
  { label: "صغير", value: "sm" },
  { label: "متوسط", value: "md" },
  { label: "كبير", value: "lg" },
];

const BUTTON_FLOAT_PRESETS = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;

const alignField = {
  type: "custom" as const,
  label: "المحاذاة",
  render: ({
    value,
    onChange,
    Label,
    label,
    readOnly,
  }: {
    value: string;
    onChange: (v: string) => void;
    Label: React.FC<{ label?: string; readOnly?: boolean; children?: React.ReactNode }>;
    label?: string;
    readOnly?: boolean;
  }) => {
    const current = value ?? "center";
    const options = [
      { value: "right", icon: <AlignRight size={18} />, label: "يمين" },
      { value: "center", icon: <AlignCenter size={18} />, label: "وسط" },
      { value: "left", icon: <AlignLeft size={18} />, label: "يسار" },
    ];
    return (
      <Label label={label} readOnly={readOnly}>
        <div style={{ display: "flex", gap: 6 }}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              title={opt.label}
              disabled={readOnly}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 32,
                border: current === opt.value ? "2px solid #3b82f6" : "1px solid #d1d5db",
                borderRadius: 6,
                background: current === opt.value ? "#eff6ff" : "#fff",
                cursor: readOnly ? "not-allowed" : "pointer",
                opacity: readOnly ? 0.5 : 1,
                color: current === opt.value ? "#3b82f6" : "#6b7280",
              }}
            >
              {opt.icon}
            </button>
          ))}
        </div>
      </Label>
    );
  },
};

function resolveButtonSize(value: string): CSSProperties {
  if (!value) return buttonSizeVars("md");
  const themeMatch = value.match(/^theme-(.+)$/);
  if (themeMatch) {
    return buttonSizeVars(themeMatch[1] as ButtonSizeStep);
  }
  const parts = value.split("|");
  if (parts.length === 4) {
    const [height, padX, padY, fontSize] = parts;
    return {
      height: height ? `${height}px` : "44px",
      paddingLeft: padX ? `${padX}px` : "18px",
      paddingRight: padX ? `${padX}px` : "18px",
      paddingTop: padY ? `${padY}px` : "9px",
      paddingBottom: padY ? `${padY}px` : "9px",
      fontSize: fontSize ? `${fontSize}px` : "16px",
    };
  }
  return buttonSizeVars("md");
}

function getVariantColors(variant: string): { bg: string; fg: string } {
  const map: Record<string, { bg: string; fg: string }> = {
    primary: {
      bg: "var(--theme-button-variant-primary-bg)",
      fg: "var(--theme-button-variant-primary-fg)",
    },
    secondary: {
      bg: "var(--theme-button-variant-secondary-bg)",
      fg: "var(--theme-button-variant-secondary-fg)",
    },
    error: {
      bg: "var(--theme-button-variant-error-bg)",
      fg: "var(--theme-button-variant-error-fg)",
    },
  };
  return map[variant] ?? map.primary;
}

const ContentButtonInner: ComponentConfig<ContentButtonProps> = {
  label: "زر",
  fields: {
    buttonVariantMode: {
      type: "radio",
      label: "نمط الزر",
      options: [
        { label: "استخدام نمط", value: "variant" },
        { label: "تخصيص يدوي", value: "fixed" },
      ],
    },
    buttonVariant: {
      type: "select",
      label: "النمط",
      options: [
        { label: "أساسي", value: "primary" },
        { label: "ثانوي", value: "secondary" },
        { label: "خطأ", value: "error" },
      ],
    },
    buttonVariantSize: {
      type: "select",
      label: "حجم النمط",
      options: [
        { label: "صغير", value: "sm" },
        { label: "متوسط", value: "md" },
        { label: "كبير", value: "lg" },
      ],
    },
    label: { type: "text", contentEditable: true, label: "النص" },
    align: alignField,
    destinationType: {
      type: "radio",
      label: "الوجهة",
      options: [
        { label: "رابط", value: "link" },
        { label: "إجراء", value: "action" },
      ],
    },
    link: linkField({ label: "الرابط" }),
    buttonAction: {
      type: "select",
      label: "الإجراء",
      options: BUTTON_FUNCTIONAL_ACTION_OPTIONS,
    },
    radius: themeFixedSelectField({
      label: "زاوية الحدود",
      themeOptions: RADIUS_OPTIONS,
      type: "number",
      placeholder: "القيمة بالبكسل",
    }),
    bgColor: { ...colorField, label: "لون الخلفية" },
    textColor: { ...colorField, label: "لون النص" },
    buttonSize: themeFixedSelectField({
      label: "الحجم",
      themeOptions: buttonSizeThemeOptions,
      type: "number",
      placeholder: "القيمة بالبكسل",
    }),
  },
  defaultProps: {
    label: "زر",
    align: "center",
    destinationType: "link",
    buttonAction: "login",
    link: EMPTY_LINK,
    buttonVariantMode: "variant",
    buttonVariant: "primary",
    buttonVariantSize: "md",
    radius: "theme-md",
    bgColor: "theme-primary",
    textColor: "theme-surface",
    buttonSize: "theme-md",
    layout: {
      positionMode: "static",
      floatUseFixedPosition: true,
      floatPlacementMode: "preset",
      floatPreset: "bottom-right",
      shadowMode: "none",
    },
  },
  render: (props) => {
    const {
      label,
      labelValueContext,
      align,
      destinationType,
      buttonAction,
      link,
      buttonVariantMode,
      buttonVariant,
      buttonVariantSize,
      radius: radiusVal,
      bgColor,
      textColor,
      buttonSize: buttonSizeVal,
      puck,
    } = props;

    const { data: boundData, language, metadata } = useBoundData();
    const resolvedLabel = useBoundValue(label, labelValueContext);
    const resolvedAlign = align ?? "center";
    const destType =
      destinationType ??
      (buttonAction && buttonAction !== "link" ? "action" : "link");
    const action: ButtonAction = destType === "action" ? buttonAction ?? "login" : "link";

    let sharedStyle: CSSProperties;

    if (buttonVariantMode === "variant") {
      const v = buttonVariant ?? "primary";
      const variantColors = getVariantColors(v);
      const size = resolveButtonSize(`theme-${buttonVariantSize ?? "md"}`);
      sharedStyle = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: `var(--theme-button-variant-${v}-radius)`,
        background: variantColors.bg,
        color: variantColors.fg,
        textDecoration: "none",
        fontWeight: 600,
        boxSizing: "border-box",
        minHeight: size.height,
        paddingLeft: size.paddingLeft,
        paddingRight: size.paddingRight,
        paddingTop: size.paddingTop,
        paddingBottom: size.paddingBottom,
        fontSize: size.fontSize,
        border: "none",
        cursor: puck.isEditing ? "default" : "pointer",
        fontFamily: "inherit",
      };
    } else {
      const r = resolveRadius(radiusVal ?? "theme-md");
      const bg = resolveColor(bgColor ?? "theme-primary");
      const fg = resolveColor(textColor ?? "theme-surface");
      const size = resolveButtonSize(buttonSizeVal ?? "theme-md");
      sharedStyle = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: r,
        background: bg,
        color: fg,
        textDecoration: "none",
        fontWeight: 600,
        boxSizing: "border-box",
        minHeight: size.height,
        paddingLeft: size.paddingLeft,
        paddingRight: size.paddingRight,
        paddingTop: size.paddingTop,
        paddingBottom: size.paddingBottom,
        fontSize: size.fontSize,
        border: "none",
        cursor: puck.isEditing ? "default" : "pointer",
        fontFamily: "inherit",
      };
    }

    const placementStyle: CSSProperties = {
      display: "flex",
      width: "100%",
      minWidth: 0,
      boxSizing: "border-box",
      justifyContent:
        resolvedAlign === "left"
          ? "flex-start"
          : resolvedAlign === "right"
          ? "flex-end"
          : "center",
    };

    const onFunctionalClick = (e: MouseEvent) => {
      e.preventDefault();
      if (puck.isEditing) return;

      if (action === "addToCart" && boundData) {
        const detail = buildProductActionDetail(boundData, language, metadata);
        if (detail) {
          dispatchProductCardEvent("add-product", detail);
          return;
        }
      }

      if (action === "addToWishlist" && boundData) {
        const detail = buildProductActionDetail(boundData, language, metadata);
        if (detail) {
          dispatchProductCardEvent("add-product-to-favourite", detail);
          return;
        }
      }

      window.alert(`إجراء الزر: ${buttonActionLabel(action)}`);
    };

    if (action !== "link") {
      return (
        <div style={placementStyle}>
          <button type="button" onClick={onFunctionalClick} style={sharedStyle}>
            {resolvedLabel}
          </button>
        </div>
      );
    }

    const resolvedHref =
      resolveLinkHref(link, { boundData, locale: language }) ?? "#";
    const target = resolveLinkTarget(link);
    const rel = resolveLinkRel(link);

    return (
      <div style={placementStyle}>
        <a
          href={puck.isEditing ? "#" : resolvedHref}
          target={puck.isEditing ? undefined : target}
          rel={puck.isEditing ? undefined : rel}
          onClick={puck.isEditing ? (e) => e.preventDefault() : undefined}
          style={sharedStyle}
        >
          {resolvedLabel}
        </a>
      </div>
    );
  },
  resolveData: ({ props }) => ({
    props: {
      align: props.align ?? "center",
      destinationType:
        props.destinationType ??
        (props.buttonAction && props.buttonAction !== "link" ? "action" : "link"),
    },
  }),
};

const WithLayoutButton = withLayout(ContentButtonInner);

const FIELD_ORDER = [
  "buttonVariantMode",
  "buttonVariant",
  "buttonVariantSize",
  "label",
  "align",
  "destinationType",
  "link",
  "buttonAction",
  "radius",
  "bgColor",
  "textColor",
  "buttonSize",
  "layout",
] as const;

function resolveButtonFields(
  fields: Record<string, unknown>,
  data: { props?: Partial<ContentButtonProps> }
): Fields<ContentButtonProps> {
  const variantMode = data.props?.buttonVariantMode ?? "variant";
  const destType =
    data.props?.destinationType ??
    (data.props?.buttonAction && data.props.buttonAction !== "link"
      ? "action"
      : "link");

  const styleFields = ["radius", "bgColor", "textColor", "buttonSize"];
  const result: Record<string, unknown> = {};

  for (const key of FIELD_ORDER) {
    const field = fields[key];
    if (field == null) continue;

    if (variantMode === "variant" && styleFields.includes(key)) continue;
    if (variantMode === "fixed" && (key === "buttonVariant" || key === "buttonVariantSize")) {
      continue;
    }
    if (destType === "link" && key === "buttonAction") continue;
    if (destType === "action" && key === "link") continue;

    if (key === "layout" && typeof field === "object") {
      result.layout = {
        ...field,
        showBorder: false,
        showPosition: true,
        floatPresetFilter: [...BUTTON_FLOAT_PRESETS],
        floatViewportFixed: true,
        hideFloatCustom: true,
      };
      continue;
    }

    result[key] = field;
  }

  return result as Fields<ContentButtonProps>;
}

export const ContentButton: typeof WithLayoutButton = {
  ...WithLayoutButton,
  resolveFields: (data, params) => {
    const resolver = (
      WithLayoutButton as { resolveFields?: (typeof WithLayoutButton)["resolveFields"] }
    ).resolveFields;
    const base = resolver?.(data, params);
    const apply = (f: Record<string, unknown>) =>
      hideLayoutBorder(resolveButtonFields(f, data) as Fields<WithLayout<ContentButtonProps>>);

    if (base != null && typeof (base as Promise<unknown>).then === "function") {
      return (base as Promise<Record<string, unknown>>).then(apply);
    }
    if (base == null) {
      return apply(ContentButtonInner.fields as unknown as Record<string, unknown>);
    }
    return apply(base as Record<string, unknown>);
  },
};
