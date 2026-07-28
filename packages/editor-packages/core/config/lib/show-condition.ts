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
