import type { Metadata } from "next"

import { ReturnDetailView } from "@/modules/storefront/components/returns/return-detail-view"

export const metadata: Metadata = {
	title: "تفاصيل طلب الإرجاع",
}

type ReturnDetailPageProps = {
	params: Promise<{ returnId: string }>
}

export default async function PublishedStoreReturnDetailPage({
	params,
}: ReturnDetailPageProps) {
	const { returnId } = await params

	return (
		<main className="OrdersPage">
			<ReturnDetailView returnId={returnId} />
		</main>
	)
}
