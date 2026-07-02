"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ComponentConfig } from "@/core/types";
import { useBoundData } from "../../binding";

export type ProductVariantsProps = {
  showOptionLabels: boolean;
  chipStyle: "pill" | "card";
};

type OptionValue = {
  id: string;
  label: string;
  colorHex?: string | null;
};

type OptionGroup = {
  key: string;
  label: string;
  values: OptionValue[];
};

type VariantRow = {
  variantId: string;
  valueIds: Set<string>;
  isActive: boolean;
  inStock: boolean;
};

function optionLabel(
  option: Record<string, unknown>,
  locale: "ar" | "en"
): string {
  const ar = String(option.optionNameAr ?? option.titleAr ?? "").trim();
  const en = String(option.optionNameEn ?? option.titleEn ?? "").trim();
  return locale === "ar" ? ar || en : en || ar;
}

function valueLabel(
  value: Record<string, unknown>,
  locale: "ar" | "en"
): string {
  const ar = String(value.valueAr ?? value.titleAr ?? "").trim();
  const en = String(value.valueEn ?? value.titleEn ?? "").trim();
  return locale === "ar" ? ar || en : en || ar;
}

function parseVariantMatrix(
  data: Record<string, unknown> | null,
  locale: "ar" | "en"
): { optionGroups: OptionGroup[]; variants: VariantRow[] } {
  if (!data) return { optionGroups: [], variants: [] };

  const matrix = (data.variantMatrix ?? {}) as Record<string, unknown>;
  const rawOptions = Array.isArray(matrix.options)
    ? (matrix.options as Array<Record<string, unknown>>)
    : [];
  const rawVariants = Array.isArray(matrix.variants)
    ? (matrix.variants as Array<Record<string, unknown>>)
    : [];

  const optionGroups: OptionGroup[] = rawOptions
    .map((option) => {
      const key = optionLabel(option, locale);
      if (!key) return null;

      const values = (
        (option.values ?? option.optionValues ?? []) as Array<
          Record<string, unknown>
        >
      )
        .map((value) => {
          const id = String(value.optionValueId ?? value.id ?? "").trim();
          const label = valueLabel(value, locale);
          if (!id || !label) return null;
          return {
            id,
            label,
            colorHex: value.colorHex as string | null | undefined,
          };
        })
        .filter((value): value is OptionValue => value != null);

      if (values.length === 0) return null;

      return { key, label: key, values };
    })
    .filter((group): group is OptionGroup => group != null);

  const variants: VariantRow[] = rawVariants
    .map((variant) => {
      const variantId = String(variant.variantId ?? "").trim();
      if (!variantId) return null;

      const valueIds = new Set<string>();
      for (const optionValue of (variant.optionValues ?? []) as Array<
        Record<string, unknown>
      >) {
        const id = String(optionValue.optionValueId ?? optionValue.id ?? "").trim();
        if (id) valueIds.add(id);
      }

      const stockQty =
        variant.stockQty == null ? null : Number(variant.stockQty);
      const inStock = stockQty == null || stockQty > 0;

      return {
        variantId,
        valueIds,
        isActive: variant.isActive !== false,
        inStock,
      };
    })
    .filter((variant): variant is VariantRow => variant != null);

  return { optionGroups, variants };
}

function findMatchingVariant(
  variants: VariantRow[],
  selections: Record<string, string>
): VariantRow | null {
  const selectedIds = Object.values(selections).filter(Boolean);
  if (selectedIds.length === 0) return variants.find((v) => v.isActive) ?? null;

  return (
    variants.find((variant) => {
      if (!variant.isActive) return false;
      return selectedIds.every((id) => variant.valueIds.has(id));
    }) ?? null
  );
}

