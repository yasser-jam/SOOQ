"use client";

import type { ValueContext } from "./types";
import { useBoundData } from "./BoundDataContext";
import {
  resolveValueContext,
  resolveValueContextAsString,
} from "./resolve-value-context";

export function useBoundValue(
  staticValue: string,
  valueContext?: ValueContext | null
): string {
  const { data, language } = useBoundData();

  if (!valueContext?.path || data == null) {
    return staticValue;
  }

  const currency =
    valueContext.currencyPath?.trim()
      ? resolveValueContextAsString(valueContext.currencyPath, data, {
          locale: language,
        })
      : undefined;

  const resolved = resolveValueContextAsString(valueContext.path, data, {
    locale: language,
    format: valueContext.format,
    currency,
  });

  if (resolved) return resolved;
  if (valueContext.fallbackToStatic !== false) return staticValue;
  return "";
}
