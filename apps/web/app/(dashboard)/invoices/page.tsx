"use client"

import InvoicesTable from "@/modules/order/invoice/components/table"

export default function InvoicesPage() {
	return (
		<div className="container">
			<div className="my-6 flex items-center justify-between">
				<div className="page-title">الفواتير</div>
			</div>

			<InvoicesTable />
		</div>
	)
}
