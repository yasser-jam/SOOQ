import type {
  ShippingProvider,
  ShippingProviderUpsertPayload,
  UpdateShippingProviderInput,
} from "./types"

const dropEmptyStrings = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value

export const initShippingProviderUpdate = (
  id: string,
  values: ShippingProvider
): UpdateShippingProviderInput => {
  const payload: Partial<ShippingProviderUpsertPayload> = {
    providerCode: values.providerCode,
    providerName: values.providerName,
    apiBaseUrl: dropEmptyStrings(values.apiBaseUrl) as string | undefined,
    apiKey: dropEmptyStrings(values.apiKey) as string | undefined,
    webhookSecret: dropEmptyStrings(values.webhookSecret) as string | undefined,
    priority: values.priority,
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key as keyof typeof payload] === undefined) {
      delete payload[key as keyof typeof payload]
    }
  })

  return { id, data: payload }
}
