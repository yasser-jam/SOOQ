"use client"

import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { useStorePath } from "@/lib/store-path"
import PaymentProvidersTable from "@/modules/payment/provider/components/table"
import { Button } from "@workspace/ui/components/button"

export default function PaymentProvidersPage() {
	const router = useRouter()
	const storePath = useStorePath()

	return (
		<div className="container">
			<div className="my-6 flex items-center justify-between">
				<div className="page-title">بوابات الدفع</div>

				<Button
					size="md"
					variant="secondary"
					onClick={() => router.push(storePath("/payment-providers/create"))}
				>
					إضافة بوابة
					<Plus data-icon="inline-end" />
				</Button>
			</div>

			<PaymentProvidersTable />
		</div>
	)
}
