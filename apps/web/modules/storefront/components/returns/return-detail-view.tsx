"use client"

import Link from "next/link"

import { useStoreTenant } from "../../lib/store-tenant-context"
import { useCustomerSession } from "../../lib/use-customer-session"
import { OrdersMessage, OrdersSignInRequired } from "../orders/orders-states"

/**
 * Single return request — placeholder.
 *
 * Fills in once the `GET /customer/returns/{returnRequestId}` response
 * structure is confirmed; the call already exists as `getCustomerReturn` in
 * `lib/customer-returns-api.ts`.
 */
export function ReturnDetailView({ returnId }: { returnId: string }) {
	const { basePath } = useStoreTenant()
	const signedIn = useCustomerSession()

	if (signedIn === null) {
		return <OrdersMessage title="جارٍ التحميل…" />
	}

	if (!signedIn) {
		return <OrdersSignInRequired basePath={basePath} />
	}

	return (
		<div className="OrderDetail">
			<Link className="OrdersBack" href={`${basePath}/returns`}>
				← كل المرتجعات
			</Link>
			<div className="OrdersMessage">
				<h2 className="OrdersMessage-title">قيد الإنشاء</h2>
				<p className="OrdersMessage-text">
					ستظهر تفاصيل طلب الإرجاع {returnId} هنا قريباً.
				</p>
			</div>
		</div>
	)
}
