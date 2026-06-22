"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Variant } from "./types";

export type AttributeGroup = {
  name: string;
  values: string[];
};

export function useProductVariants(variants: Variant[]) {
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  const activeVariants = useMemo(
    () => variants.filter((variant) => variant.isActive !== false),
    [variants]
  );

  const attributeGroups: AttributeGroup[] = useMemo(() => {
    const groups = new Map<string, Set<string>>();

    for (const variant of activeVariants) {
      for (const [axis, value] of Object.entries(variant.attributes ?? {})) {
        if (!axis || !value) continue;
        if (!groups.has(axis)) groups.set(axis, new Set());
        groups.get(axis)!.add(value);
      }
    }

    return Array.from(groups.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values),
    }));
  }, [activeVariants]);

  useEffect(() => {
    if (attributeGroups.length === 0) {
      setSelectedAttributes({});
      return;
    }

    setSelectedAttributes((current) => {
      const next: Record<string, string> = {};
      for (const group of attributeGroups) {
        const existing = current[group.name];
        next[group.name] =
          existing && group.values.includes(existing) ? existing : group.values[0] ?? "";
      }
      return next;
    });
  }, [attributeGroups]);

  const selectedVariant = useMemo(() => {
    if (activeVariants.length === 0) return null;
    if (Object.keys(selectedAttributes).length === 0) return activeVariants[0] ?? null;

    return (
      activeVariants.find((variant) => {
        const attrs = variant.attributes ?? {};
        return Object.entries(selectedAttributes).every(([axis, value]) => attrs[axis] === value);
      }) ?? null
    );
  }, [activeVariants, selectedAttributes]);

  const selectAttribute = useCallback((axis: string, value: string) => {
    setSelectedAttributes((current) => ({ ...current, [axis]: value }));
  }, []);

  const isCombinationAvailable =
    activeVariants.length === 0 || attributeGroups.length === 0 || selectedVariant !== null;

  return {
    selectedVariant,
    selectedAttributes,
    attributeGroups,
    selectAttribute,
    isCombinationAvailable,
  };
}
