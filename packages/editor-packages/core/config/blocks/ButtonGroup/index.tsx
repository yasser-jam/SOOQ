"use client";
import React, { CSSProperties, MouseEvent, useEffect, useMemo, useState } from "react";
import { ComponentConfig, Fields } from "@/core/types";
import { WithLayout, withLayout, hideLayoutBorder } from "../../components/Layout";
import { buttonSizeVars, ButtonSizeStep } from "../../theme";
import {
  RADIUS_OPTIONS,
  TEXT_SIZE_OPTIONS,
  resolveFontSize,
  resolveRadius,
} from "../../content/typography-fields";
import { resolveColor, colorField } from "../../content/color-fields";
import {
  type ButtonAction,
  BUTTON_FUNCTIONAL_ACTION_OPTIONS,
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
import { spacingOptions } from "../../options";
import {
  buildProductActionDetail,
  useBoundData,
} from "../../binding";
import { dispatchZoneEvent } from "../../lib/zone-events";
import { collectSooqInputValues } from "../../lib/login-events";
import { bumpCartLineQuantity } from "../../cart/cart-qty-actions";
import { useStore } from "../../store-context";
import { AlignRight } from "lucide-react";
import { createAlignField } from "../../fields/AlignField";

export const BUTTON_GROUP_SELECT_EVENT = "sooq:button-group-select";

type ButtonStyle = {
  bgColor: string;
  textColor: string;
  radius: string;
  buttonSize: string;
  fontSize?: string;
};

export type ButtonGroupItem = {
  title: string;
  value: string;
  destinationType: "link" | "action" | "zone";
  link: LinkValue;
  buttonAction: ButtonAction;
  submitRedirectUrl: string;
  zoneKey: string;
  zoneAction: "open" | "close" | "toggle";
};

export type ButtonGroupProps = WithLayout<{
  items: ButtonGroupItem[];
  inactiveStyle: ButtonStyle;
  activeStyle: ButtonStyle;
  defaultSelectedValue: string;
  gap: string;
  align: "left" | "center" | "right";
}>;

const buttonSizeThemeOptions = [
  { label: "صغير", value: "sm" },
  { label: "متوسط", value: "md" },
  { label: "كبير", value: "lg" },
];

const GAP_OPTIONS = spacingOptions.slice(0, 10).map((option) => ({
  label: option.label,
  value: option.value.replace(/px$/, ""),
}));

const DEFAULT_BUTTON_STYLE: ButtonStyle = {
  bgColor: "theme-surface",
  textColor: "theme-text",
  radius: "theme-md",
  buttonSize: "theme-sm",
  fontSize: "",
};

const DEFAULT_ACTIVE_STYLE: ButtonStyle = {
  bgColor: "theme-primary",
  textColor: "theme-surface",
  radius: "theme-md",
  buttonSize: "theme-sm",
  fontSize: "",
};

const buttonStyleObjectFields = {
  bgColor: { ...colorField, label: "لون الخلفية" },
  textColor: { ...colorField, label: "لون النص" },
  radius: themeFixedSelectField({
    label: "زاوية الحدود",
    themeOptions: RADIUS_OPTIONS,
    type: "number",
    placeholder: "القيمة بالبكسل",
  }),
  buttonSize: themeFixedSelectField({
    label: "الحجم",
    themeOptions: buttonSizeThemeOptions,
    type: "number",
    placeholder: "القيمة بالبكسل",
  }),
  fontSize: themeFixedSelectField({
    label: "حجم الخط",
    themeOptions: TEXT_SIZE_OPTIONS,
    type: "number",
    placeholder: "القيمة بالبكسل",
  }),
};

const alignField = createAlignField({ defaultValue: "center" });

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

function resolveGap(value: string | undefined): string {
  if (!value) return "8px";
  if (value.startsWith("theme-")) {
    return `${value.slice(6)}px`;
  }
  return value.includes("px") ? value : `${value}px`;
}

function resolveButtonStyle(style: ButtonStyle | undefined, isEditing: boolean): CSSProperties {
  const s = style ?? DEFAULT_BUTTON_STYLE;
  const size = resolveButtonSize(s.buttonSize ?? "theme-sm");
  const r = resolveRadius(s.radius ?? "theme-md");
  const bg = resolveColor(s.bgColor ?? "theme-surface");
  const fg = resolveColor(s.textColor ?? "theme-text");
  const fontSize = s.fontSize ? resolveFontSize(s.fontSize) : size.fontSize;

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: r,
    background: bg,
    color: fg,
    fontWeight: 600,
    boxSizing: "border-box",
    minHeight: size.height,
    paddingLeft: size.paddingLeft,
    paddingRight: size.paddingRight,
    paddingTop: size.paddingTop,
    paddingBottom: size.paddingBottom,
    fontSize,
    border: "none",
    cursor: isEditing ? "default" : "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    transition: "background 0.15s ease, color 0.15s ease",
  };
}

