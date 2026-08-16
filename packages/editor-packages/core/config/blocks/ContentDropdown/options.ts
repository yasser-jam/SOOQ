/**
 * Option-source resolution for the ContentDropdown block.
 *
 * A dropdown owns a list of **option sources** (`options[]`). Each source is
 * one of three modes:
 *
 *   - `"static"`     — values the merchant typed by hand (`values[]`).
 *   - `"bound"`      — a *repeater* over an array inside the bound payload:
 *                      `sourcePath` points at the array, `titlePath` /
 *                      `valuePath` point INSIDE each row. This is the
 *                      product-variant case on a product-detail page
 *                      (`variantMatrix.variants` → `attributes` / `variantId`).
 *   - `"categories"` — the storefront category list from `StoreContext`.
 *
 * Kept free of React so the mapping rules stay unit-testable.
 */
import { resolveValueContext } from "../../binding";
import type { CategoryRef } from "../../data-adapter/types";
import { pickLang, type BilingualString } from "../../fields/BilingualText";

export type DropdownSourceMode = "static" | "bound" | "categories";

export type DropdownStaticValue = {
  title: BilingualString | string;
  value: string;
};

export type DropdownOptionSource = {
  mode: DropdownSourceMode;
  /** Optional `<optgroup>` label — empty renders the options ungrouped. */
  groupLabel: BilingualString | string;
  /** `mode: "static"` — the hand-written values. */
  values: DropdownStaticValue[];
  /** `mode: "bound"` — path to an **array** in the bound payload. */
  sourcePath: string;
  /** `mode: "bound"` — path inside each row for the visible title. */
  titlePath: string;
  /** `mode: "bound"` — path inside each row for the submitted value. */
  valuePath: string;
};

export type ResolvedDropdownOption = {
  title: string;
  value: string;
};

export type ResolvedDropdownGroup = {
  /** Empty = render the options without an `<optgroup>` wrapper. */
  label: string;
  options: ResolvedDropdownOption[];
};

export type DropdownResolveContext = {
  data: Record<string, unknown> | null;
  locale: "ar" | "en";
  categories: CategoryRef[];
};

/**
 * Bilingual API fields come as `valueAr` / `valueEn` siblings, so a merchant
 * who types `value` gets the right language without knowing the suffix.
 * `""` keeps the literal path they typed in the candidate list.
 */
const LOCALE_SUFFIXES: Record<"ar" | "en", string[]> = {
  ar: ["Ar", "", "En"],
  en: ["En", "", "Ar"],
};

/** Nested objects are joined, not walked — one level is enough for `attributes`. */
const MAX_JOIN_DEPTH = 2;

function stringifyOptionText(value: unknown, depth = 0): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (depth >= MAX_JOIN_DEPTH) return "";

  // A variant's `attributes` map ({ Color: "أحمر", Size: "M" }) reads best as
  // "أحمر / M" — the same label a variant chip would show.
  const parts = Array.isArray(value)
    ? value
    : typeof value === "object"
      ? Object.values(value as Record<string, unknown>)
      : [];

  return parts
    .map((part) => stringifyOptionText(part, depth + 1))
    .filter(Boolean)
    .join(" / ");
}

/**
 * Resolve one field of a repeater row. An empty path means "the row itself",
 * which only makes sense for arrays of primitives (`["S", "M", "L"]`).
 */
