import type { StoreSettingsResponseDto } from "@/modules/store/settings/types"

import { getMockDb, updateMockDb } from "../db"
import { MOCK_STORE_TENANT_ID } from "../seed"
import type { MockHandlerResult, MockRequest } from "../types"

const envelope = <T>(data: T) => ({
  success: true,
  data,
  message: null,
  timestamp: Date.now(),
})

const readBody = (body: unknown): Record<string, unknown> => {
  if (!body || typeof body !== "object" || body instanceof FormData) return {}
  return body as Record<string, unknown>
}

const SETTINGS_PATH = "/admin/store/settings"

export const handleStoreSettingsMock = (
  request: MockRequest
): MockHandlerResult => {
  const method = request.method.toUpperCase()
  const [path, queryString = ""] = request.url.split("?")

  if (method === "GET" && path === `${SETTINGS_PATH}/check-slug`) {
    const params = new URLSearchParams(queryString)
    const slug = (params.get("slug") ?? "").trim().toLowerCase()
    const db = getMockDb()
    const taken =
      !slug ||
      db.reservedSlugs.includes(slug) ||
      (db.settings.slug === slug && db.settings.isConfigured)

    return {
      handled: true,
      data: envelope(!taken),
    }
  }

  if (method === "GET" && path === SETTINGS_PATH) {
    return { handled: true, data: envelope(getMockDb().settings) }
  }

  if (method === "PUT" && path === SETTINGS_PATH) {
    const body = readBody(request.body)
    const next = updateMockDb((db) => {
      const merged: StoreSettingsResponseDto = {
        ...db.settings,
        ...body,
        storeConfigId: db.settings.storeConfigId,
        tenantId: db.settings.tenantId,
      }

      const storeName =
        typeof merged.storeName === "string" ? merged.storeName.trim() : ""
      const slug = typeof merged.slug === "string" ? merged.slug.trim() : ""
      const currency =
        typeof merged.primaryCurrencyCode === "string"
          ? merged.primaryCurrencyCode.trim()
          : ""

      const isConfigured = Boolean(storeName && slug && currency)
      if (isConfigured) {
        merged.storeName = storeName
        merged.slug = slug
        merged.primaryCurrencyCode = currency
        merged.isConfigured = true
        merged.tenantId = MOCK_STORE_TENANT_ID
        if (db.session) {
          db.session.tenantId = MOCK_STORE_TENANT_ID
          db.session.tenantSlug = slug
        }
      }

      db.settings = merged
      return db
    })

    return { handled: true, data: envelope(next.settings) }
  }

  return { handled: false }
}
