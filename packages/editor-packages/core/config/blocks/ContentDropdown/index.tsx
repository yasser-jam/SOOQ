"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ComponentConfig, Fields } from "@/core/types";
import { getClassNameFactory } from "@/core/lib";
import { WithLayout, withLayout } from "../../components/Layout";
import { SOOQ_INPUT_ATTR } from "../../lib/login-events";
import {
  DROPDOWN_ACTION_OPTIONS,
  isBoundDropdownAction,
  type DropdownAction,
} from "../../content/dropdown-actions";
import { ENUM_MAPS, ENUM_MAP_OPTIONS, type EnumMapKey } from "../../content/enum-labels";
import type { ValueContext } from "../../binding";
import { useBoundData, useBoundValue } from "../../binding";
import { useStore } from "../../store-context";
import {
  getEditorDataAdapter,
  useSampleDataInEditor,
} from "../../data-adapter";
import {
  bilingualTextField,
  pickLang,
  type BilingualString,
} from "../../fields/BilingualText";
import { bindPathField } from "../../fields/BindPathField";
import { useActiveLanguage } from "../../locale/LanguageContext";
import { ALL_CATEGORY_VALUE } from "../ButtonGroup/pagination-utils";
import {
  formatAddressOption,
  SAMPLE_ADDRESS_OPTIONS,
  SAMPLE_PAYMENT_OPTIONS,
} from "../ContentSelect";
import {
  firstDropdownValue,
  resolveDropdownGroups,
  type DropdownOptionSource,
  type ResolvedDropdownGroup,
} from "./options";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("ContentDropdown", styles);

export type ContentDropdownProps = WithLayout<{
  label: BilingualString | string;
  name: string;
  placeholder: BilingualString | string;
  required: boolean;
  /** Option sources — static lists, bound repeaters, or the category list. */
  options: DropdownOptionSource[];
  dropdownAction: DropdownAction | "";
  /** Static option list keyed by `ENUM_MAPS` (e.g. order/return status) — checked before `options[]`. */
  enumMapKey?: EnumMapKey | "";
  /** Initial selection when no action is wired (ignored while bound). */
  defaultValue: string;
  /** Select the first option on mount so bound pricing has a variant. */
  autoSelectFirst: boolean;
  /** Render nothing on the storefront unless there are 2+ options to pick. */
  hideWhenSingle: boolean;
  valueContext?: ValueContext | null;
}>;

const SOURCE_MODE_OPTIONS = [
  { label: "قيم ثابتة", value: "static" },
  { label: "مكرِّر (من البيانات المرتبطة)", value: "bound" },
  { label: "تصنيفات المتجر", value: "categories" },
  { label: "خيارات المنتج (المتغيّرات)", value: "productVariants" },
];

const MODE_SUMMARY: Record<string, string> = {
  static: "قيم ثابتة",
  bound: "مكرِّر",
  categories: "تصنيفات",
  productVariants: "خيارات المنتج",
};

/** Synthetic single-source shortcuts for the two "action owns the list" cases below. */
const PRODUCT_VARIANTS_SOURCE: DropdownOptionSource = {
  mode: "productVariants",
  groupLabel: { ar: "", en: "" },
  values: [],
  sourcePath: "",
  titlePath: "",
  valuePath: "",
};
const CATEGORIES_SOURCE: DropdownOptionSource = {
  mode: "categories",
  groupLabel: { ar: "", en: "" },
  values: [],
  sourcePath: "",
  titlePath: "",
  valuePath: "",
};

function groupFromPairs(pairs: { value: string; label: string }[]): ResolvedDropdownGroup[] {
  const options = pairs.filter((p) => p.value).map((p) => ({ value: p.value, title: p.label || p.value }));
  return options.length > 0 ? [{ label: "", options }] : [];
}

/**
 * Resolve every option source against the live bound payload / store.
 * Shared by the render and by the `hideWhenSingle` gate, which has to know
 * the option count *before* the layout wrapper is rendered.
 *
 * Merged in from the retired `ContentSelect` block: `checkout_address` / `checkout_payment_method`
 * read the store runtime and `enumMapKey` reads a static `ENUM_MAPS` entry, all bypassing
 * `options[]` entirely — same principle as `select_variant`/`filter_category` below, one field
 * (the action, or the enum key) decides the whole list, nothing left to separately configure.
 */
