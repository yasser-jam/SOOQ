"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ComponentConfig, Fields } from "@/core/types";
import { getClassNameFactory } from "@/core/lib";
import { WithLayout, withLayout } from "../../components/Layout";
import { SOOQ_INPUT_ATTR } from "../../lib/login-events";
import {
  DROPDOWN_ACTION_OPTIONS,
  type DropdownAction,
} from "../../content/dropdown-actions";
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
import { useActiveLanguage } from "../../locale/LanguageContext";
import { ALL_CATEGORY_VALUE } from "../ButtonGroup/pagination-utils";
import {
  firstDropdownValue,
  resolveDropdownGroups,
  type DropdownOptionSource,
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
  /** Initial selection when no action is wired (ignored while bound). */
  defaultValue: string;
  /** Select the first option on mount so bound pricing has a variant. */
  autoSelectFirst: boolean;
  valueContext?: ValueContext | null;
}>;

const SOURCE_MODE_OPTIONS = [
  { label: "قيم ثابتة", value: "static" },
  { label: "مكرِّر (من البيانات المرتبطة)", value: "bound" },
  { label: "تصنيفات المتجر", value: "categories" },
];

const MODE_SUMMARY: Record<string, string> = {
  static: "قيم ثابتة",
  bound: "مكرِّر",
  categories: "تصنيفات",
};

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
    defaultValue: { type: "text", label: "القيمة الافتراضية" },
    autoSelectFirst: {
      type: "radio",
      label: "اختيار أول قيمة تلقائياً",
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
    defaultValue: "",
    autoSelectFirst: true,
  },

  render: ({
    label,
    name,
    placeholder,
    required,
    options = [],
    dropdownAction = "",
    defaultValue = "",
    autoSelectFirst = true,
    valueContext,
    puck,
  }) => {
    const { language } = useActiveLanguage();
    const resolvedLabel = pickLang(label, language);
    const resolvedPlaceholder = pickLang(placeholder, language);

    const { data, selectedVariantId, setSelectedVariantId } = useBoundData();
    const { productsPage, actions } = useStore();
    const adapter = getEditorDataAdapter();
    const usesSampleData = useSampleDataInEditor();
    const sampleMode = puck.isEditing && usesSampleData;

    const categories = useMemo(
      () => (sampleMode ? adapter.getSampleCategories() : productsPage.categories),
      [adapter, productsPage.categories, sampleMode]
    );

    const groups = useMemo(
      () => resolveDropdownGroups(options, { data, locale: language, categories }),
      [options, data, language, categories]
    );

    const isVariantSelect = dropdownAction === "select_variant";
    const isCategoryFilter = dropdownAction === "filter_category";
    const isActionBound = isVariantSelect || isCategoryFilter;

    const initialValue = useBoundValue(defaultValue, valueContext);
    const [localValue, setLocalValue] = useState(initialValue);

    // Keep the uncontrolled case in sync when a preset binds the value.
    useEffect(() => {
      if (!valueContext?.path) return;
      setLocalValue(initialValue);
    }, [initialValue, valueContext?.path]);

    const selectedValue = isVariantSelect
      ? (selectedVariantId ?? "")
      : isCategoryFilter
        ? (productsPage.selectedCategorySlug ?? "")
        : localValue;

    // Bound pricing needs a variant before the shopper touches anything, so
    // adopt the first option once the repeater has resolved.
    const firstValue = firstDropdownValue(groups);
    useEffect(() => {
      if (!isVariantSelect || !autoSelectFirst || puck.isEditing) return;
      if (selectedVariantId || !firstValue) return;
      setSelectedVariantId(firstValue);
    }, [
      autoSelectFirst,
      firstValue,
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
      }
    };

    const selectId = `cd-${name}`;
    const showEditorHint = puck.isEditing && groups.length === 0;

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

export const ContentDropdown: typeof WithLayoutContentDropdown = {
  ...WithLayoutContentDropdown,
  resolveFields: (data, params) => {
    const resolver = (
      WithLayoutContentDropdown as {
        resolveFields?: (typeof WithLayoutContentDropdown)["resolveFields"];
      }
    ).resolveFields;
    const base = resolver?.(data, params);
    const dropdownAction = data.props.dropdownAction ?? "";

    const apply = (f: Record<string, unknown>) => {
      const next = { ...f };
      // A wired action owns the selection — a default value would fight it.
      if (dropdownAction) {
        delete next.defaultValue;
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
