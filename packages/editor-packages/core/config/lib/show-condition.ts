/**
 * Auth-aware visibility for Site JSON blocks and nav items.
 *
 * Persisted as `showCondition` on block props (and on header / NavMenu items).
 * Evaluated at render time against `useStore().auth.isLoggedIn`.
 */

export type ShowCondition = "always" | "loggedIn" | "loggedOut";

export const DEFAULT_SHOW_CONDITION: ShowCondition = "always";

export const SHOW_CONDITION_OPTIONS: {
  label: string;
  value: ShowCondition;
}[] = [
  { label: "دائماً", value: "always" },
  { label: "للمسجّلين فقط", value: "loggedIn" },
  { label: "لغير المسجّلين فقط", value: "loggedOut" },
];

/** Puck select field — lives under the «متقدم» tab via metadata.group. */
export const showConditionField = {
  type: "select" as const,
  label: "شرط الظهور",
  options: SHOW_CONDITION_OPTIONS,
  metadata: { group: "advanced" as const },
};

export function normalizeShowCondition(
  value: unknown
): ShowCondition {
  if (value === "loggedIn" || value === "loggedOut" || value === "always") {
    return value;
  }
  return DEFAULT_SHOW_CONDITION;
}

/**
 * Whether content should render for the current auth state.
 * In the editor (`isEditing`), always show so merchants can select/edit blocks.
 */
export function shouldShowForCondition(
  condition: unknown,
  isLoggedIn: boolean,
  isEditing = false
): boolean {
  if (isEditing) return true;
  switch (normalizeShowCondition(condition)) {
    case "loggedIn":
      return isLoggedIn;
    case "loggedOut":
      return !isLoggedIn;
    case "always":
    default:
      return true;
  }
}

// ─── Data-driven visibility ───────────────────────────────────────────────────

export type DataConditionOp = "truthy" | "falsy" | "eq" | "neq" | "in";

export type DataConditionValue = string | number | boolean;

export type DataCondition = {
  path: string;
  op?: DataConditionOp;
  value?: DataConditionValue | DataConditionValue[];
};

function isEmptyValue(value: unknown): boolean {
  if (value == null || value === false) return true;
  if (typeof value === "number" && value === 0) return true;
  if (typeof value === "string" && !value.trim()) return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value as object).length === 0
  ) {
    return true;
  }
  return false;
}

export function normalizeDataCondition(value: unknown): DataCondition | null {
  if (value == null || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.path !== "string" || !record.path.trim()) return null;

  const op = record.op;
  const normalizedOp: DataConditionOp =
    op === "truthy" ||
    op === "falsy" ||
    op === "eq" ||
    op === "neq" ||
    op === "in"
      ? op
      : "truthy";

  return {
    path: record.path.trim(),
    op: normalizedOp,
    value: record.value as DataCondition["value"],
  };
}

function stringifyConditionValue(value: unknown): string {
  if (value == null) return "";
  return String(value);
}

export function evaluateDataCondition(
  condition: DataCondition,
  resolved: unknown
): boolean {
  const op = condition.op ?? "truthy";

  switch (op) {
    case "truthy":
      return !isEmptyValue(resolved);
    case "falsy":
      return isEmptyValue(resolved);
    case "eq":
      return (
        stringifyConditionValue(resolved) ===
        stringifyConditionValue(condition.value)
      );
    case "neq":
      return (
        stringifyConditionValue(resolved) !==
        stringifyConditionValue(condition.value)
      );
    case "in": {
      const expected = condition.value;
      if (!Array.isArray(expected)) return false;
      const actual = stringifyConditionValue(resolved);
      return expected.some(
        (entry) => stringifyConditionValue(entry) === actual
      );
    }
    default:
      return true;
  }
}