function useResolvedDropdownGroups(
  options: DropdownOptionSource[],
  dropdownAction: DropdownAction | "",
  enumMapKey: EnumMapKey | "" | undefined,
  isEditing: boolean
) {
  const { language } = useActiveLanguage();
  const { data } = useBoundData();
  const { productsPage, customer, checkout } = useStore();
  const adapter = getEditorDataAdapter();
  const usesSampleData = useSampleDataInEditor();
  const sampleMode = isEditing && usesSampleData;

  const categories = useMemo(
    () => (sampleMode ? adapter.getSampleCategories() : productsPage.categories),
    [adapter, productsPage.categories, sampleMode]
  );

  return useMemo(() => {
    if (dropdownAction === "checkout_address") {
      const rows = sampleMode
        ? SAMPLE_ADDRESS_OPTIONS
        : customer.addresses.map((address) => ({
            value: address.addressId,
            label: formatAddressOption(address),
          }));
      return groupFromPairs(rows);
    }

    if (dropdownAction === "checkout_payment_method") {
      const rows = sampleMode
        ? SAMPLE_PAYMENT_OPTIONS
        : checkout.paymentMethods.map((method) => ({
            value: method.providerCode,
            label: method.displayName || method.providerCode,
          }));
      return groupFromPairs(rows);
    }

    if (enumMapKey && enumMapKey in ENUM_MAPS) {
      const entries = Object.entries(ENUM_MAPS[enumMapKey as keyof typeof ENUM_MAPS]).map(
        ([value, entry]) => ({ value, label: entry.label })
      );
      return groupFromPairs(entries);
    }

    if (dropdownAction === "select_variant") {
      return resolveDropdownGroups([PRODUCT_VARIANTS_SOURCE], { data, locale: language, categories });
    }

    if (dropdownAction === "filter_category") {
      return resolveDropdownGroups([CATEGORIES_SOURCE], { data, locale: language, categories });
    }

    return resolveDropdownGroups(options, { data, locale: language, categories });
  }, [
    options,
    dropdownAction,
    enumMapKey,
    sampleMode,
    customer.addresses,
    checkout.paymentMethods,
    data,
    language,
    categories,
  ]);
}