function createDefaultItem(
  title: string,
  value: string,
  overrides?: Partial<ButtonGroupItem>
): ButtonGroupItem {
  return {
    title,
    value,
    destinationType: "link",
    link: EMPTY_LINK,
    buttonAction: "link",
    submitRedirectUrl: "",
    zoneKey: "popup-main",
    zoneAction: "open",
    ...overrides,
  };
}

/** Strip legacy per-item styles after migrating them to group-level props. */
function stripLegacyItemStyles(
  item: ButtonGroupItem & { inactiveStyle?: ButtonStyle; activeStyle?: ButtonStyle }
): ButtonGroupItem {
  const { inactiveStyle: _inactive, activeStyle: _active, ...rest } = item;
  return rest;
}

const ButtonGroupInner: ComponentConfig<ButtonGroupProps> = {
  label: "مجموعة أزرار",
  fields: {
    items: {
      type: "array",
      label: "الأزرار",
      arrayFields: {
        title: { type: "text", label: "العنوان" },
        value: { type: "text", label: "القيمة" },
        destinationType: {
          type: "radio",
          label: "الوجهة",
          options: [
            { label: "رابط", value: "link" },
            { label: "إجراء", value: "action" },
            { label: "منطقة", value: "zone" },
          ],
        },
        link: linkField({ label: "الرابط" }),
        buttonAction: {
          type: "select",
          label: "الإجراء",
          options: BUTTON_FUNCTIONAL_ACTION_OPTIONS,
        },
        submitRedirectUrl: {
          type: "text",
          label: "رابط التوجيه بعد الإرسال",
          placeholder: "https://example.com/success",
        },
        zoneKey: {
          type: "text",
          label: "مفتاح المنطقة",
          placeholder: "popup-main",
        },
        zoneAction: {
          type: "select",
          label: "إجراء المنطقة",
          options: [
            { label: "فتح", value: "open" },
            { label: "إغلاق", value: "close" },
            { label: "تبديل", value: "toggle" },
          ],
        },
      },
      defaultItemProps: createDefaultItem("زر", "value"),
      getItemSummary: (item: ButtonGroupItem) => item.title || item.value || "زر",
    },
    inactiveStyle: {
      type: "object",
      label: "نمط غير نشط",
      objectFields: buttonStyleObjectFields,
    },
    activeStyle: {
      type: "object",
      label: "نمط نشط",
      objectFields: buttonStyleObjectFields,
    },
    defaultSelectedValue: {
      type: "text",
      label: "القيمة النشطة الافتراضية",
    },
    gap: themeFixedSelectField({
      label: "المسافة بين الأزرار",
      themeOptions: GAP_OPTIONS,
      type: "number",
      placeholder: "القيمة بالبكسل",
    }),
    align: alignField,
  },
  defaultProps: {
    defaultSelectedValue: "option-a",
    gap: "theme-8",
    align: "center",
    inactiveStyle: { ...DEFAULT_BUTTON_STYLE },
    activeStyle: { ...DEFAULT_ACTIVE_STYLE },
    items: [
      createDefaultItem("الخيار أ", "option-a", {
        link: { kind: "page", pageId: "/" },
      }),
      createDefaultItem("الخيار ب", "option-b", {
        link: { kind: "page", pageId: "/products" },
      }),
    ],
  },
  resolveData: ({ props }) => {
    let gap = props.gap;
    if (gap && !gap.startsWith("theme-") && gap.endsWith("px")) {
      const n = gap.replace(/px$/, "");
      gap = GAP_OPTIONS.some((o) => o.value === n) ? `theme-${n}` : n;
    }

    const rawItems = (props.items ?? []) as Array<
      ButtonGroupItem & { inactiveStyle?: ButtonStyle; activeStyle?: ButtonStyle }
    >;
    const legacy = rawItems[0];
    const inactiveStyle =
      props.inactiveStyle ?? legacy?.inactiveStyle ?? { ...DEFAULT_BUTTON_STYLE };
    const activeStyle =
      props.activeStyle ?? legacy?.activeStyle ?? { ...DEFAULT_ACTIVE_STYLE };
    const items = rawItems.map(stripLegacyItemStyles);

    const values = items.map((item) => item.value);
    const defaultSelectedValue = values.includes(props.defaultSelectedValue ?? "")
      ? props.defaultSelectedValue
      : values[0] ?? "";

    return {
      props: {
        gap: gap ?? "theme-8",
        align: props.align ?? "center",
        inactiveStyle,
        activeStyle,
        items,
        defaultSelectedValue,
      },
    };
  },
  render: (props) => {
    const {
      items = [],
      inactiveStyle,
      activeStyle,
      defaultSelectedValue,
      gap,
      align,
      puck,
      id,
    } = props;

    const { data: boundData, language, metadata, selectedVariantId } = useBoundData();
    const { actions, loading } = useStore();

    const initialValue = useMemo(() => {
      const values = items.map((item) => item.value);
      if (defaultSelectedValue && values.includes(defaultSelectedValue)) {
        return defaultSelectedValue;
      }
      return values[0] ?? "";
    }, [items, defaultSelectedValue]);

    const [selectedValue, setSelectedValue] = useState(initialValue);

    useEffect(() => {
      setSelectedValue(initialValue);
    }, [initialValue]);

    const resolvedAlign = align ?? "center";
    const resolvedGap = resolveGap(gap);
    const activeValue = puck.isEditing ? initialValue : selectedValue;

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
      gap: resolvedGap,
      flexWrap: "wrap",
    };

    const maybeRedirect = (submitRedirectUrl: string) => {
      if (submitRedirectUrl && typeof window !== "undefined") {
        window.location.href = submitRedirectUrl;
      }
    };

    const dispatchSelectEvent = (value: string) => {
      if (typeof window === "undefined") return;
      window.dispatchEvent(
        new CustomEvent(BUTTON_GROUP_SELECT_EVENT, {
          detail: { value, blockId: id },
          bubbles: true,
        })
      );
    };

    const runFunctionalAction = async (
      e: MouseEvent,
      item: ButtonGroupItem
    ) => {
      const action = item.buttonAction ?? "link";

      if (action === "login") {
        const scope = (e.currentTarget as HTMLElement).closest("form") ?? document;
        const values = collectSooqInputValues(scope);
        try {
          await actions.login(values.phone ?? "", values.fullName ?? "");
          maybeRedirect(item.submitRedirectUrl);
        } catch (err) {
          window.alert(err instanceof Error ? err.message : "فشل إرسال رمز التحقق.");
        }
        return;
      }

      if (action === "verifyOtp") {
        const scope = (e.currentTarget as HTMLElement).closest("form") ?? document;
        const values = collectSooqInputValues(scope);
        try {
          await actions.verifyOtp(values.otp ?? "");
          maybeRedirect(item.submitRedirectUrl);
        } catch (err) {
          window.alert(err instanceof Error ? err.message : "رمز التحقق غير صحيح.");
        }
        return;
      }

      if (action === "makeOrder") {
        try {
          await actions.makeOrder();
          maybeRedirect(item.submitRedirectUrl);
        } catch (err) {
          window.alert(err instanceof Error ? err.message : "حدث خطأ أثناء تقديم الطلب.");
        }
        return;
      }

      if (action === "cartQtyIncrease") {
        bumpCartLineQuantity(boundData, 1, puck.isEditing);
        return;
      }

      if (action === "cartQtyDecrease") {
        bumpCartLineQuantity(boundData, -1, puck.isEditing);
        return;
      }

      if (action === "addToCart" && boundData) {
        const detail = buildProductActionDetail(
          boundData,
          language,
          metadata,
          selectedVariantId
        );
        if (detail) {
          actions.addToCart(detail);
        }
        return;
      }

      if (action === "addToWishlist" && boundData) {
        const detail = buildProductActionDetail(
          boundData,
          language,
          metadata,
          selectedVariantId
        );
        if (detail) {
          actions.addToWishlist(detail);
        }
        return;
      }

      if (action === "logout") {
        actions.logout();
        maybeRedirect(item.submitRedirectUrl);
      }
    };

    const runDestination = async (e: MouseEvent, item: ButtonGroupItem) => {
      const destType = item.destinationType ?? "link";

      if (destType === "zone") {
        if (item.zoneKey) {
          dispatchZoneEvent(item.zoneKey, item.zoneAction ?? "toggle");
        }
        return;
      }

      if (destType === "action") {
        await runFunctionalAction(e, item);
        return;
      }

      const href = resolveLinkHref(item.link, { boundData, locale: language });
      if (href && typeof window !== "undefined") {
        const target = resolveLinkTarget(item.link);
        if (target === "_blank") {
          window.open(href, "_blank", resolveLinkRel(item.link) ?? "noopener noreferrer");
        } else {
          window.location.href = href;
        }
      }
    };

    const handleItemClick = async (e: MouseEvent, item: ButtonGroupItem) => {
      e.preventDefault();
      if (puck.isEditing) return;

      setSelectedValue(item.value);
      dispatchSelectEvent(item.value);
      await runDestination(e, item);
    };

    if (items.length === 0) {
      if (!puck.isEditing) return null;
      return (
        <div style={{ color: "var(--theme-neutral, #64748b)", fontSize: 14 }}>
          أضف أزراراً إلى المجموعة
        </div>
      );
    }

    return (
      <div style={placementStyle} role="group">
        {items.map((item) => {
          const isActive = item.value === activeValue;
          const style = resolveButtonStyle(
            isActive ? activeStyle : inactiveStyle,
            puck.isEditing
          );
          const destType = item.destinationType ?? "link";
          const action = item.buttonAction ?? "link";
          const isLoading =
            destType === "action" &&
            ((action === "login" && loading.login) ||
              (action === "verifyOtp" && loading.verifyOtp) ||
              (action === "makeOrder" && loading.makeOrder));

          return (
            <button
              key={item.value}
              type="button"
              onClick={(e) => handleItemClick(e, item)}
              disabled={isLoading}
              aria-pressed={isActive}
              tabIndex={puck.isEditing ? -1 : undefined}
              style={{
                ...style,
                opacity: isLoading ? 0.65 : 1,
              }}
            >
              {isLoading ? "..." : item.title}
            </button>
          );
        })}
      </div>
    );
  },
};

const WithLayoutButtonGroup = withLayout(ButtonGroupInner);

export const ButtonGroup: typeof WithLayoutButtonGroup = {
  ...WithLayoutButtonGroup,
  resolveFields: (data, params) => {
    const resolver = (
      WithLayoutButtonGroup as {
        resolveFields?: (typeof WithLayoutButtonGroup)["resolveFields"];
      }
    ).resolveFields;
    const base = resolver?.(data, params);
    const apply = (f: Record<string, unknown>) =>
      hideLayoutBorder(f as Fields<WithLayout<ButtonGroupProps>>);

    if (base != null && typeof (base as Promise<unknown>).then === "function") {
      return (base as Promise<Record<string, unknown>>).then(apply);
    }
    if (base == null) {
      return apply(ButtonGroupInner.fields as unknown as Record<string, unknown>);
    }
    return apply(base as Record<string, unknown>);
  },
};
