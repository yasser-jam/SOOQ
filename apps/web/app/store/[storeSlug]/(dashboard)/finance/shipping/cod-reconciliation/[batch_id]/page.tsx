import CodBatchDetailPageView from "@/modules/shipping/cod/components/batch-detail-view"

export default async function CodBatchDetailPage({
  params,
}: {
  params: Promise<{ batch_id: string }>
}) {
  const { batch_id } = await params

  return <CodBatchDetailPageView batchId={batch_id} />
}
