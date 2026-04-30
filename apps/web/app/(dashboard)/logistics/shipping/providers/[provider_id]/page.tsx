import ShippingProviderUpsertPageView from "@/modules/shipping/provider/components/provider-upsert-page"

export default async function ShippingProviderUpsertPage({
  params,
}: {
  params: Promise<{ provider_id: string }>
}) {
  const { provider_id } = await params

  return <ShippingProviderUpsertPageView providerId={provider_id} />
}
