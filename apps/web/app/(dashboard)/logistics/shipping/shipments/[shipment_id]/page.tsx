import ShipmentDetailsPageView from "@/modules/shipping/shipment/components/shipment-details-page"

export default async function ShipmentDetailsPage({
  params,
}: {
  params: Promise<{ shipment_id: string }>
}) {
  const { shipment_id } = await params

  return <ShipmentDetailsPageView shipmentId={shipment_id} />
}
