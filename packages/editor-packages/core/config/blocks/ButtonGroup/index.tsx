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
import { withStoreBasePath } from "../../lib/store-base-path";
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
import {
  getEditorDataAdapter,
  useSampleDataInEditor,
} from "../../data-adapter";
import {
  ALL_CATEGORY_VALUE,
  buildPaginationItems,
  validatePaginationItemValues,
} from "./pagination-utils";
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

export type ButtonGroupBindingMode = "static" | "categories" | "pagination";

export type ButtonGroupProps = WithLayout<{
  bindingMode?: ButtonGroupBindingMode;
  prependAllButton?: boolean;
  allButtonTitle?: string;
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
    bindingMode: {
      type: "select",
      label: "وضع الربط",
      options: [
        { label: "ثابت", value: "static" },
        { label: "تصنيفات المنتجات", value: "categories" },
        { label: "ترقيم الصفحات", value: "pagination" },
      ],
    },
    prependAllButton: {
      type: "radio",
      label: "زر الكل",
      options: [
        { label: "نعم", value: true },
        { label: "لا", value: false },
      ],
    },
    allButtonTitle: {
      type: "text",
      label: "عنوان زر الكل",
    },
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
    bindingMode: "static",
    prependAllButton: true,
    allButtonTitle: "الكل",
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
      bindingMode = "static",
      prependAllButton = true,
      allButtonTitle = "الكل",
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
    const { actions, loading, productsPage } = useStore();
    const adapter = getEditorDataAdapter();
    const sampleMode = puck.isEditing && useSampleDataInEditor();

    const categoryItems = useMemo(() => {
      const categories =
        sampleMode && bindingMode === "categories"
          ? adapter.getSampleCategories()
          : productsPage.categories;
      const mapped = categories.map((category) =>
        createDefaultItem(category.nameAr, category.slug, {
          destinationType: "link",
          link: EMPTY_LINK,
        })
      );
      if (prependAllButton) {
        mapped.unshift(
          createDefaultItem(allButtonTitle, ALL_CATEGORY_VALUE, {
            destinationType: "link",
            link: EMPTY_LINK,
          })
        );
      }
      return mapped;
    }, [
      adapter,
      allButtonTitle,
      bindingMode,
      prependAllButton,
      productsPage.categories,
      sampleMode,
    ]);

    const paginationItems = useMemo(() => {
      const totalPages =
        sampleMode && bindingMode === "pagination"
          ? Math.max(
              adapter.getSampleProductsPage({ page: 0, size: 12 }).totalPages,
              3
            )
          : productsPage.totalPages;
      const currentPage =
        sampleMode && bindingMode === "pagination" ? 1 : productsPage.page;
      const generated = buildPaginationItems(totalPages, currentPage).map((entry) =>
        createDefaultItem(entry.title, entry.value, {
          destinationType: "link",
          link: EMPTY_LINK,
        })
      );
      if (
        bindingMode === "pagination" &&
        generated.length > 0 &&
        !validatePaginationItemValues(
          generated.filter((item) => !item.value.startsWith("ellipsis-"))
        )
      ) {
        return [];
      }
      return generated;
    }, [
      adapter,
      bindingMode,
      productsPage.page,
      productsPage.totalPages,
      sampleMode,
    ]);

    const resolvedItems =
      bindingMode === "categories"
        ? categoryItems
        : bindingMode === "pagination"
          ? paginationItems
          : items;

    const initialValue = useMemo(() => {
      if (bindingMode === "categories") {
        return productsPage.selectedCategorySlug ?? ALL_CATEGORY_VALUE;
      }
      if (bindingMode === "pagination") {
        return String(productsPage.page || 1);
      }
      const values = resolvedItems.map((item) => item.value);
      if (defaultSelectedValue && values.includes(defaultSelectedValue)) {
        return defaultSelectedValue;
      }
      return values[0] ?? "";
    }, [
      bindingMode,
      defaultSelectedValue,
      productsPage.page,
      productsPage.selectedCategorySlug,
      resolvedItems,
    ]);

    const [selectedValue, setSelectedValue] = useState(initialValue);

    useEffect(() => {
      setSelectedValue(initialValue);
    }, [initialValue]);

    const resolvedAlign = align ?? "center";
    const resolvedGap = resolveGap(gap);
    const activeValue =
      bindingMode === "static"
        ? puck.isEditing
          ? initialValue
          : selectedValue
        : initialValue;

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
        window.location.href =
          withStoreBasePath(submitRedirectUrl) ?? submitRedirectUrl;
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
      if (item.value.startsWith("ellipsis-")) return;

      if (bindingMode === "categories") {
        actions.productsPage.setCategory(
          item.value === ALL_CATEGORY_VALUE ? null : item.value
        );
        return;
      }

      if (bindingMode === "pagination") {
        const page = Number(item.value);
        if (Number.isFinite(page) && page > 0) {
          actions.productsPage.setPage(page);
        }
        return;
      }

      setSelectedValue(item.value);
      dispatchSelectEvent(item.value);
      await runDestination(e, item);
    };

    const isCategoriesLoading =
      bindingMode === "categories" && productsPage.isLoading && !sampleMode;
    const showEmptyCategories =
      bindingMode === "categories" &&
      !isCategoriesLoading &&
      resolvedItems.length === 0;
    const showEmptyPagination =
      bindingMode === "pagination" &&
      resolvedItems.length === 0 &&
      !puck.isEditing;

    if (showEmptyCategories || showEmptyPagination) {
      return null;
    }

    if (resolvedItems.length === 0) {
      if (!puck.isEditing) return null;
      return (
        <div style={{ color: "var(--theme-neutral, #64748b)", fontSize: 14 }}>
          أضف أزراراً إلى المجموعة
        </div>
      );
    }

    return (
      <div
        style={{
          ...placementStyle,
          opacity: isCategoriesLoading ? 0.6 : 1,
        }}
        role="group"
        aria-busy={isCategoriesLoading}
      >
        {resolvedItems.map((item) => {
          const isEllipsis = item.value.startsWith("ellipsis-");
          const isActive = !isEllipsis && item.value === activeValue;
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
              disabled={isLoading || isEllipsis}
              aria-pressed={isActive}
              tabIndex={puck.isEditing || isEllipsis ? -1 : undefined}
              style={{
                ...style,
                opacity: isLoading ? 0.65 : isEllipsis ? 0.5 : 1,
                cursor: isEllipsis ? "default" : style.cursor,
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
    const bindingMode = data.props.bindingMode ?? "static";
    const apply = (f: Record<string, unknown>) => {
      const next = { ...f };
      if (bindingMode !== "static") {
        delete next.items;
        delete next.defaultSelectedValue;
      }
      if (bindingMode !== "categories") {
        delete next.prependAllButton;
        delete next.allButtonTitle;
      }
      return hideLayoutBorder(next as Fields<WithLayout<ButtonGroupProps>>);
    };

    if (base != null && typeof (base as Promise<unknown>).then === "function") {
      return (base as Promise<Record<string, unknown>>).then(apply);
    }
    if (base == null) {
      return apply(ButtonGroupInner.fields as unknown as Record<string, unknown>);
    }
    return apply(base as Record<string, unknown>);
  },
};