function isValueAvailable(
  variants: VariantRow[],
  selections: Record<string, string>,
  optionKey: string,
  valueId: string
): boolean {
  const nextSelections = { ...selections, [optionKey]: valueId };
  const selectedIds = Object.values(nextSelections).filter(Boolean);

  return variants.some(
    (variant) =>
      variant.isActive &&
      variant.inStock &&
      selectedIds.every((id) => variant.valueIds.has(id))
  );
}

export const ProductVariants: ComponentConfig<ProductVariantsProps> = {
  label: "متغيّرات المنتج",
  fields: {
    showOptionLabels: {
      type: "radio",
      label: "عرض تسميات الخيارات",
      options: [
        { label: "نعم", value: true },
        { label: "لا", value: false },
      ],
    },
    chipStyle: {
      type: "radio",
      label: "نمط الاختيار",
      options: [
        { label: "حبة", value: "pill" },
        { label: "بطاقة", value: "card" },
      ],
    },
  },
  defaultProps: {
    showOptionLabels: true,
    chipStyle: "pill",
  },
  render: ({ showOptionLabels, chipStyle }) => {
    const { data, language, setSelectedVariantId } = useBoundData();
    const { optionGroups, variants } = useMemo(
      () => parseVariantMatrix(data, language),
      [data, language]
    );

    const [selections, setSelections] = useState<Record<string, string>>({});

    useEffect(() => {
      if (variants.length === 0) {
        setSelections({});
        setSelectedVariantId(null);
        return;
      }

      const firstActive = variants.find((variant) => variant.isActive) ?? variants[0];
      const initial: Record<string, string> = {};

      for (const group of optionGroups) {
        const match = group.values.find((value) =>
          firstActive?.valueIds.has(value.id)
        );
        if (match) initial[group.key] = match.id;
      }

      setSelections(initial);
      setSelectedVariantId(firstActive?.variantId ?? null);
    }, [data, optionGroups, variants, setSelectedVariantId]);

    if (!data) {
      return (
        <div style={{ color: "var(--theme-neutral, #64748b)", fontSize: 14 }}>
          اختر منتجاً لعرض المتغيّرات
        </div>
      );
    }

    if (optionGroups.length === 0) {
      return null;
    }

    const handleSelect = (optionKey: string, valueId: string) => {
      const nextSelections = { ...selections, [optionKey]: valueId };
      setSelections(nextSelections);

      const matched = findMatchingVariant(variants, nextSelections);
      setSelectedVariantId(matched?.variantId ?? null);
    };

    const chipRadius = chipStyle === "pill" ? 999 : 8;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
        {optionGroups.map((group) => (
          <div key={group.key}>
            {showOptionLabels ? (
              <div
                style={{
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--theme-text, #0f172a)",
                }}
              >
                {group.label}
              </div>
            ) : null}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {group.values.map((value) => {
                const isSelected = selections[group.key] === value.id;
                const available = isValueAvailable(
                  variants,
                  selections,
                  group.key,
                  value.id
                );

                return (
                  <button
                    key={value.id}
                    type="button"
                    disabled={!available}
                    onClick={() => handleSelect(group.key, value.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: chipStyle === "card" ? "10px 14px" : "8px 14px",
                      borderRadius: chipRadius,
                      border: isSelected
                        ? "2px solid var(--theme-primary, #3b82f6)"
                        : "1px solid var(--theme-border, #e2e8f0)",
                      background: isSelected
                        ? "var(--theme-primary-muted, #eff6ff)"
                        : "var(--theme-surface, #fff)",
                      color: available
                        ? "var(--theme-text, #0f172a)"
                        : "var(--theme-neutral, #94a3b8)",
                      cursor: available ? "pointer" : "not-allowed",
                      opacity: available ? 1 : 0.5,
                      fontSize: 14,
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    {value.colorHex ? (
                      <span
                        aria-hidden
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          background: value.colorHex,
                          border: "1px solid rgba(0,0,0,0.1)",
                          flexShrink: 0,
                        }}
                      />
                    ) : null}
                    {value.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  },
};
