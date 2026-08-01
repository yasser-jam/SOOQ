import { isBilingualValue, type BilingualString } from "../../lib/bilingual";
import type { SiteData } from "./site-data";

type JsonRecord = Record<string, unknown>;

const isPlainObject = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readId = (props: unknown): string | null => {
  if (!isPlainObject(props)) return null;
  return typeof props.id === "string" && props.id ? props.id : null;
};

/** Index every component node by `props.id` (first wins). */
function indexById(
  nodes: unknown,
  out: Map<string, JsonRecord> = new Map()
): Map<string, JsonRecord> {
  if (!Array.isArray(nodes)) return out;
  for (const node of nodes) {
    if (!isPlainObject(node)) continue;
    const props = node.props;
    const id = readId(props);
    if (id && isPlainObject(props) && !out.has(id)) {
      out.set(id, props);
    }
    if (isPlainObject(props)) {
      for (const value of Object.values(props)) {
        if (Array.isArray(value)) indexById(value, out);
      }
    }
    if (Array.isArray(node.content)) indexById(node.content, out);
  }
  return out;
}

function indexSiteById(site: SiteData): Map<string, JsonRecord> {
  const out = new Map<string, JsonRecord>();
  for (const page of site.pages ?? []) {
    indexById(page.content, out);
  }
  const zones = site.zones ?? {};
  for (const zone of Object.values(zones)) {
    indexById(zone, out);
  }
  return out;
}

function countEmptyEn(value: unknown): { empty: number; filled: number } {
  let empty = 0;
  let filled = 0;

  const walk = (node: unknown) => {
    if (isBilingualValue(node)) {
      const ar = node.ar.trim();
      const en = node.en.trim();
      if (ar && !en) empty += 1;
      else if (ar && en) filled += 1;
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (isPlainObject(node)) {
      Object.values(node).forEach(walk);
    }
  };

  walk(value);
  return { empty, filled };
}

/**
 * True when the site looks like a bilingual theme that was saved before
 * English copy was filled in (many `ar` strings, almost no `en`).
 */
export function needsBilingualBackfill(site: SiteData): boolean {
  const { empty, filled } = countEmptyEn(site);
  if (empty === 0) return false;
  // Prefer backfill when empty EN dominates, or there is a meaningful gap.
  if (filled === 0 && empty >= 5) return true;
  return empty >= 10 && empty > filled;
}

function backfillProps(target: JsonRecord, source: JsonRecord): number {
  let filled = 0;

  for (const [key, targetValue] of Object.entries(target)) {
    const sourceValue = source[key];

    if (isBilingualValue(targetValue) && isBilingualValue(sourceValue)) {
      const next: BilingualString = {
        ar: targetValue.ar,
        en: targetValue.en,
      };
      if (!next.en.trim() && sourceValue.en.trim()) {
        next.en = sourceValue.en;
        target[key] = next;
        filled += 1;
      }
      continue;
    }

    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      // Array of components — match by id when possible.
      const sourceById = indexById(sourceValue);
      for (const item of targetValue) {
        if (!isPlainObject(item) || !isPlainObject(item.props)) continue;
        const id = readId(item.props);
        const sourceProps = id ? sourceById.get(id) : undefined;
        if (sourceProps) {
          filled += backfillProps(item.props as JsonRecord, sourceProps);
        }
      }
      // Also walk array-of-objects that aren't components (e.g. accordion items)
      // by index when lengths match and items lack ids.
      const len = Math.min(targetValue.length, sourceValue.length);
      for (let i = 0; i < len; i += 1) {
        const t = targetValue[i];
        const s = sourceValue[i];
        if (isPlainObject(t) && isPlainObject(s) && !readId(t) && !t.type) {
          filled += backfillProps(t, s);
        }
      }
      continue;
    }

    if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
      filled += backfillProps(targetValue, sourceValue);
    }
  }

  return filled;
}

/**
 * Copy non-empty `en` strings from `source` into empty `en` slots on `target`,
 * matching components by `props.id` and page meta by path.
 * Mutates and returns `target`.
 */
export function backfillEmptyBilingual(
  target: SiteData,
  source: SiteData
): { site: SiteData; filledCount: number } {
  let filledCount = 0;
  const sourceById = indexSiteById(source);

  // Page meta (name / title / description)
  const sourcePagesByPath = new Map(
    (source.pages ?? []).map((page) => [page.path, page] as const)
  );
  for (const page of target.pages ?? []) {
    const srcPage = sourcePagesByPath.get(page.path);
    if (!srcPage) continue;
    for (const key of ["name", "title", "description"] as const) {
      const t = page[key];
      const s = srcPage[key];
      if (isBilingualValue(t) && isBilingualValue(s) && !t.en.trim() && s.en.trim()) {
        page[key] = { ar: t.ar, en: s.en };
        filledCount += 1;
      }
    }
    filledCount += backfillNodeList(page.content, sourceById);
  }

  const targetZones = target.zones ?? {};
  for (const [zoneKey, zone] of Object.entries(targetZones)) {
    filledCount += backfillNodeList(zone, sourceById);
    // Also try same zone from source by walking ids (already covered via sourceById)
    void zoneKey;
  }

  // Root bilingual title etc.
  const targetRoot = (target.root?.props ?? {}) as JsonRecord;
  const sourceRoot = (source.root?.props ?? {}) as JsonRecord;
  filledCount += backfillProps(targetRoot, sourceRoot);

  return { site: target, filledCount };
}

function backfillNodeList(
  nodes: unknown,
  sourceById: Map<string, JsonRecord>
): number {
  let filled = 0;
  if (!Array.isArray(nodes)) return filled;

  for (const node of nodes) {
    if (!isPlainObject(node) || !isPlainObject(node.props)) continue;
    const props = node.props as JsonRecord;
    const id = readId(props);
    const sourceProps = id ? sourceById.get(id) : undefined;
    if (sourceProps) {
      filled += backfillProps(props, sourceProps);
    }
    for (const value of Object.values(props)) {
      if (Array.isArray(value)) {
        filled += backfillNodeList(value, sourceById);
      }
    }
  }

  return filled;
}
