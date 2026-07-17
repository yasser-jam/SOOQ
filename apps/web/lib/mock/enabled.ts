/**
 * Mock API mode — when enabled, handled routes are served from an in-browser
 * store (seeded fixtures + localStorage) instead of `NEXT_PUBLIC_API_URL`.
 * Unhandled routes still hit the real backend.
 */
export const isMockApiEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_USE_MOCK_API === "true"
