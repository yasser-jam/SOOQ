"use client";
import React, { CSSProperties, MouseEvent, useEffect, useState } from "react";
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
import { withStoreBasePath } from "../../lib/store-base-path";
import { SmartLink } from "../../../components/SmartLink";
import { themeFixedSelectField } from "../../fields/ThemeFixedSelect";
import type { ValueContext } from "../../binding";
import {
  buildProductActionDetail,
  useBoundData,
  useBoundValue,
} from "../../binding";
import { dispatchZoneEvent } from "../../lib/zone-events";
import { collectSooqInputValues } from "../../lib/login-events";
import { bumpCartLineQuantity } from "../../cart/cart-qty-actions";
import { readStoreCart, STORE_CART_UPDATED_EVENT } from "../../cart/store-cart";
import { useStore } from "../../store-context";
import { AlignRight } from "lucide-react";
import { createAlignField } from "../../fields/AlignField";
import {
  bilingualTextField,
  pickLang,
  type BilingualString,
} from "../../fields/BilingualText";
import { useActiveLanguage } from "../../locale/LanguageContext";

export type ContentButtonProps = WithLayout<{
  label: BilingualString | string;
  labelValueContext?: ValueContext | null;
  align: "left" | "center" | "right";
  destinationType: "link" | "action" | "zone";
  buttonAction: ButtonAction;
  submitRedirectUrl: string;
  link: LinkValue;
  zoneKey: string;
  zoneAction: "open" | "close" | "toggle";
  buttonVariantMode: "variant" | "fixed";
  buttonVariant: "primary" | "secondary" | "error";
  buttonVariantSize: "sm" | "md" | "lg";
  radius: string;
  bgColor: string;
  textColor: string;
  buttonSize: string;
  /** Shows a live cart-item-count badge on the button (e.g. header cart link). */
  showCartBadge?: boolean;
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

/** Live cart item count, only subscribed to storage/cart events when `enabled`. */
function useCartBadgeCount(enabled: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const read = () =>
      setCount(readStoreCart().items.reduce((s, l) => s + l.quantity, 0));
    read();
    window.addEventListener(STORE_CART_UPDATED_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(STORE_CART_UPDATED_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, [enabled]);

  return enabled ? count : 0;
}

const cartBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "-6px",
  insetInlineEnd: "-6px",
  minWidth: "18px",
  height: "18px",
  padding: "0 4px",
  borderRadius: "999px",
  background: "#ef4444",
  color: "#ffffff",
  fontSize: "10px",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  boxSizing: "border-box",
  pointerEvents: "none",
  // Without an explicit stacking order the badge only outranks the button's own
  // in-flow content (icon/label). Any positioned sibling in the header (e.g. a
  // themed overlay or an adjacent nav item) painted after it in DOM order can
  // still cover this corner, making the count look clipped — pin it above.
  zIndex: 1,
};

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
    label: bilingualTextField({ label: "النص", contentEditable: true }),
    align: alignField,
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
    showCartBadge: {
      type: "radio",
      label: "شارة عدد السلة",
      metadata: {
        helpText:
          "يظهر عدد المنتجات في السلة كشارة على الزر، ويتحدث تلقائياً عند الإضافة إلى السلة.",
      },
      options: [
        { label: "إظهار", value: true },
        { label: "إخفاء", value: false },
      ],
    },
  },
  defaultProps: {
    label: { ar: "زر", en: "Button" },
    align: "center",
    destinationType: "link",
    buttonAction: "link",
    submitRedirectUrl: "",
    link: EMPTY_LINK,
    zoneKey: "popup-main",
    zoneAction: "open",
    buttonVariantMode: "variant",
    buttonVariant: "primary",
    buttonVariantSize: "md",
    radius: "theme-md",
    bgColor: "theme-primary",
    textColor: "theme-surface",
    buttonSize: "theme-md",
    showCartBadge: false,
    layout: {
      positionMode: "static",
      floatCssPosition: "fixed",
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
      submitRedirectUrl,
      link,
      zoneKey,
      zoneAction,
      buttonVariantMode,
      buttonVariant,
      buttonVariantSize,
      radius: radiusVal,
      bgColor,
      textColor,
      buttonSize: buttonSizeVal,
      showCartBadge,
      puck,
    } = props;

    const cartBadgeCount = useCartBadgeCount(showCartBadge === true);
    const cartBadge =
      showCartBadge && cartBadgeCount > 0 ? (
        <span style={cartBadgeStyle}>
          {cartBadgeCount > 99 ? "99+" : cartBadgeCount}
        </span>
      ) : null;

    const { data: boundData, language: boundLanguage, metadata, selectedVariantId } =
      useBoundData();
    const { language: activeLanguage, toggleLanguage } = useActiveLanguage();
    const resolvedLabel = useBoundValue(
      pickLang(label, activeLanguage),
      labelValueContext
    );
    const resolvedAlign = align ?? "center";
    const destType =
      destinationType ??
      (buttonAction && buttonAction !== "link" ? "action" : "link");
    const action: ButtonAction = destType === "action" ? buttonAction ?? "link" : "link";

    const { actions, loading } = useStore();

    const isLoading =
      destType === "action" &&
      ((action === "login" && loading.login) ||
        (action === "verifyOtp" && loading.verifyOtp) ||
        (action === "makeOrder" && loading.makeOrder) ||
        (action === "validateDiscount" && loading.discount) ||
        (action === "placeOrder" && loading.placeOrder) ||
        (action === "saveProfile" && loading.profile) ||
        (action === "createAddress" && loading.address) ||
        (action === "setDefaultAddress" && loading.address) ||
        (action === "deleteAddress" && loading.address) ||
        (action === "downloadInvoice" && loading.invoice) ||
        (action === "cancelOrder" && loading.cancelOrder) ||
        (action === "submitReturn" && loading.submitReturn));

    const onZoneClick = (e: MouseEvent) => {
      e.preventDefault();
      if (puck.isEditing || !zoneKey) return;
      dispatchZoneEvent(zoneKey, zoneAction ?? "toggle");
    };

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

    const maybeRedirect = () => {
      if (submitRedirectUrl && typeof window !== "undefined") {
        window.location.href =
          withStoreBasePath(submitRedirectUrl) ?? submitRedirectUrl;
      }
    };

    const onFunctionalClick = async (e: MouseEvent) => {
      e.preventDefault();

      if (action === "toggleLanguage") {
        toggleLanguage();
        return;
      }

      if (puck.isEditing) return;

      if (action === "login") {
        const scope = (e.currentTarget as HTMLElement).closest("form") ?? document;
        const values = collectSooqInputValues(scope);
        try {
          await actions.login(values.phone ?? "", values.fullName ?? "");
          maybeRedirect();
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
          if (submitRedirectUrl) {
            maybeRedirect();
          } else if (typeof window !== "undefined") {
            // Without a configured redirect the verify page is a dead end after
            // login — land the customer on the store home instead.
            window.location.href = withStoreBasePath("/") ?? "/";
          }
        } catch (err) {
          window.alert(err instanceof Error ? err.message : "رمز التحقق غير صحيح.");
        }
        return;
      }

      if (action === "makeOrder") {
        try {
          await actions.makeOrder();
          maybeRedirect();
        } catch (err) {
          window.alert(err instanceof Error ? err.message : "حدث خطأ أثناء تقديم الطلب.");
        }
        return;
      }

      // Errors land in `errors.discount` / `errors.placeOrder`, which the
      // checkout preset renders inline — no alert() for these two.
      if (action === "validateDiscount") {
        await actions.checkout.validateDiscount();
        return;
      }

      if (action === "placeOrder") {
        await actions.checkout.placeOrder();
        maybeRedirect();
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
        const detail = buildProductActionDetail(boundData, activeLanguage, metadata, selectedVariantId);
        if (detail) {
          actions.addToCart(detail);
          return;
        }
      }

      if (action === "addToWishlist" && boundData) {
        const detail = buildProductActionDetail(boundData, activeLanguage, metadata, selectedVariantId);
        if (detail) {
          actions.addToWishlist(detail);
          return;
        }
      }

      if (action === "logout") {
        actions.logout();
        maybeRedirect();
        return;
      }

      if (action === "saveProfile") {
        try {
          await actions.customer.saveProfile();
          maybeRedirect();
        } catch (err) {
          window.alert(
            err instanceof Error ? err.message : "تعذّر حفظ التغييرات، حاول مجدداً."
          );
        }
        return;
      }

      if (action === "createAddress") {
        try {
          await actions.customer.createAddress();
          maybeRedirect();
        } catch (err) {
          window.alert(
            err instanceof Error ? err.message : "تعذّر حفظ العنوان، حاول مجدداً."
          );
        }
        return;
      }

      if (action === "setDefaultAddress") {
        const addressId =
          typeof boundData?.address === "object" &&
          boundData.address != null &&
          "addressId" in boundData.address
            ? String((boundData.address as { addressId: string }).addressId)
            : "";
        if (!addressId) return;
        try {
          await actions.customer.setDefaultAddress(addressId);
        } catch (err) {
          window.alert(
            err instanceof Error
              ? err.message
              : "تعذّر تعيين العنوان الافتراضي، حاول مجدداً."
          );
        }
        return;
      }

      if (action === "deleteAddress") {
        const addressId =
          typeof boundData?.address === "object" &&
          boundData.address != null &&
          "addressId" in boundData.address
            ? String((boundData.address as { addressId: string }).addressId)
            : "";
        if (!addressId) return;
        try {
          await actions.customer.deleteAddress(addressId);
        } catch (err) {
          window.alert(
            err instanceof Error ? err.message : "تعذّر حذف العنوان، حاول مجدداً."
          );
        }
        return;
      }

      if (action === "ordersNextPage") {
        actions.orders.nextPage();
        return;
      }

      if (action === "ordersPrevPage") {
        actions.orders.prevPage();
        return;
      }

      if (action === "downloadInvoice") {
        const orderRecord =
          boundData?.order && typeof boundData.order === "object"
            ? (boundData.order as { orderId?: string; orderNumber?: string })
            : null;
        try {
          await actions.orders.downloadInvoice(
            orderRecord?.orderId,
            orderRecord?.orderNumber ?? null
          );
        } catch (err) {
          window.alert(
            err instanceof Error ? err.message : "تعذّر تحميل الفاتورة."
          );
        }
        return;
      }

      if (action === "cancelOrder") {
        try {
          await actions.orders.cancelOrder();
        } catch (err) {
          window.alert(
            err instanceof Error ? err.message : "تعذّر إلغاء الطلب."
          );
        }
        return;
      }

      if (action === "submitReturn") {
        try {
          await actions.orders.submitReturn();
        } catch (err) {
          window.alert(
            err instanceof Error ? err.message : "تعذّر إرسال طلب الإرجاع."
          );
        }
        return;
      }
    };

    if (destType === "zone") {
      return (
        <div style={placementStyle}>
          <button type="button" onClick={onZoneClick} style={sharedStyle}>
            {resolvedLabel}
          </button>
        </div>
      );
    }

    if (action !== "link") {
      return (
        <div style={placementStyle}>
          <button
            type="button"
            onClick={onFunctionalClick}
            disabled={isLoading}
            style={{
              ...sharedStyle,
              opacity: isLoading ? 0.65 : 1,
              position: showCartBadge ? "relative" : sharedStyle.position,
            }}
          >
            {isLoading ? "..." : resolvedLabel}
            {cartBadge}
          </button>
        </div>
      );
    }

    const resolvedHref =
      resolveLinkHref(link, { boundData, locale: activeLanguage }) ?? "#";
    const target = resolveLinkTarget(link);
    const rel = resolveLinkRel(link);

    return (
      <div style={placementStyle}>
        <SmartLink
          href={puck.isEditing ? "#" : resolvedHref}
          target={puck.isEditing ? undefined : target}
          rel={puck.isEditing ? undefined : rel}
          onClick={puck.isEditing ? (e) => e.preventDefault() : undefined}
          style={{
            ...sharedStyle,
            position: showCartBadge ? "relative" : sharedStyle.position,
          }}
        >
          {resolvedLabel}
          {cartBadge}
        </SmartLink>
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
  "submitRedirectUrl",
  "radius",
  "bgColor",
  "textColor",
  "buttonSize",
  "showCartBadge",
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
    if (destType === "link" && key === "submitRedirectUrl") continue;
    if (destType === "zone" && key === "submitRedirectUrl") continue;
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
