import { getMockDb } from "../db"
import type {
  MockHandlerResult,
  MockRequest,
  MockShippingProviderRecord,
} from "../types"

const envelope = <T>(data: T) => ({
  success: true,
  data,
  message: null,
  timestamp: Date.now(),
})

const toApi = (provider: MockShippingProviderRecord) => ({
  shippingProviderId: provider.shippingProviderId,
  providerCode: provider.providerCode,
  providerName: provider.providerName,
  apiBaseUrl: provider.apiBaseUrl ?? "",
  priority: provider.priority,
  hasApiKey: provider.hasApiKey,
  hasWebhookSecret: provider.hasWebhookSecret,
  isActive: provider.isActive,
  createdAt: provider.createdAt,
  updatedAt: provider.updatedAt,
})

/**
 * Shipping providers list/detail — needed by finance COD filters/create.
 */
export const handleShippingProvidersMock = (
  request: MockRequest
): MockHandlerResult => {
  const method = request.method.toUpperCase()
  const path = request.url.split("?")[0] ?? request.url

  if (method === "GET" && path === "/admin/shipping/providers") {
    return {
      handled: true,
      data: envelope(getMockDb().shippingProviders.map(toApi)),
    }
  }

  const detailMatch = path.match(/^\/admin\/shipping\/providers\/([^/]+)$/)
  if (method === "GET" && detailMatch) {
    const id = decodeURIComponent(detailMatch[1] ?? "")
    const provider = getMockDb().shippingProviders.find(
      (item) => item.shippingProviderId === id
    )
    if (!provider) {
      return {
        handled: true,
        error: {
          status: 404,
          message: "مزود الشحن غير موجود",
          errorCode: "ERR_NOT_FOUND",
        },
      }
    }
    return { handled: true, data: envelope(toApi(provider)) }
  }

  return { handled: false }
}