const ContentDropdownInner: ComponentConfig<ContentDropdownProps> = {
  label: "قائمة منسدلة",

  fields: {
    label: bilingualTextField({ label: "التسمية" }),
    name: { type: "text", label: "الاسم (للإرسال)" },
    placeholder: bilingualTextField({ label: "نص توضيحي" }),
    required: {
      type: "radio",
      label: "إلزامي",
      options: [
        { label: "نعم", value: true },
        { label: "لا", value: false },
      ],
    },
    options: {
      type: "array",
      label: "الخيارات",
      arrayFields: {
        mode: {
          type: "select",
          label: "مصدر القيم",
          options: SOURCE_MODE_OPTIONS,
        },
        groupLabel: bilingualTextField({
          label: "عنوان المجموعة (اختياري)",
          placeholderAr: "مثال: المقاس",
          placeholderEn: "e.g. Size",
        }),
        values: {
          type: "array",
          label: "القيم (للوضع الثابت)",
          arrayFields: {
            title: bilingualTextField({ label: "العنوان" }),
            value: { type: "text", label: "القيمة" },
          },
          defaultItemProps: {
            title: { ar: "خيار", en: "Option" } as BilingualString,
            value: "option",
          },
          getItemSummary: (item: { title?: BilingualString | string }) =>
            pickLang(item?.title) || "خيار",
        },
        sourcePath: {
          type: "text",
          label: "مسار المصفوفة (للمكرِّر)",
          placeholder: "variantMatrix.variants",
        },
        titlePath: {
          type: "text",
          label: "مسار العنوان داخل العنصر",
          placeholder: "attributes",
        },
        valuePath: {
          type: "text",
          label: "مسار القيمة داخل العنصر",
          placeholder: "variantId",
        },
      },
      defaultItemProps: {
        mode: "static",
        groupLabel: { ar: "", en: "" } as BilingualString,
        values: [
          {
            title: { ar: "خيار", en: "Option" } as BilingualString,
            value: "option",
          },
        ],
        sourcePath: "",
        titlePath: "",
        valuePath: "",
      },
      getItemSummary: (item: DropdownOptionSource) => {
        const label = pickLang(item?.groupLabel);
        if (label) return label;
        const mode = item?.mode ?? "static";
        if (mode === "bound") return item?.sourcePath || "مكرِّر";
        return MODE_SUMMARY[mode] ?? "خيارات";
      },
    } as any,
    dropdownAction: {
      type: "select",
      label: "الإجراء",
      options: [{ label: "بدون", value: "" }, ...DROPDOWN_ACTION_OPTIONS],
    },
    enumMapKey: {
      type: "select",
      label: "قائمة قيم ثابتة (Enum)",
      options: [{ label: "بدون", value: "" }, ...ENUM_MAP_OPTIONS],
    },
    defaultValue: { type: "text", label: "القيمة الافتراضية" },
    valueContext: bindPathField({
      label: "تعيين القيمة الابتدائية من بيانات الصفحة (اختياري)",
      placeholder: "product.defaultVariantId",
      hint: "يحل محل \"القيمة الافتراضية\" أعلاه عند توفره. يُتجاهل بينما يوجد إجراء (الإجراء يقرأ التحديد من مصدر آخر).",
    }),
    autoSelectFirst: {
      type: "radio",
      label: "اختيار أول قيمة تلقائياً",
      options: [
        { label: "نعم", value: true },
        { label: "لا", value: false },
      ],
    },
    hideWhenSingle: {
      type: "radio",
      label: "إخفاء عند عدم وجود خيارات متعددة",
      options: [
        { label: "نعم", value: true },
        { label: "لا", value: false },
      ],
    },
  },

  defaultProps: {
    label: { ar: "اختر", en: "Select" },
    name: "dropdown",
    placeholder: { ar: "اختر قيمة", en: "Choose a value" },
    required: false,
    options: [
      {
        mode: "static",
        groupLabel: { ar: "", en: "" },
        values: [
          { title: { ar: "الخيار الأول", en: "First option" }, value: "one" },
          { title: { ar: "الخيار الثاني", en: "Second option" }, value: "two" },
        ],
        sourcePath: "",
        titlePath: "",
        valuePath: "",
      },
    ],
    dropdownAction: "",
    enumMapKey: "",
    defaultValue: "",
    valueContext: null,
    autoSelectFirst: true,
    hideWhenSingle: false,
  },

  render: ({
    label,
    name,
    placeholder,
    required,
    options = [],
    dropdownAction = "",
    enumMapKey = "",
    defaultValue = "",
    autoSelectFirst = true,
    hideWhenSingle = false,
    valueContext,
    puck,
  }) => {
    const { language } = useActiveLanguage();
    const resolvedLabel = pickLang(label, language);
    const resolvedPlaceholder = pickLang(placeholder, language);

    const { data, selectedVariantId, setSelectedVariantId } = useBoundData();
    const { productsPage, actions, customer, checkout, returnDraft } = useStore();

    const groups = useResolvedDropdownGroups(options, dropdownAction, enumMapKey, puck.isEditing);

    const isVariantSelect = dropdownAction === "select_variant";
    const isCategoryFilter = dropdownAction === "filter_category";
    const isAddressSelect = dropdownAction === "checkout_address";
    const isPaymentMethodSelect = dropdownAction === "checkout_payment_method";
    const isReturnCondition = dropdownAction === "return_item_condition";

    // Merged in from ContentSelect: `return_item_condition` reads/writes the condition of the
    // order item this block is bound to (a repeat item on the returns page, not the page route).
    const orderItemId =
      typeof data?.item === "object" && data.item != null && "orderItemId" in data.item
        ? String((data.item as { orderItemId?: string }).orderItemId ?? "")
        : "";

    const initialValue = useBoundValue(defaultValue, valueContext);
    const [localValue, setLocalValue] = useState(initialValue);

    // Keep the uncontrolled case in sync when a preset binds the value.
    useEffect(() => {
      if (!valueContext?.path) return;
      setLocalValue(initialValue);
    }, [initialValue, valueContext?.path]);

    const firstGroupValue = firstDropdownValue(groups);
    const selectedValue = isVariantSelect
      ? (selectedVariantId ?? "")
      : isCategoryFilter
        ? (productsPage.selectedCategorySlug ?? "")
        : isAddressSelect
          ? (checkout.addressId ?? firstGroupValue)
          : isPaymentMethodSelect
            ? (checkout.paymentMethodCode ?? firstGroupValue)
            : isReturnCondition && orderItemId
              ? (returnDraft.items[orderItemId]?.condition ?? "OPENED")
              : localValue;

    // Bound pricing needs a variant before the shopper touches anything, so
    // adopt the first option once the repeater has resolved.
    useEffect(() => {
      if (!isVariantSelect || !autoSelectFirst || puck.isEditing) return;
      if (selectedVariantId || !firstGroupValue) return;
      setSelectedVariantId(firstGroupValue);
    }, [
      autoSelectFirst,
      firstGroupValue,
      isVariantSelect,
      puck.isEditing,
      selectedVariantId,
      setSelectedVariantId,
    ]);

    const handleChange = (next: string) => {
      setLocalValue(next);
      if (puck.isEditing) return;

      if (isVariantSelect) {
        setSelectedVariantId(next || null);
        return;
      }

      if (isCategoryFilter) {
        actions.productsPage.setCategory(
          next && next !== ALL_CATEGORY_VALUE ? next : null
        );
        return;
      }

      if (isAddressSelect) {
        actions.checkout.selectAddress(next);
        return;
      }

      if (isPaymentMethodSelect) {
        actions.checkout.selectPaymentMethod(next);
        return;
      }

      if (isReturnCondition && orderItemId) {
        actions.orders.setReturnItemCondition(orderItemId, next);
      }
    };

    const selectId = `cd-${name}`;
    const showEditorHint = puck.isEditing && groups.length === 0;

    // A store-bound select with nothing to pick from is a dead control — e.g. no saved address
    // yet. The empty state is handled by a sibling block instead (matches ContentSelect).
    if (!puck.isEditing && isBoundDropdownAction(dropdownAction) && groups.length === 0) {
      return <></>;
    }

    return (
      <div className={getClassName()}>
        {resolvedLabel.trim() ? (
          <label className={getClassName("label")} htmlFor={selectId}>
            {resolvedLabel}
            {required && <span className={getClassName("required")}>*</span>}
          </label>
        ) : null}
        <div className={getClassName("selectWrap")}>
          <select
            id={selectId}
            className={getClassName("select")}
            name={name}
            required={required}
            disabled={puck.isEditing}
            value={selectedValue}
            onChange={(event) => handleChange(event.target.value)}
            aria-label={
              !resolvedLabel.trim()
                ? resolvedPlaceholder || name
                : undefined
            }
            {...{ [SOOQ_INPUT_ATTR]: "" }}
          >
            <option value="" disabled={required}>
              {resolvedPlaceholder || "—"}
            </option>
            {showEditorHint ? (
              <option value="__empty__" disabled>
                لا توجد خيارات — تحقّق من مصدر القيم
              </option>
            ) : null}
            {groups.map((group, groupIndex) => {
              const items = group.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.title}
                </option>
              ));

              return group.label ? (
                <optgroup key={`${group.label}-${groupIndex}`} label={group.label}>
                  {items}
                </optgroup>
              ) : (
                <React.Fragment key={`group-${groupIndex}`}>{items}</React.Fragment>
              );
            })}
          </select>
          <ChevronDown
            className={getClassName("chevron")}
            aria-hidden="true"
            size={18}
          />
        </div>
      </div>
    );
  },
};

