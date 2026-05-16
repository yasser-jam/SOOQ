import CustomerDetailPageView from "@/modules/customer/customer/components/customer-detail-view"

interface CustomerDetailPageProps {
  params: Promise<{ customer_id: string }>
}

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { customer_id } = await params
  return <CustomerDetailPageView customerId={customer_id} />
}
