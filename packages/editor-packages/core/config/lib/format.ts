/**
 * Currency formatter for SOOQ.
 *
 * Currency is a tenant-level setting (SRS DSN-010 / CUR module). Blocks must
 * NEVER hardcode "USD". Default to SYP per SRS §1.4 (Syria-first market).
 * The web/mobile renderer should pass `currency` from store_config theme.
 */
import type { ValueContextFormat } from "../binding/types";

export function formatPrice(
  amount: number,
  currency: string = "SYP",
  locale: string = "ar-SY"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "SYP" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(locale)} ${currency}`;
  }
}

export function formatNumber(
  value: number,
  locale: string = "ar-SY"
): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatDate(value: string | Date): string | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(value: string | Date): string | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseNumeric(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function applyValueFormat(
  value: unknown,
  format: ValueContextFormat,
  currency?: string
): string | undefined {
  switch (format) {
    case "money": {
      const amount = parseNumeric(value);
      if (amount == null) return undefined;
      return formatPrice(amount, currency ?? "SYP");
    }
    case "number": {
      const amount = parseNumeric(value);
      if (amount == null) return undefined;
      return formatNumber(amount);
    }
    case "date": {
      if (value == null) return undefined;
      if (typeof value !== "string" && !(value instanceof Date)) return undefined;
      return formatDate(value as string | Date) ?? undefined;
    }
    case "datetime": {
      if (value == null) return undefined;
      if (typeof value !== "string" && !(value instanceof Date)) return undefined;
      return formatDateTime(value as string | Date) ?? undefined;
    }
    default:
      return undefined;
  }
}
