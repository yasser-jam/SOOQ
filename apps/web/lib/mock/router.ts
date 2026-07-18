import { handleAuthMock } from "./handlers/auth"
import { handleCategoriesMock } from "./handlers/categories"
import { handleCollectionsMock } from "./handlers/collections"
import { handleProductsMock } from "./handlers/products"
import { handleStoreSettingsMock } from "./handlers/store-settings"
import type { MockHandlerResult, MockRequest } from "./types"

/**
 * Dispatches a mock request to domain handlers. Returns `{ handled: false }`
 * when the path is outside the mock surface so the real backend can run.
 */
export const routeMockRequest = async (
  request: MockRequest
): Promise<MockHandlerResult> => {
  const auth = handleAuthMock(request)
  if (auth.handled) return auth

  const settings = handleStoreSettingsMock(request)
  if (settings.handled) return settings

  const categories = handleCategoriesMock(request)
  if (categories.handled) return categories

  const collections = handleCollectionsMock(request)
  if (collections.handled) return collections

  const products = await handleProductsMock(request)
  if (products.handled) return products

  return { handled: false }
}
