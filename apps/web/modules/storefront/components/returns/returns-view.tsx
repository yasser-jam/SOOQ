"use client"

import Link from "next/link"

import { useStoreTenant } from "../../lib/store-tenant-context"
import { useCustomerSession } from "../../lib/use-customer-session"
import { OrdersMessage, OrdersSignInRequired } from "../orders/orders-states"

/**
 * Customer returns list — placeholder.
 *
 * The rows/columns land once the `GET /customer/returns` response structure is
 * confirmed; the API call itself already exists as `listCustomerReturns` in
 * `lib/customer-returns-api.ts` (page 0, size 1000 — pagination deferred).
 */
export function ReturnsView() {
	const { basePath } = useStoreTenant()
	const signedIn = useCustomerSession()

	if (signedIn === null) {
		return <OrdersMessage title="جارٍ التحميل…" />
	}

	if (!signedIn) {
		return <OrdersSignInRequired basePath={basePath} />
	}

	return (
		<div className="OrdersMessage">
			<h2 className="OrdersMessage-title">قيد الإنشاء</h2>
			<p className="OrdersMessage-text">
				سيتم عرض طلبات الإرجاع هنا قريباً.
			</p>
			<Link className="OrdersButton" href={`${basePath}/orders`}>
				العودة إلى الطلبات
			</Link>
		</div>
	)
}
