/**
 * Shared helper for bound blocks' `resolveData`: only emit a `metadata` prop
 * change when the derived metadata actually differs from what's stored.
 *
 * Returning `{}` (instead of a fresh `{ props: { metadata } }` object every
 * run) is what keeps resolveData idempotent — Puck compares resolved output
 * to decide whether to dispatch, and an always-fresh metadata object would
 * cascade a re-resolve/re-render on every dispatch for every bound block on
 * the page (study doc §2.6/§4-11).
 */
export function resolveMetadataProp<M extends Record<string, unknown>>(
  current: M | null | undefined,
  next: M | null
): Record<string, never> | { props: { metadata: M | null } } {
  if (next === null) {
    // Clear stored metadata once; afterwards nothing to do.
    return current != null ? { props: { metadata: null } } : {};
  }

  if (current != null && shallowEqual(current, next)) {
    return {};
  }

  return { props: { metadata: next } };
}

function shallowEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every((key) => a[key] === b[key]);
}
