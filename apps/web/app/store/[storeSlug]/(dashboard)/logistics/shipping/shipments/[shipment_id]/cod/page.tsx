import CodShipmentEntriesPageView from "@/modules/shipping/cod/components/cod-shipment-entries-page"

export default async function ShipmentCodEntriesPage({
  params,
}: {
  params: Promise<{ shipment_id: string }>
}) {
  const { shipment_id } = await params

  return <CodShipmentEntriesPageView shipmentId={shipment_id} />
}
