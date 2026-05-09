"use client"

import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import InvoiceLayoutsTable from "@/modules/order/invoice-layout/components/table"
import { Button } from "@workspace/ui/components/button"

export default function InvoiceLayoutsPage() {
	const router = useRouter()

	return (
		<div className="container">
			<div className="my-6 flex items-center justify-between">
				<div className="page-title">قوالب الفاتورة</div>

				<Button
					size="md"
					variant="secondary"
					onClick={() => router.push("/invoice-layouts/create")}
				>
					إضافة قالب
					<Plus data-icon="inline-end" />
				</Button>
			</div>

			<InvoiceLayoutsTable />
		</div>
	)
}
