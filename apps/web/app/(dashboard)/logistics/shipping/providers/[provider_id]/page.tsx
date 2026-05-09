import ShippingProviderForm from "@/modules/shipping/provider/components/form"

export default async function ShippingProviderUpsertPage({
  params,
}: {
  params: Promise<{ provider_id: string }>
}) {
  const { provider_id } = await params

  return <ShippingProviderForm providerId={provider_id} />
}
