import { isMockApiEnabled } from "./enabled"
import { routeMockRequest } from "./router"
import type { MockApiErrorShape, MockRequest } from "./types"

export { isMockApiEnabled } from "./enabled"
export { resetMockDb, getMockDb } from "./db"
export { createSeedDatabase } from "./seed"
export type { MockDatabase } from "./types"

/**
 * Wipe and reseed the in-browser mock database.
 * Prefer this over deleting localStorage by hand.
 */
export { resetMockDb as reseedMockApi } from "./db"

export class MockApiError extends Error {
  status: number
  errorCode?: string
  fieldKey?: string
  action?: string
  data?: unknown

  constructor(shape: MockApiErrorShape) {
    super(shape.message)
    this.name = "MockApiError"
    this.status = shape.status
    this.errorCode = shape.errorCode
    this.fieldKey = shape.fieldKey
    this.action = shape.action
    this.data = shape.data
  }
}

const normalizeHeaders = (
  headers?: MockRequest["headers"] | Headers | Record<string, unknown>
): Record<string, string | undefined> | undefined => {
  if (!headers) return undefined
  if (headers instanceof Headers) {
    const out: Record<string, string | undefined> = {}
    headers.forEach((value, key) => {
      out[key] = value
    })
    return out
  }
  const out: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(headers)) {
    out[key] = value == null ? undefined : String(value)
  }
  return out
}

/**
 * Try to satisfy an `api()` call from the mock store.
 * - `null` → mock mode off, or path not covered → caller should hit the backend
 * - otherwise returns the envelope / payload the real API would return
 * - throws `MockApiError` for simulated failures
 */
export const tryHandleMockApi = async <T = unknown>(
  url: string,
  options: {
    method?: string
    body?: unknown
    headers?: MockRequest["headers"] | Headers | Record<string, unknown>
  } = {}
): Promise<T | null> => {
  if (!isMockApiEnabled()) return null

  const result = await routeMockRequest({
    method: (options.method ?? "GET").toUpperCase(),
    url,
    body: options.body,
    headers: normalizeHeaders(options.headers),
  })

  if (!result.handled) return null

  if ("error" in result) {
    throw new MockApiError(result.error)
  }

  return result.data as T
}
