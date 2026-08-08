import { handleAuthMock } from "./handlers/auth"
import { handleCategoriesMock } from "./handlers/categories"
import { handleCheckoutMock } from "./handlers/checkout"
import { handleCodMock } from "./handlers/cod"
import { handleCollectionsMock } from "./handlers/collections"
import { handleCustomerAuthMock } from "./handlers/customer-auth"
import { handleCustomerOrdersMock } from "./handlers/customer-orders"
import { handleDiscountCodesMock } from "./handlers/discount-codes"
import { handleInvoicesMock } from "./handlers/invoices"
import { handleProductsMock } from "./handlers/products"
import { handleShipmentsMock } from "./handlers/shipments"
import { handleShippingProvidersMock } from "./handlers/shipping-providers"
import { handleStoreSettingsMock } from "./handlers/store-settings"
import { handleTagsMock } from "./handlers/tags"
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

  const customerAuth = handleCustomerAuthMock(request)
  if (customerAuth.handled) return customerAuth

  const customerOrders = handleCustomerOrdersMock(request)
  if (customerOrders.handled) return customerOrders

  const settings = handleStoreSettingsMock(request)
  if (settings.handled) return settings

  const categories = handleCategoriesMock(request)
  if (categories.handled) return categories

  const tags = handleTagsMock(request)
  if (tags.handled) return tags

  const collections = handleCollectionsMock(request)
  if (collections.handled) return collections

  const products = await handleProductsMock(request)
  if (products.handled) return products

  const discountCodes = handleDiscountCodesMock(request)
  if (discountCodes.handled) return discountCodes

  const invoices = handleInvoicesMock(request)
  if (invoices.handled) return invoices

  const shippingProviders = handleShippingProvidersMock(request)
  if (shippingProviders.handled) return shippingProviders

  const shipments = handleShipmentsMock(request)
  if (shipments.handled) return shipments

  const cod = handleCodMock(request)
  if (cod.handled) return cod

  const checkout = handleCheckoutMock(request)
  if (checkout.handled) return checkout

  return { handled: false }
}