function resolveRowField(
  row: unknown,
  path: string,
  locale: "ar" | "en"
): string {
  const trimmed = path.trim();

  if (!trimmed) {
    return row != null && typeof row === "object" ? "" : stringifyOptionText(row);
  }

  // `optionValues[].value` — map over a NESTED array and join the parts. A
  // storefront variant carries its labels as `optionValues[{ valueAr, … }]`
  // with no flat title, so this is what composes one row into "أحمر / M".
  const wildcard = trimmed.indexOf("[]");
  if (wildcard !== -1) {
    const prefix = trimmed.slice(0, wildcard);
    const rest = trimmed.slice(wildcard + 2).replace(/^\./, "");
    const nested = prefix
      ? resolveValueContext(prefix, row, { locale })
      : row;

    if (!Array.isArray(nested)) return "";

    return nested
      .map((item) => resolveRowField(item, rest, locale))
      .filter(Boolean)
      .join(" / ");
  }

  for (const suffix of LOCALE_SUFFIXES[locale]) {
    const resolved = resolveValueContext(`${trimmed}${suffix}`, row, { locale });
    const text = stringifyOptionText(resolved);
    if (text) return text;
  }

  return "";
}

function resolveStaticSource(
  source: DropdownOptionSource,
  locale: "ar" | "en"
): ResolvedDropdownOption[] {
  return (source.values ?? [])
    .map((item) => {
      const value = String(item?.value ?? "").trim();
      const title = String(pickLang(item?.title, locale) ?? "").trim();
      if (!value && !title) return null;
      // A value-less option still selects — fall back to its own title.
      return { title: title || value, value: value || title };
    })
    .filter((option): option is ResolvedDropdownOption => option != null);
}

function resolveBoundSource(
  source: DropdownOptionSource,
  context: DropdownResolveContext
): ResolvedDropdownOption[] {
  const sourcePath = (source.sourcePath ?? "").trim();
  if (!sourcePath || context.data == null) return [];

  const rows = resolveValueContext(sourcePath, context.data, {
    locale: context.locale,
  });
  if (!Array.isArray(rows)) return [];

  const options: ResolvedDropdownOption[] = [];

  for (const row of rows) {
    const value = resolveRowField(row, source.valuePath ?? "", context.locale);
    if (!value) continue;
    const title = resolveRowField(row, source.titlePath ?? "", context.locale);
    options.push({ title: title || value, value });
  }

  return options;
}

function resolveCategoriesSource(
  context: DropdownResolveContext
): ResolvedDropdownOption[] {
  return (context.categories ?? [])
    .map((category) => {
      const slug = String(category?.slug ?? "").trim();
      if (!slug) return null;
      const name =
        context.locale === "en"
          ? (category.nameEn?.trim() || category.nameAr?.trim())
          : (category.nameAr?.trim() || category.nameEn?.trim());
      return { title: name || slug, value: slug };
    })
    .filter((option): option is ResolvedDropdownOption => option != null);
}

/**
 * Flatten every option source into render-ready `<optgroup>`s.
 *
 * Values are de-duplicated across the WHOLE dropdown (first wins) — a `<select>`
 * can't tell two options with the same value apart, so a repeater that lists the
 * same variant twice would break selection. Empty groups are dropped.
 */
export function resolveDropdownGroups(
  sources: DropdownOptionSource[] | undefined,
  context: DropdownResolveContext
): ResolvedDropdownGroup[] {
  const groups: ResolvedDropdownGroup[] = [];
  const seen = new Set<string>();

  for (const source of sources ?? []) {
    if (!source) continue;

    const mode: DropdownSourceMode = source.mode ?? "static";
    const resolved =
      mode === "bound"
        ? resolveBoundSource(source, context)
        : mode === "categories"
          ? resolveCategoriesSource(context)
          : resolveStaticSource(source, context.locale);

    const options: ResolvedDropdownOption[] = [];
    for (const option of resolved) {
      if (seen.has(option.value)) continue;
      seen.add(option.value);
      options.push(option);
    }

    if (options.length === 0) continue;

    groups.push({
      label: String(pickLang(source.groupLabel, context.locale) ?? "").trim(),
      options,
    });
  }

  return groups;
}

/** First selectable value across all groups — used to seed bound selectors. */
export function firstDropdownValue(
  groups: ResolvedDropdownGroup[]
): string {
  for (const group of groups) {
    const first = group.options[0];
    if (first) return first.value;
  }
  return "";
}