const WithLayoutContentDropdown = withLayout(ContentDropdownInner);

const LayoutRender = WithLayoutContentDropdown.render;

/**
 * `hideWhenSingle` has to drop the layout wrapper too, not just the select —
 * an empty wrapper still consumes a slot in its parent's flex `gap`. Sits
 * outside `withLayout` for that reason, and never hides while editing so the
 * merchant can still select the block.
 */
const ContentDropdownGate = ((props: any) => {
  const groups = useResolvedDropdownGroups(
    props.options ?? [],
    props.dropdownAction ?? "",
    props.enumMapKey ?? "",
    props.puck?.isEditing === true
  );

  const optionCount = groups.reduce(
    (total, group) => total + group.options.length,
    0
  );

  if (props.hideWhenSingle && !props.puck?.isEditing && optionCount < 2) {
    return null;
  }

  return <LayoutRender {...props} />;
}) as typeof LayoutRender;

export const ContentDropdown: typeof WithLayoutContentDropdown = {
  ...WithLayoutContentDropdown,
  render: ContentDropdownGate,
  resolveFields: (data, params) => {
    const resolver = (
      WithLayoutContentDropdown as {
        resolveFields?: (typeof WithLayoutContentDropdown)["resolveFields"];
      }
    ).resolveFields;
    const base = resolver?.(data, params);
    const dropdownAction = data.props.dropdownAction ?? "";
    const enumMapKey = data.props.enumMapKey ?? "";

    const apply = (f: Record<string, unknown>) => {
      const next = { ...f };
      // Every action (and `enumMapKey`) owns its whole option list — `options[]` only applies to
      // the plain, unwired dropdown. Hiding it here is the "one field decides everything"
      // principle: there is nothing left in `options[]` for these to read.
      if (dropdownAction || enumMapKey) {
        delete next.options;
      }
      // A wired action owns the selection — a default value (typed or bound) would fight it.
      if (dropdownAction) {
        delete next.defaultValue;
        delete next.valueContext;
      } else {
        delete next.autoSelectFirst;
      }
      return next as Fields<WithLayout<ContentDropdownProps>>;
    };

    if (base != null && typeof (base as Promise<unknown>).then === "function") {
      return (base as Promise<Record<string, unknown>>).then(apply);
    }
    if (base == null) {
      return apply(
        ContentDropdownInner.fields as unknown as Record<string, unknown>
      );
    }
    return apply(base as Record<string, unknown>);
  },
};
