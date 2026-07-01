"use client";

import type { ValueContext } from "./types";
import { useBoundData } from "./BoundDataContext";
import { resolveValueContextAsString } from "./resolve-value-context";

export function useBoundValue(
  staticValue: string,
  valueContext?: ValueContext | null
): string {
  const { data, language } = useBoundData();

  if (!valueContext?.path || data == null) {
    return staticValue;
  }

  const resolved = resolveValueContextAsString(valueContext.path, data, {
    locale: language,
  });

  if (resolved) return resolved;
  if (valueContext.fallbackToStatic !== false) return staticValue;
  return "";
}
