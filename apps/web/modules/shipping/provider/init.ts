import type { ShippingProvider } from "./types"

export const initShippingProvider = (data?: ShippingProvider): ShippingProvider => {
  return {
    providerCode: data?.providerCode || "",
    providerName: data?.providerName || "",
    apiBaseUrl: data?.apiBaseUrl || "",
    apiKey: data?.apiKey || "",
    webhookSecret: data?.webhookSecret || "",
    priority: data?.priority || 0,
  }
}
